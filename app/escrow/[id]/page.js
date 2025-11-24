'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Space, Button, Alert, Tag, Descriptions, Steps, Timeline, message } from 'antd';
import { 
    DollarOutlined, 
    UserOutlined, 
    SafetyCertificateTwoTone,
    CheckCircleOutlined,
    WarningOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined,
    LinkOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { 
    getEscrow, 
    releaseEscrow, 
    refundEscrow, 
    isContractAvailable,
    EscrowStatus,
    getStatusText as getContractStatusText,
    getFraudOracle,
    markFraud,
    isFraudOracle,
    isFraudOracleConfigured,
    getComplianceInfo,
    getAMLRiskScore
} from '../../util/securedTransferContract';
import { useWalletClient } from '../../hooks/useWalletClient';
import { useWalletAddress } from '../../hooks/useWalletAddress';
import { useBlockscout } from '../../hooks/useBlockscout';
import { siteConfig, PYUSD_TOKEN_ADDRESS, ACTIVE_CHAIN, getExplorerUrl } from '../../constants';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const KYC_LEVELS = {
    0: { name: 'None', color: 'default', icon: '❌' },
    1: { name: 'Basic', color: 'blue', icon: '✓' },
    2: { name: 'Advanced', color: 'green', icon: '✓✓' },
    3: { name: 'Institutional', color: 'gold', icon: '⭐' }
};

const getRiskLevel = (score) => {
    if (score === 0) return { level: 'Unknown', color: 'default' };
    if (score < 30) return { level: 'Low', color: 'success' };
    if (score < 60) return { level: 'Medium', color: 'warning' };
    if (score < 80) return { level: 'High', color: 'error' };
    return { level: 'Critical', color: 'error' };
};

export default function EscrowDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [escrowData, setEscrowData] = useState(null);
    const [error, setError] = useState(null);
    const [fraudOracleAddress, setFraudOracleAddress] = useState(null);
    const [isUserFraudOracle, setIsUserFraudOracle] = useState(false);
    const [isFraudOracleActive, setIsFraudOracleActive] = useState(false);
    const [buyerCompliance, setBuyerCompliance] = useState(null);
    const [sellerCompliance, setSellerCompliance] = useState(null);
    const [loadingCompliance, setLoadingCompliance] = useState(true);
    const walletClient = useWalletClient();
    const { address: walletAddress } = useWalletAddress();
    const { 
        showTransactionToast, 
        showContractTransactions, 
        showAddressTransactions,
        showTokenTransactions 
    } = useBlockscout();

    // Load escrow data from contract
    useEffect(() => {
        // Don't load if no escrow ID
        if (!params.id) {
            console.log('No params.id, skipping load');
            setError('No escrow ID provided');
            setLoading(false);
            return;
        }

        const loadEscrowData = async () => {
            setLoading(true);
            setError(null);
            
            // Check if contract is available
            if (!isContractAvailable()) {
                const errorMessage = 'Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS environment variable.';
                console.error(errorMessage);
                setError(errorMessage);
                setEscrowData(null);
                setLoading(false);
                return;
            }

            // Load from contract
            try {
                const escrowId = parseInt(params.id);
                
                if (isNaN(escrowId) || escrowId <= 0) {
                    throw new Error(`Invalid escrow ID: ${params.id}. Please provide a valid numeric escrow ID.`);
                }
                
                console.log('Loading escrow from contract:', escrowId);
                const data = await getEscrow(escrowId);
                console.log('Escrow data loaded successfully:', data);
                
                setEscrowData(data);
                setError(null);
            } catch (error) {
                console.error('Error loading escrow:', error);
                
                let errorMessage = 'Failed to load escrow data';
                if (error.message.includes('Escrow does not exist')) {
                    errorMessage = `Escrow #${params.id} does not exist. Please check the escrow ID and try again.`;
                } else if (error.message.includes('Invalid escrow ID')) {
                    errorMessage = error.message;
                } else if (error.message.includes('Contract not available')) {
                    errorMessage = 'Contract is not available. Please check your network connection and contract configuration.';
                } else {
                    errorMessage = `Error loading escrow: ${error.message}`;
                }
                
                setError(errorMessage);
                setEscrowData(null);
            } finally {
                setLoading(false);
            }
        };

        loadEscrowData();
    }, [params.id]);

    // Load fraud oracle information
    useEffect(() => {
        const loadFraudOracleInfo = async () => {
            if (!isContractAvailable()) {
                console.log('Contract not available, skipping fraud oracle check');
                return;
            }

            if (!walletAddress) {
                console.log('No wallet address, skipping fraud oracle check');
                return;
            }

            try {
                const isConfigured = await isFraudOracleConfigured();
                setIsFraudOracleActive(isConfigured);
                
                if (isConfigured) {
                    const oracleAddress = await getFraudOracle();
                    setFraudOracleAddress(oracleAddress);
                    
                    const isOracle = await isFraudOracle(walletAddress);
                    setIsUserFraudOracle(isOracle);
                } else {
                    setFraudOracleAddress(null);
                    setIsUserFraudOracle(false);
                }
            } catch (error) {
                console.error('Error loading fraud oracle info:', error);
                setIsFraudOracleActive(false);
                setFraudOracleAddress(null);
                setIsUserFraudOracle(false);
            }
        };

        loadFraudOracleInfo();
    }, [walletAddress]);

    // Load compliance information for buyer and seller
    useEffect(() => {
        const loadComplianceInfo = async () => {
            if (!escrowData || !isContractAvailable()) {
                setLoadingCompliance(false);
                return;
            }

            try {
                setLoadingCompliance(true);
                const [buyerInfo, sellerInfo] = await Promise.all([
                    getComplianceInfo(escrowData.buyer),
                    getComplianceInfo(escrowData.seller)
                ]);
                
                setBuyerCompliance(buyerInfo);
                setSellerCompliance(sellerInfo);
            } catch (error) {
                console.error('Error loading compliance info:', error);
            } finally {
                setLoadingCompliance(false);
            }
        };

        loadComplianceInfo();
    }, [escrowData]);

    const handleRelease = async () => {
        if (!walletClient) {
            message.error('Please connect your wallet first');
            return;
        }

        if (!isContractAvailable()) {
            message.error('Contract not available. Please check configuration.');
            return;
        }

        setLoading(true);
        try {
            console.log('Releasing funds for escrow:', params.id);
            const hash = await releaseEscrow(walletClient, parseInt(params.id));
            message.success('Funds released successfully!');
            console.log('Transaction hash:', hash);
            
            // Show transaction notification in Blockscout (non-blocking)
            if (hash) {
                showTransactionToast(hash);
            }
            
            // Refresh escrow data
            window.location.reload();
        } catch (error) {
            console.error('Release failed:', error);
            message.error(error.message || 'Failed to release funds');
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!walletClient) {
            message.error('Please connect your wallet first');
            return;
        }

        if (!isContractAvailable()) {
            message.error('Contract not available. Please check configuration.');
            return;
        }

        setLoading(true);
        try {
            console.log('Processing refund for escrow:', params.id);
            const hash = await refundEscrow(walletClient, parseInt(params.id));
            message.success('Refund processed successfully!');
            console.log('Transaction hash:', hash);
            
            // Show transaction notification in Blockscout (non-blocking)
            if (hash) {
                showTransactionToast(hash);
            }
            
            // Refresh escrow data
            window.location.reload();
        } catch (error) {
            console.error('Refund failed:', error);
            message.error(error.message || 'Failed to process refund');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkFraud = async () => {
        if (!walletClient) {
            message.error('Please connect your wallet first');
            return;
        }

        if (!isContractAvailable()) {
            message.error('Contract not available. Please check configuration.');
            return;
        }

        if (!isUserFraudOracle) {
            message.error('Only the fraud oracle can mark escrows as fraudulent');
            return;
        }

        setLoading(true);
        try {
            console.log('Marking fraud for escrow:', params.id);
            const hash = await markFraud(walletClient, parseInt(params.id));
            message.success('Escrow marked as fraudulent and funds refunded to buyer!');
            console.log('Transaction hash:', hash);
            
            // Show transaction notification in Blockscout (non-blocking)
            if (hash) {
                showTransactionToast(hash);
            }
            
            // Refresh escrow data
            window.location.reload();
        } catch (error) {
            console.error('Mark fraud failed:', error);
            message.error(error.message || 'Failed to mark fraud');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        // Handle both numeric (contract) and string (mock) status values
        if (typeof status === 'number') {
            switch (status) {
                case EscrowStatus.Active: return 'blue';
                case EscrowStatus.Released: return 'green';
                case EscrowStatus.Refunded: return 'red';
                case EscrowStatus.FraudFlagged: return 'red';
                default: return 'default';
            }
        } else {
            // Legacy string format for mock data
            switch (status) {
                case 'active': return 'blue';
                case 'pending_release': return 'orange';
                case 'completed': return 'green';
                default: return 'default';
            }
        }
    };

    // Helper functions to determine user roles
    const isBuyer = () => {
        return walletAddress && escrowData && 
               walletAddress.toLowerCase() === escrowData.buyer.toLowerCase();
    };

    const isSeller = () => {
        return walletAddress && escrowData && 
               walletAddress.toLowerCase() === escrowData.seller.toLowerCase();
    };

    const canRelease = () => {
        return isBuyer() && escrowData && 
               (escrowData.status === EscrowStatus.Active || escrowData.status === 'active') &&
               !escrowData.fraudFlagged;
    };

    const canRefund = () => {
        return (isBuyer() || isUserFraudOracle) && escrowData && 
               (escrowData.status === EscrowStatus.Active || escrowData.status === 'active');
    };

    const canMarkFraud = () => {
        return isUserFraudOracle && escrowData && 
               (escrowData.status === EscrowStatus.Active || escrowData.status === 'active') &&
               !escrowData.fraudFlagged;
    };

    const getStatusText = (status, statusText) => {
        if (statusText) return statusText;
        
        if (typeof status === 'number') {
            return getContractStatusText(status);
        } else {
            // Legacy format
            switch (status) {
                case 'active': return 'Active';
                case 'completed': return 'Completed';
                case 'refunded': return 'Refunded';
                case 'fraud_flagged': return 'Fraud Flagged';
                default: return status;
            }
        }
    };

    // Debug: Log render state
    console.log('Render - loading:', loading, 'error:', error, 'hasData:', !!escrowData);

    // Handle loading state
    if (loading) {
        return (
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.push('/my-escrows')}
                        style={{ marginBottom: '16px' }}
                    >
                        Back to My Escrows
                    </Button>
                </div>
                <Card loading={true} style={{ minHeight: '400px' }} />
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.push('/my-escrows')}
                        style={{ marginBottom: '16px' }}
                    >
                        Back to My Escrows
                    </Button>
                </div>
                
                <Card>
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <ExclamationCircleOutlined 
                            style={{ fontSize: '64px', color: '#ff4d4f', marginBottom: '24px' }} 
                        />
                        <Title level={3} type="danger">Escrow #{params.id} Not Found</Title>
                        <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
                            {error}
                        </Paragraph>
                        
                        {error.includes('Escrow does not exist') && (
                            <Alert
                                message="Escrow ID Not Found"
                                description="This escrow ID may not exist yet, or it might have been created on a different network. Make sure you're on the correct network and the escrow ID is valid."
                                type="info"
                                showIcon
                                style={{ marginBottom: '24px', textAlign: 'left' }}
                            />
                        )}
                        
                        <Space>
                            <Button 
                                type="primary" 
                                onClick={() => router.push('/my-escrows')}
                                icon={<ArrowLeftOutlined />}
                            >
                                View My Escrows
                            </Button>
                            <Button 
                                onClick={() => router.push('/escrow')}
                                icon={<DollarOutlined />}
                            >
                                Create New Escrow
                            </Button>
                            <Button 
                                onClick={() => window.location.reload()}
                                loading={loading}
                            >
                                Retry
                            </Button>
                        </Space>
                    </div>
                </Card>
            </div>
        );
    }

    // Handle case where no data and no error (shouldn't happen, but safety check)
    if (!escrowData) {
        return (
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
                <Card loading={true} style={{ minHeight: '400px' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => router.push('/my-escrows')}
                    style={{ marginBottom: '16px' }}
                >
                    Back to My Escrows
                </Button>
                {/* <Text code style={{ fontSize: '16px' }}>{escrowData.id}</Text> */}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Main Content */}
                <div>
                    <Card title="Escrow Information" style={{ marginBottom: '24px' }}>
                        <Descriptions column={1} size="large">
                            <Descriptions.Item label="Status">
                                <Tag color={getStatusColor(escrowData.status)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                                    {getStatusText(escrowData.status, escrowData.statusText)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Amount">
                                <Space>
                                    <DollarOutlined style={{ color: '#00aef2' }} />
                                    <Text strong style={{ fontSize: '18px' }}>${escrowData.amount} PYUSD</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Buyer">
                                <Space>
                                    <Text code>{escrowData.buyer}</Text>
                                    {isBuyer() && <Tag color="blue" size="small">You</Tag>}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Seller">
                                <Space>
                                    <Text code>{escrowData.seller}</Text>
                                    {isSeller() && <Tag color="green" size="small">You</Tag>}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Description">
                                <Text>{escrowData.description}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created">
                                <Text>{new Date(escrowData.createdAt).toLocaleString()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Escrow ID">
                                <Text code>#{escrowData.id}</Text>
                                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                                    (Search for this ID in contract transactions)
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="Transaction Timeline">
                        <Timeline>
                            {(escrowData?.events || []).map((event, index) => (
                                <Timeline.Item 
                                    key={index}
                                    dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                >
                                    <div>
                                        <Text strong>{event.type}</Text>
                                        <br />
                                        <Text type="secondary">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </Text>
                                        <br />
                                        <Text>{event.description}</Text>
                                        {event.txHash && (
                                            <>
                                                <br />
                                                <Text code style={{ fontSize: '12px' }}>{event.txHash}</Text>
                                            </>
                                        )}
                                    </div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>
                </div>

                {/* Sidebar */}
                <div>
                    <Card title="Actions" style={{ marginBottom: '24px' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {canRelease() && (
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    block
                                    onClick={handleRelease}
                                    loading={loading}
                                    icon={<CheckCircleOutlined />}
                                >
                                    Release Funds
                                </Button>
                            )}
                            {canRefund() && (
                                <Button 
                                    danger 
                                    size="large" 
                                    block
                                    onClick={handleRefund}
                                    loading={loading}
                                    icon={<WarningOutlined />}
                                >
                                    Request Refund
                                </Button>
                            )}
                            {canMarkFraud() && (
                                <Button 
                                    danger 
                                    size="large" 
                                    block
                                    onClick={handleMarkFraud}
                                    loading={loading}
                                    icon={<WarningOutlined />}
                                    type="dashed"
                                >
                                    Mark as Fraud
                                </Button>
                            )}
                            {isContractAvailable() && (
                                <Button 
                                    size="large" 
                                    block
                                    href={`${getExplorerUrl()}/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?tab=txs`}
                                    target="_blank"
                                    icon={<LinkOutlined />}
                                    title={`View all contract transactions on Blockscout. Filter by escrow ID #${escrowData.id} to find related transactions.`}
                                >
                                    View on Blockscout
                                </Button>
                            )}
                        </Space>
                    </Card>

                    <Card title="Compliance & Risk" size="small" style={{ marginBottom: '24px' }} loading={loadingCompliance}>
                        {!loadingCompliance && buyerCompliance && sellerCompliance && (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Buyer KYC:</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Tag color={KYC_LEVELS[buyerCompliance.level].color}>
                                            {KYC_LEVELS[buyerCompliance.level].icon} {KYC_LEVELS[buyerCompliance.level].name}
                                        </Tag>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        Risk Score: {buyerCompliance.riskScore}/100
                                        <Tag 
                                            color={getRiskLevel(buyerCompliance.riskScore).color} 
                                            style={{ marginLeft: 4, fontSize: '10px' }}
                                        >
                                            {getRiskLevel(buyerCompliance.riskScore).level}
                                        </Tag>
                                    </Text>
                                </div>

                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Seller KYC:</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Tag color={KYC_LEVELS[sellerCompliance.level].color}>
                                            {KYC_LEVELS[sellerCompliance.level].icon} {KYC_LEVELS[sellerCompliance.level].name}
                                        </Tag>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        Risk Score: {sellerCompliance.riskScore}/100
                                        <Tag 
                                            color={getRiskLevel(sellerCompliance.riskScore).color} 
                                            style={{ marginLeft: 4, fontSize: '10px' }}
                                        >
                                            {getRiskLevel(sellerCompliance.riskScore).level}
                                        </Tag>
                                    </Text>
                                </div>

                                {(buyerCompliance.riskScore > 80 || sellerCompliance.riskScore > 80) && (
                                    <Alert
                                        message="High Risk Detected"
                                        description="One or more parties have a high AML risk score"
                                        type="error"
                                        showIcon
                                        style={{ marginTop: 8 }}
                                    />
                                )}

                                {(buyerCompliance.level === 0 || sellerCompliance.level === 0) && (
                                    <Alert
                                        message="KYC Not Verified"
                                        description="One or more parties have not completed KYC"
                                        type="warning"
                                        showIcon
                                        style={{ marginTop: 8 }}
                                    />
                                )}
                            </Space>
                        )}
                    </Card>

                    <Card title="Fraud Protection" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SafetyCertificateTwoTone 
                                    twoToneColor={isFraudOracleActive ? "#52c41a" : "#d9d9d9"} 
                                    style={{ fontSize: '16px' }} 
                                />
                                <Text>
                                    {isFraudOracleActive ? 'Oracle monitoring active' : 'No fraud oracle configured'}
                                </Text>
                                {isUserFraudOracle && (
                                    <Tag color="blue" size="small">You are the fraud oracle</Tag>
                                )}
                            </div>
                            {isFraudOracleActive && fraudOracleAddress && (
                                <div style={{ fontSize: '12px' }}>
                                    <Text type="secondary">
                                        Fraud oracle: 
                                    </Text>
                                    <a 
                                        href={`${getExplorerUrl()}/address/${fraudOracleAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ marginLeft: '4px' }}
                                    >
                                        <Text code>{fraudOracleAddress.slice(0, 6)}...{fraudOracleAddress.slice(-4)}</Text>
                                    </a>
                                </div>
                            )}
                            {!isFraudOracleActive && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Contract owner has not configured a fraud oracle. Fraud protection disabled.
                                </Text>
                            )}
                            {isFraudOracleActive && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Automatic refund if fraud detected
                                </Text>
                            )}
                            {escrowData.fraudFlagged && (
                                <Alert
                                    message="Fraud Detected"
                                    description="This escrow has been flagged as fraudulent by the oracle"
                                    type="error"
                                    showIcon
                                    size="small"
                                />
                            )}
                        </Space>
                    </Card>
                </div>
            </div>
        </div>
    );
}