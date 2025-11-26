'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Table, Tag, Alert, Tabs, Modal, InputNumber, message } from 'antd';
import { 
    EyeOutlined, 
    DollarOutlined, 
    SafetyCertificateTwoTone, 
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined,
    LinkOutlined,
    FileTextOutlined,
    ShoppingOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '../constants';
import { 
    isContractAvailable, 
    getBuyerEscrows, 
    getSellerEscrows,
    EscrowStatus,
    getStatusText as getContractStatusText,
    isFraudOracle,
    isFraudOracleConfigured
} from '../util/securedTransferContract';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { useBlockscout } from '../hooks/useBlockscout';
import { siteConfig, PYUSD_TOKEN_ADDRESS } from '../constants';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

export default function MyEscrowsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [escrows, setEscrows] = useState([]);
    const [buyerEscrows, setBuyerEscrows] = useState([]);
    const [sellerEscrows, setSellerEscrows] = useState([]);
    const [isUserFraudOracle, setIsUserFraudOracle] = useState(false);
    const [isFraudOracleActive, setIsFraudOracleActive] = useState(false);
    const [oracleCheckComplete, setOracleCheckComplete] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [listModalVisible, setListModalVisible] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [listPrice, setListPrice] = useState(0);
    const { address: walletAddress } = useWalletAddress();
    const { 
        showContractTransactions, 
        showAddressTransactions,
        showTokenTransactions 
    } = useBlockscout();

    // Load escrows from contract if available
    useEffect(() => {
        const loadEscrows = async () => {
            if (!isContractAvailable() || !walletAddress) {
                console.log('Contract not available or no wallet connected');
                setEscrows([]);
                setBuyerEscrows([]);
                setSellerEscrows([]);
                return;
            }

            setLoading(true);
            try {
                const [buyerData, sellerData] = await Promise.all([
                    getBuyerEscrows(walletAddress),
                    getSellerEscrows(walletAddress)
                ]);
                
                setBuyerEscrows(buyerData);
                setSellerEscrows(sellerData);
                setEscrows([...buyerData, ...sellerData]);
            } catch (error) {
                console.error('Error loading escrows:', error);
                // Fallback to empty arrays on error
                setBuyerEscrows([]);
                setSellerEscrows([]);
                setEscrows([]);
            } finally {
                setLoading(false);
            }
        };

        loadEscrows();
    }, [walletAddress]);

    // Load user's invoice NFTs
    useEffect(() => {
        const loadInvoices = async () => {
            const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
            
            if (!invoiceNFTAddress || !walletAddress) {
                setInvoices([]);
                return;
            }

            setLoadingInvoices(true);
            try {
                const { createPublicClient, http, formatUnits } = await import('viem');
                const { ACTIVE_CHAIN, STABLECOIN_DECIMALS } = await import('../constants');
                
                const publicClient = createPublicClient({
                    chain: ACTIVE_CHAIN,
                    transport: http()
                });

                const INVOICE_NFT_ABI = [
                    {
                        "inputs": [{"type": "address", "name": "owner"}],
                        "name": "getInvoicesByOwner",
                        "outputs": [{"type": "uint256[]"}],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [{"type": "uint256", "name": "tokenId"}],
                        "name": "getInvoice",
                        "outputs": [{
                            "type": "tuple",
                            "components": [
                                {"type": "uint256", "name": "escrowId"},
                                {"type": "uint256", "name": "amount"},
                                {"type": "uint256", "name": "dueDate"},
                                {"type": "address", "name": "issuer"},
                                {"type": "address", "name": "payer"},
                                {"type": "address", "name": "currentOwner"},
                                {"type": "uint8", "name": "status"},
                                {"type": "uint256", "name": "listedPrice"},
                                {"type": "uint256", "name": "createdAt"}
                            ]
                        }],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ];

                const tokenIds = await publicClient.readContract({
                    address: invoiceNFTAddress,
                    abi: INVOICE_NFT_ABI,
                    functionName: 'getInvoicesByOwner',
                    args: [walletAddress]
                });

                const invoicesData = await Promise.all(
                    tokenIds.map(async (tokenId) => {
                        const invoice = await publicClient.readContract({
                            address: invoiceNFTAddress,
                            abi: INVOICE_NFT_ABI,
                            functionName: 'getInvoice',
                            args: [tokenId]
                        });

                        return {
                            tokenId: tokenId.toString(),
                            escrowId: invoice.escrowId.toString(),
                            amount: formatUnits(invoice.amount, STABLECOIN_DECIMALS),
                            listedPrice: invoice.listedPrice > 0 ? formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS) : null,
                            dueDate: new Date(Number(invoice.dueDate) * 1000).toLocaleDateString(),
                            issuer: invoice.issuer,
                            payer: invoice.payer,
                            status: ['Active', 'Released', 'Refunded', 'Listed'][invoice.status],
                            rawAmount: invoice.amount,
                            rawListedPrice: invoice.listedPrice
                        };
                    })
                );

                setInvoices(invoicesData);
            } catch (error) {
                console.error('Error loading invoices:', error);
                setInvoices([]);
            } finally {
                setLoadingInvoices(false);
            }
        };

        loadInvoices();
    }, [walletAddress]);

    const handleListInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        const suggestedPrice = parseFloat(invoice.amount) * 0.95; // Suggest 5% discount
        setListPrice(suggestedPrice);
        setListModalVisible(true);
    };

    const confirmListInvoice = async () => {
        if (!selectedInvoice || !listPrice) return;

        try {
            message.loading('Listing invoice for sale...', 0);

            const { createWalletClient, custom, parseUnits: viemParseUnits } = await import('viem');
            const { ACTIVE_CHAIN, STABLECOIN_DECIMALS } = await import('../constants');
            
            const walletClient = createWalletClient({
                chain: ACTIVE_CHAIN,
                transport: custom(window.ethereum)
            });

            const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
            const listPriceWei = viemParseUnits(listPrice.toString(), STABLECOIN_DECIMALS);

            const INVOICE_NFT_ABI = [
                {
                    "inputs": [{"type": "uint256", "name": "tokenId"}, {"type": "uint256", "name": "price"}],
                    "name": "listInvoiceForSale",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            const tx = await walletClient.writeContract({
                address: invoiceNFTAddress,
                abi: INVOICE_NFT_ABI,
                functionName: 'listInvoiceForSale',
                args: [BigInt(selectedInvoice.tokenId), listPriceWei],
                account: walletAddress
            });

            message.destroy();
            message.success('Invoice listed for sale successfully!');
            setListModalVisible(false);
            
            // Reload invoices
            window.location.reload();

        } catch (error) {
            message.destroy();
            console.error('Error listing invoice:', error);
            message.error(error.message || 'Failed to list invoice');
        }
    };

    // Check if user is fraud oracle
    useEffect(() => {
        const checkFraudOracle = async () => {
            setOracleCheckComplete(false);
            
            if (!walletAddress) {
                setIsUserFraudOracle(false);
                setIsFraudOracleActive(false);
                setOracleCheckComplete(true);
                return;
            }
            
            if (!isContractAvailable()) {
                setIsUserFraudOracle(false);
                setIsFraudOracleActive(false);
                setOracleCheckComplete(true);
                return;
            }
            
            try {
                const isConfigured = await isFraudOracleConfigured();
                setIsFraudOracleActive(isConfigured);
                
                if (isConfigured) {
                    const isOracle = await isFraudOracle(walletAddress);
                    setIsUserFraudOracle(isOracle);
                } else {
                    setIsUserFraudOracle(false);
                }
            } catch (error) {
                console.error('Error checking fraud oracle status:', error);
                setIsUserFraudOracle(false);
                setIsFraudOracleActive(false);
            } finally {
                setOracleCheckComplete(true);
            }
        };
        
        checkFraudOracle();
    }, [walletAddress]);

    const getStatusColor = (status) => {
        // Handle both old mock format and new contract format
        if (typeof status === 'number') {
            // Contract enum values
            switch (status) {
                case EscrowStatus.Active: return 'blue';
                case EscrowStatus.Released: return 'green';
                case EscrowStatus.Refunded: return 'red';
                case EscrowStatus.FraudFlagged: return 'red';
                default: return 'default';
            }
        } else {
            // Legacy mock format
            switch (status) {
                case 'active': return 'blue';
                case 'pending_release': return 'orange';
                case 'completed': return 'green';
                case 'refunded': return 'red';
                default: return 'default';
            }
        }
    };

    const getStatusText = (status, statusText) => {
        // Use statusText if provided (from contract), otherwise map legacy status
        if (statusText) return statusText;
        
        if (typeof status === 'number') {
            return getContractStatusText(status);
        } else {
            // Legacy mock format
            switch (status) {
                case 'active': return 'Active Escrow';
                case 'pending_release': return 'Pending Release';
                case 'completed': return 'Completed';
                case 'refunded': return 'Refunded';
                default: return status;
            }
        }
    };

    const columns = [
        {
            title: 'Escrow ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text code>{id}</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <Space>
                    <DollarOutlined style={{ color: '#00aef2' }} />
                    <Text strong>${amount} USDT</Text>
                </Space>
            )
        },
        {
            title: 'Counterparty',
            key: 'counterparty',
            render: (record) => {
                // Determine counterparty based on wallet address
                let counterparty = '';
                let role = '';
                
                if (walletAddress && record.buyer && record.seller) {
                    if (record.buyer.toLowerCase() === walletAddress.toLowerCase()) {
                        counterparty = record.seller;
                        role = 'buyer';
                    } else if (record.seller.toLowerCase() === walletAddress.toLowerCase()) {
                        counterparty = record.buyer;
                        role = 'seller';
                    } else {
                        // Fallback to record.role if available (for mock data)
                        counterparty = record.role === 'buyer' ? record.seller : record.buyer;
                        role = record.role;
                    }
                } else {
                    // Fallback for mock data format
                    counterparty = record.role === 'buyer' ? record.seller : record.buyer;
                    role = record.role || 'buyer';
                }
                
                return <Text code>{counterparty}</Text>;
            }
        },
        {
            title: 'Role',
            key: 'role',
            render: (record) => {
                let role = '';
                
                if (walletAddress && record.buyer && record.seller) {
                    if (record.buyer.toLowerCase() === walletAddress.toLowerCase()) {
                        role = 'buyer';
                    } else if (record.seller.toLowerCase() === walletAddress.toLowerCase()) {
                        role = 'seller';
                    } else {
                        role = record.role || 'buyer';
                    }
                } else {
                    role = record.role || 'buyer';
                }
                
                return (
                    <Tag color={role === 'buyer' ? 'blue' : 'green'}>
                        {role.toUpperCase()}
                    </Tag>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Space>
                    <Tag color={getStatusColor(status)}>
                        {getStatusText(status, record.statusText)}
                    </Tag>
                    {record.fraudFlagged && (
                        <Tag color="red" icon={<ExclamationCircleOutlined />} size="small">
                            Fraud
                        </Tag>
                    )}
                </Space>
            )
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => router.push(`/escrow/${record.id}`)}
                >
                    View Details
                </Button>
            )
        }
    ];

    // Filter escrows by status
    const activeEscrows = isContractAvailable() 
        ? escrows.filter(e => e.status === EscrowStatus.Active)
        : []; // Show empty state if contract not available
        
    const completedEscrows = isContractAvailable()
        ? escrows.filter(e => e.status === EscrowStatus.Released || e.status === EscrowStatus.Refunded)
        : []; // Show empty state if contract not available

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <Space align="center" style={{ marginBottom: '16px' }}>
                    <Title level={1} style={{ margin: 0 }}>My Escrows</Title>
                    {isUserFraudOracle && (
                        <Tag color="purple" icon={<SafetyCertificateTwoTone />}>
                            Fraud Oracle
                        </Tag>
                    )}
                </Space>
                <Paragraph style={{ fontSize: '16px', color: '#666' }}>
                    Manage your USDT escrow transactions with built-in compliance and fraud protection
                </Paragraph>
            </div>

            {/* Blockscout Transaction Monitoring */}
            <Card 
                title="View history"
                size="small" 
                style={{ marginBottom: '16px' }}
                actions={[
                    <Button 
                        key="contract" 
                        type="link" 
                        icon={<HistoryOutlined />}
                        onClick={() => isContractAvailable() && siteConfig.contractAddress && showContractTransactions(siteConfig.contractAddress)}
                        disabled={!isContractAvailable() || !siteConfig.contractAddress}
                    >
                        Contract Activity
                    </Button>,
                    <Button 
                        key="pyusd" 
                        type="link" 
                        icon={<LinkOutlined />}
                        onClick={() => showTokenTransactions(PYUSD_TOKEN_ADDRESS)}
                    >
                        USDT Transactions
                    </Button>,
                    <Button 
                        key="wallet" 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => walletAddress && showAddressTransactions(walletAddress, undefined, 'My Wallet')}
                        disabled={!walletAddress}
                    >
                        My Wallet Activity
                    </Button>
                ]}
            >
                {/* <Text type="secondary">
                    Monitor real-time transaction activity powered by Blockscout explorer integration
                </Text> */}
            </Card>

            {walletAddress && oracleCheckComplete && !isFraudOracleActive && isContractAvailable() && (
                <Alert
                    message="No Fraud Oracle Configured"
                    description="The contract owner has not configured a fraud oracle. Fraud protection features are disabled."
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            <Tabs defaultActiveKey="active" size="large"
                loading={loading}
            >
                <TabPane 
                    tab={
                        <Space>
                            <ClockCircleOutlined />
                            Active Escrows ({activeEscrows.length})
                        </Space>
                    } 
                    key="active"
                >
                    <Card>
                        <Table
                            columns={columns}
                            dataSource={activeEscrows}
                            rowKey="id"
                            pagination={false}
                            locale={{
                                emptyText: (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <SafetyCertificateTwoTone twoToneColor="#d9d9d9" style={{ fontSize: '48px', marginBottom: '16px' }} />
                                        <Title level={4} style={{ color: '#999' }}>No Active Escrows</Title>
                                        <Paragraph style={{ color: '#666' }}>
                                            You don't have any active escrow transactions.
                                        </Paragraph>
                                        <Button 
                                            type="primary" 
                                            onClick={() => router.push('/escrow')}
                                        >
                                            Create New Escrow
                                        </Button>&nbsp; 
                                            <Button 
                                            type="secondary"
                        onClick={() => router.push('/about')}
                    >
                        Learn More
                    </Button>
                                    </div>
                                )
                            }}
                        />
                    </Card>
                </TabPane>

                <TabPane 
                    tab={
                        <Space>
                            <CheckCircleOutlined />
                            Completed ({completedEscrows.length})
                        </Space>
                    } 
                    key="completed"
                >
                    <Card>
                        <Table
                            columns={columns}
                            dataSource={completedEscrows}
                            rowKey="id"
                            pagination={false}
                        />
                    </Card>
                </TabPane>

                <TabPane 
                    tab={
                        <Space>
                            <FileTextOutlined />
                            My Invoices ({invoices.length})
                        </Space>
                    } 
                    key="invoices"
                >
                    <Card title="Invoice NFTs" extra={
                        <Button 
                            type="primary"
                            icon={<ShoppingOutlined />}
                            onClick={() => router.push('/marketplace')}
                        >
                            View Marketplace
                        </Button>
                    }>
                        {process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS ? (
                            <Table
                                loading={loadingInvoices}
                                dataSource={invoices}
                                rowKey="tokenId"
                                pagination={false}
                                columns={[
                                    {
                                        title: 'Token ID',
                                        dataIndex: 'tokenId',
                                        key: 'tokenId',
                                        render: (tokenId) => <Tag color="blue">#{tokenId}</Tag>
                                    },
                                    {
                                        title: 'Escrow ID',
                                        dataIndex: 'escrowId',
                                        key: 'escrowId',
                                        render: (escrowId) => (
                                            <Button 
                                                type="link" 
                                                size="small"
                                                onClick={() => router.push(`/escrow/${escrowId}`)}
                                            >
                                                #{escrowId}
                                            </Button>
                                        )
                                    },
                                    {
                                        title: 'Amount (USDT)',
                                        dataIndex: 'amount',
                                        key: 'amount',
                                        render: (amount) => <Text strong>${amount}</Text>
                                    },
                                    {
                                        title: 'Listed Price',
                                        dataIndex: 'listedPrice',
                                        key: 'listedPrice',
                                        render: (price) => price ? <Text type="success">${price}</Text> : <Text type="secondary">Not listed</Text>
                                    },
                                    {
                                        title: 'Due Date',
                                        dataIndex: 'dueDate',
                                        key: 'dueDate',
                                        render: (date) => <Text><ClockCircleOutlined /> {date}</Text>
                                    },
                                    {
                                        title: 'Status',
                                        dataIndex: 'status',
                                        key: 'status',
                                        render: (status) => {
                                            const colors = {
                                                'Active': 'blue',
                                                'Listed': 'green',
                                                'Released': 'default',
                                                'Refunded': 'red'
                                            };
                                            return <Tag color={colors[status] || 'default'}>{status}</Tag>;
                                        }
                                    },
                                    {
                                        title: 'Actions',
                                        key: 'actions',
                                        render: (record) => (
                                            <Space>
                                                {record.status === 'Active' && (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<DollarOutlined />}
                                                        onClick={() => handleListInvoice(record)}
                                                    >
                                                        List for Sale
                                                    </Button>
                                                )}
                                                {record.status === 'Listed' && (
                                                    <Tag color="success">Listed on Marketplace</Tag>
                                                )}
                                            </Space>
                                        )
                                    }
                                ]}
                                locale={{
                                    emptyText: (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                                            <Title level={4} style={{ color: '#999' }}>No Invoice NFTs</Title>
                                            <Paragraph style={{ color: '#666' }}>
                                                Create an escrow to automatically mint an invoice NFT
                                            </Paragraph>
                                            <Button 
                                                type="primary" 
                                                onClick={() => router.push('/escrow')}
                                            >
                                                Create Escrow
                                            </Button>
                                        </div>
                                    )
                                }}
                            />
                        ) : (
                            <Alert
                                message="Invoice NFT Not Deployed"
                                description="The Invoice NFT contract has not been deployed yet. Invoice tokenization features are not available."
                                type="info"
                                showIcon
                            />
                        )}
                    </Card>
                </TabPane>

                {isUserFraudOracle && isFraudOracleActive && (
                    <TabPane 
                        tab={
                            <Space>
                                <SafetyCertificateTwoTone />
                                Oracle Functions
                            </Space>
                        } 
                        key="oracle"
                    >
                        <Card title="Fraud Oracle Dashboard" size="small">
                            <Alert
                                message="Fraud Oracle Access"
                                description="You have fraud oracle permissions. You can monitor and flag fraudulent escrows."
                                type="info"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                            <Paragraph>
                                As a fraud oracle, you can:
                            </Paragraph>
                            <ul>
                                <li>Monitor all escrow transactions</li>
                                <li>Mark fraudulent escrows (triggers automatic refund)</li>
                                <li>Initiate refunds on behalf of buyers</li>
                            </ul>
                            <Paragraph type="secondary">
                                All escrows with active status are available for fraud monitoring.
                                Click "View Details" on any escrow to access oracle functions.
                            </Paragraph>
                        </Card>
                    </TabPane>
                )}
            </Tabs>

            {/* List Invoice Modal */}
            <Modal
                title="List Invoice for Sale"
                open={listModalVisible}
                onOk={confirmListInvoice}
                onCancel={() => setListModalVisible(false)}
                okText="List Invoice"
            >
                {selectedInvoice && (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <Text>Invoice Token ID: </Text>
                            <Tag color="blue">#{selectedInvoice.tokenId}</Tag>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <Text>Original Amount: </Text>
                            <Text strong>${selectedInvoice.amount} USDT</Text>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <Text>List Price (USDT):</Text>
                            <InputNumber
                                style={{ width: '100%', marginTop: '8px' }}
                                value={listPrice}
                                onChange={setListPrice}
                                min={1}
                                max={parseFloat(selectedInvoice.amount)}
                                precision={2}
                                prefix="$"
                            />
                        </div>

                        {listPrice > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <Text>Discount: </Text>
                                <Tag color="green">
                                    {((parseFloat(selectedInvoice.amount) - listPrice) / parseFloat(selectedInvoice.amount) * 100).toFixed(2)}%
                                </Tag>
                            </div>
                        )}

                        <Alert
                            message="Invoice Factoring"
                            description="By listing your invoice at a discounted price, you get instant liquidity. The buyer will receive the full amount when the escrow is released."
                            type="info"
                            showIcon
                            style={{ marginTop: '16px' }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}