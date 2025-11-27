'use client';

import React, { useState, useEffect } from 'react';
import { App, Card, Typography, Space, Button, Table, Tag, Statistic, Row, Col, Slider, InputNumber, Modal, Alert, Progress, Tooltip } from 'antd';
import { 
    DollarOutlined, 
    RiseOutlined,
    WarningOutlined,
    SafetyOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { useWalletClient } from '../hooks/useWalletClient';
import DemoModeAlert from '../lib/DemoModeAlert';
import ConnectButton from '../lib/ConnectButton';

const { Title, Paragraph, Text } = Typography;

// Mock data for demonstration
const MOCK_COLLATERALIZED_ESCROWS = [
    {
        id: 10001,
        description: 'Website redesign project',
        collateralValue: 10000,
        borrowLimit: 8000,
        borrowed: 6000,
        available: 2000,
        healthFactor: 1.33,
        interestRate: 5.2,
        status: 'active'
    },
    {
        id: 10002,
        description: 'Mobile app development',
        collateralValue: 5000,
        borrowLimit: 4000,
        borrowed: 3500,
        available: 500,
        healthFactor: 1.14,
        interestRate: 5.2,
        status: 'active'
    },
    {
        id: 10003,
        description: 'Marketing campaign',
        collateralValue: 15000,
        borrowLimit: 12000,
        borrowed: 0,
        available: 12000,
        healthFactor: Infinity,
        interestRate: 5.2,
        status: 'active'
    }
];

export default function CollateralDashboard() {
    const { message } = App.useApp();
    const router = useRouter();
    const { address: walletAddress, isConnected } = useWalletAddress();
    const walletClient = useWalletClient();
    const [loading, setLoading] = useState(false);
    const [collateralizedEscrows, setCollateralizedEscrows] = useState([]);
    const [borrowModalVisible, setBorrowModalVisible] = useState(false);
    const [repayModalVisible, setRepayModalVisible] = useState(false);
    const [selectedEscrow, setSelectedEscrow] = useState(null);
    const [borrowAmount, setBorrowAmount] = useState(0);
    const [repayAmount, setRepayAmount] = useState(0);

    // Load collateralized escrows
    useEffect(() => {
        const loadCollateralizedEscrows = async () => {
            if (!walletAddress) {
                setCollateralizedEscrows([]);
                return;
            }

            setLoading(true);
            try {
                // TODO: Replace with actual contract call
                // const escrows = await getCollateralizedEscrows(walletAddress);
                
                // Use mock data for now
                await new Promise(resolve => setTimeout(resolve, 1000));
                setCollateralizedEscrows(MOCK_COLLATERALIZED_ESCROWS);
            } catch (error) {
                console.error('Error loading collateralized escrows:', error);
                message.error('Failed to load collateralized escrows');
                setCollateralizedEscrows([]);
            } finally {
                setLoading(false);
            }
        };

        loadCollateralizedEscrows();
    }, [walletAddress]);

    const getHealthFactorColor = (healthFactor) => {
        if (healthFactor === Infinity || healthFactor > 2) return '#52c41a';
        if (healthFactor > 1.5) return '#faad14';
        if (healthFactor > 1.2) return '#ff7a45';
        return '#ff4d4f';
    };

    const getHealthFactorStatus = (healthFactor) => {
        if (healthFactor === Infinity || healthFactor > 2) return 'Safe';
        if (healthFactor > 1.5) return 'Good';
        if (healthFactor > 1.2) return 'Warning';
        return 'Risk';
    };

    const handleBorrow = (escrow) => {
        setSelectedEscrow(escrow);
        setBorrowAmount(0);
        setBorrowModalVisible(true);
    };

    const handleRepay = (escrow) => {
        setSelectedEscrow(escrow);
        setRepayAmount(0);
        setRepayModalVisible(true);
    };

    const executeBorrow = async () => {
        if (!walletClient || !selectedEscrow) {
            message.error('Please connect your wallet');
            return;
        }

        if (borrowAmount <= 0 || borrowAmount > selectedEscrow.available) {
            message.error('Invalid borrow amount');
            return;
        }

        setLoading(true);
        try {
            // TODO: Replace with actual contract call
            // await borrowAgainstEscrow(walletClient, selectedEscrow.id, borrowAmount);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            message.success(`Successfully borrowed $${borrowAmount.toLocaleString()} USDT`);
            setBorrowModalVisible(false);
            
            // Refresh data
            window.location.reload();
        } catch (error) {
            console.error('Borrow failed:', error);
            message.error(error.message || 'Failed to borrow');
        } finally {
            setLoading(false);
        }
    };

    const executeRepay = async () => {
        if (!walletClient || !selectedEscrow) {
            message.error('Please connect your wallet');
            return;
        }

        if (repayAmount <= 0 || repayAmount > selectedEscrow.borrowed) {
            message.error('Invalid repay amount');
            return;
        }

        setLoading(true);
        try {
            // TODO: Replace with actual contract call
            // await repayBorrowed(walletClient, selectedEscrow.id, repayAmount);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            message.success(`Successfully repaid $${repayAmount.toLocaleString()} USDT`);
            setRepayModalVisible(false);
            
            // Refresh data
            window.location.reload();
        } catch (error) {
            console.error('Repay failed:', error);
            message.error(error.message || 'Failed to repay');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Escrow ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => (
                <Button 
                    type="link" 
                    onClick={() => router.push(`/escrow/${id}`)}
                    style={{ padding: 0 }}
                >
                    #{id}
                </Button>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Collateral',
            dataIndex: 'collateralValue',
            key: 'collateralValue',
            render: (value) => <Text strong>${value.toLocaleString()}</Text>
        },
        {
            title: 'Borrowed',
            key: 'borrowed',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>${record.borrowed.toLocaleString()}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        of ${record.borrowLimit.toLocaleString()}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Available',
            dataIndex: 'available',
            key: 'available',
            render: (value) => (
                <Text type="success" strong>${value.toLocaleString()}</Text>
            )
        },
        {
            title: 'Health Factor',
            dataIndex: 'healthFactor',
            key: 'healthFactor',
            render: (healthFactor) => {
                const displayValue = healthFactor === Infinity ? '∞' : healthFactor.toFixed(2);
                const color = getHealthFactorColor(healthFactor);
                const status = getHealthFactorStatus(healthFactor);
                
                return (
                    <Tooltip title={`${status} - ${healthFactor === Infinity ? 'No debt' : 'Collateral / Debt ratio'}`}>
                        <Tag color={color}>
                            {displayValue}
                        </Tag>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Interest',
            dataIndex: 'interestRate',
            key: 'interestRate',
            render: (rate) => <Text>{rate}% APY</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.available > 0 && (
                        <Button 
                            type="primary" 
                            size="small"
                            onClick={() => handleBorrow(record)}
                        >
                            Borrow
                        </Button>
                    )}
                    {record.borrowed > 0 && (
                        <Button 
                            size="small"
                            onClick={() => handleRepay(record)}
                        >
                            Repay
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    const totalCollateral = collateralizedEscrows.reduce((sum, e) => sum + e.collateralValue, 0);
    const totalBorrowed = collateralizedEscrows.reduce((sum, e) => sum + e.borrowed, 0);
    const totalAvailable = collateralizedEscrows.reduce((sum, e) => sum + e.available, 0);
    const overallHealthFactor = totalBorrowed > 0 ? (totalCollateral * 0.8) / totalBorrowed : Infinity;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Title level={1}>
                    <SafetyOutlined style={{ marginRight: 8 }} />
                    Collateral Management
                </Title>
                <Paragraph style={{ fontSize: '18px', color: '#666' }}>
                    Borrow against your escrowed funds for working capital financing via INIT Capital
                </Paragraph>
            </div>

            <DemoModeAlert 
                description="This demonstrates INIT Capital integration for borrowing against escrowed funds. In production, this connects to INIT Capital's lending protocol."
            />

            {!isConnected ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <SafetyOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
                        <Title level={3}>Connect Your Wallet</Title>
                        <Paragraph style={{ marginBottom: 24 }}>
                            Connect your wallet to view and manage your collateralized escrows
                        </Paragraph>
                        <ConnectButton />
                    </div>
                </Card>
            ) : (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Total Collateral"
                                    value={totalCollateral}
                                    prefix="$"
                                    suffix="USDT"
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Total Borrowed"
                                    value={totalBorrowed}
                                    prefix="$"
                                    suffix="USDT"
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Available to Borrow"
                                    value={totalAvailable}
                                    prefix="$"
                                    suffix="USDT"
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Overall Health"
                                    value={overallHealthFactor === Infinity ? '∞' : overallHealthFactor.toFixed(2)}
                                    valueStyle={{ color: getHealthFactorColor(overallHealthFactor) }}
                                    suffix={
                                        <Tag color={getHealthFactorColor(overallHealthFactor)} style={{ marginLeft: 8 }}>
                                            {getHealthFactorStatus(overallHealthFactor)}
                                        </Tag>
                                    }
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card 
                        title="Collateralized Escrows"
                        extra={
                            <Button 
                                type="primary"
                                icon={<DollarOutlined />}
                                onClick={() => router.push('/my-escrows')}
                            >
                                View All Escrows
                            </Button>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={collateralizedEscrows}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            locale={{
                                emptyText: (
                                    <div style={{ padding: '40px', textAlign: 'center' }}>
                                        <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                        <Title level={4}>No Collateralized Escrows</Title>
                                        <Paragraph>
                                            You haven't deposited any escrows as collateral yet.
                                        </Paragraph>
                                        <Button 
                                            type="primary"
                                            onClick={() => router.push('/my-escrows')}
                                        >
                                            Go to My Escrows
                                        </Button>
                                    </div>
                                )
                            }}
                        />
                    </Card>

                    <Card style={{ marginTop: 24 }} title="How It Works">
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={8}>
                                <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                                    <SafetyOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                                    <Title level={4}>1. Deposit as Collateral</Title>
                                    <Text>Deposit your active escrow funds as collateral on INIT Capital</Text>
                                </Space>
                            </Col>
                            <Col xs={24} md={8}>
                                <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                                    <DollarOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                                    <Title level={4}>2. Borrow Working Capital</Title>
                                    <Text>Borrow up to 80% of your collateral value at competitive rates</Text>
                                </Space>
                            </Col>
                            <Col xs={24} md={8}>
                                <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                                    <CheckCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
                                    <Title level={4}>3. Repay & Release</Title>
                                    <Text>Repay your loan and release the escrow funds to complete payment</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </>
            )}

            {/* Borrow Modal */}
            <Modal
                title={`Borrow Against Escrow #${selectedEscrow?.id}`}
                open={borrowModalVisible}
                onCancel={() => setBorrowModalVisible(false)}
                onOk={executeBorrow}
                okText="Borrow"
                confirmLoading={loading}
                width={600}
            >
                {selectedEscrow && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Alert
                            message="Borrow Against Collateral"
                            description={`You can borrow up to $${selectedEscrow.available.toLocaleString()} USDT (80% LTV)`}
                            type="info"
                            showIcon
                        />

                        <div>
                            <Text strong style={{ marginBottom: 8, display: 'block' }}>
                                Borrow Amount (USDT)
                            </Text>
                            <Slider
                                min={0}
                                max={selectedEscrow.available}
                                value={borrowAmount}
                                onChange={setBorrowAmount}
                                marks={{
                                    0: '$0',
                                    [selectedEscrow.available]: `$${selectedEscrow.available.toLocaleString()}`
                                }}
                            />
                            <InputNumber
                                style={{ width: '100%', marginTop: 16 }}
                                min={0}
                                max={selectedEscrow.available}
                                value={borrowAmount}
                                onChange={setBorrowAmount}
                                prefix="$"
                                suffix="USDT"
                            />
                        </div>

                        <Card size="small" style={{ background: '#f5f5f5' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Interest Rate:</Text>
                                    <Text strong>{selectedEscrow.interestRate}% APY</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Estimated Monthly Payment:</Text>
                                    <Text strong>${((borrowAmount * selectedEscrow.interestRate / 100) / 12).toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>New Health Factor:</Text>
                                    <Text strong style={{ color: getHealthFactorColor((selectedEscrow.collateralValue * 0.8) / (selectedEscrow.borrowed + borrowAmount)) }}>
                                        {borrowAmount > 0 
                                            ? ((selectedEscrow.collateralValue * 0.8) / (selectedEscrow.borrowed + borrowAmount)).toFixed(2)
                                            : '∞'
                                        }
                                    </Text>
                                </div>
                            </Space>
                        </Card>

                        {borrowAmount > 0 && (selectedEscrow.collateralValue * 0.8) / (selectedEscrow.borrowed + borrowAmount) < 1.2 && (
                            <Alert
                                message="Warning: Low Health Factor"
                                description="Your health factor will be below 1.2, increasing liquidation risk. Consider borrowing less."
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                            />
                        )}
                    </Space>
                )}
            </Modal>

            {/* Repay Modal */}
            <Modal
                title={`Repay Loan for Escrow #${selectedEscrow?.id}`}
                open={repayModalVisible}
                onCancel={() => setRepayModalVisible(false)}
                onOk={executeRepay}
                okText="Repay"
                confirmLoading={loading}
                width={600}
            >
                {selectedEscrow && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Alert
                            message="Repay Outstanding Debt"
                            description={`Outstanding debt: $${selectedEscrow.borrowed.toLocaleString()} USDT`}
                            type="info"
                            showIcon
                        />

                        <div>
                            <Text strong style={{ marginBottom: 8, display: 'block' }}>
                                Repay Amount (USDT)
                            </Text>
                            <Slider
                                min={0}
                                max={selectedEscrow.borrowed}
                                value={repayAmount}
                                onChange={setRepayAmount}
                                marks={{
                                    0: '$0',
                                    [selectedEscrow.borrowed]: `$${selectedEscrow.borrowed.toLocaleString()}`
                                }}
                            />
                            <InputNumber
                                style={{ width: '100%', marginTop: 16 }}
                                min={0}
                                max={selectedEscrow.borrowed}
                                value={repayAmount}
                                onChange={setRepayAmount}
                                prefix="$"
                                suffix="USDT"
                            />
                        </div>

                        <Card size="small" style={{ background: '#f5f5f5' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Current Debt:</Text>
                                    <Text strong>${selectedEscrow.borrowed.toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Remaining After Repayment:</Text>
                                    <Text strong>${(selectedEscrow.borrowed - repayAmount).toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>New Health Factor:</Text>
                                    <Text strong style={{ color: getHealthFactorColor((selectedEscrow.collateralValue * 0.8) / Math.max(1, selectedEscrow.borrowed - repayAmount)) }}>
                                        {repayAmount >= selectedEscrow.borrowed
                                            ? '∞'
                                            : ((selectedEscrow.collateralValue * 0.8) / (selectedEscrow.borrowed - repayAmount)).toFixed(2)
                                        }
                                    </Text>
                                </div>
                            </Space>
                        </Card>

                        {repayAmount >= selectedEscrow.borrowed && (
                            <Alert
                                message="Full Repayment"
                                description="You're repaying the full loan amount. You can now release the escrow funds."
                                type="success"
                                showIcon
                                icon={<CheckCircleOutlined />}
                            />
                        )}
                    </Space>
                )}
            </Modal>
        </div>
    );
}
