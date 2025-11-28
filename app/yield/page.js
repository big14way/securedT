'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Spin, Typography, Space, Tooltip, Progress } from 'antd';
import {
    DollarOutlined,
    LineChartOutlined,
    ClockCircleOutlined,
    RiseOutlined,
    ThunderboltOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { formatUnits } from 'viem';
import { STABLECOIN_DECIMALS } from '../constants';
import { getBuyerYieldEscrows, isYieldEscrowAvailable } from '../util/yieldEscrowContract';
import { useWalletAddress } from '../hooks/useWalletAddress';

const { Title, Text, Paragraph } = Typography;

// mETH Protocol APY (from docs: ~7.2%)
const METH_APY = 7.2;

export default function YieldPage() {
    const { address: walletAddress } = useWalletAddress();
    const [loading, setLoading] = useState(false);
    const [yieldEscrows, setYieldEscrows] = useState([]);
    const [totalStats, setTotalStats] = useState({
        tvl: 0,
        totalYield: 0,
        activeEscrows: 0,
        avgAPY: METH_APY
    });

    useEffect(() => {
        if (walletAddress && isYieldEscrowAvailable()) {
            loadYieldData();
        }
    }, [walletAddress]);

    const loadYieldData = async () => {
        setLoading(true);
        try {
            // Load REAL yield-enabled escrows from blockchain
            const escrows = await getBuyerYieldEscrows(walletAddress);

            // Filter only yield-enabled active escrows
            const yieldEnabledEscrows = escrows.filter(e => e.yieldEnabled && e.status === 0);

            // Transform to table format
            const tableData = yieldEnabledEscrows.map(escrow => {
                const amount = parseFloat(escrow.amount);
                const createdAt = new Date(escrow.createdAt);
                const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

                // Calculate estimated yield: amount * APY * (daysActive / 365)
                const estimatedYield = amount * (METH_APY / 100) * (daysActive / 365);
                const projectedYield = amount * (METH_APY / 100); // Full year projection

                return {
                    escrowId: escrow.id.toString(),
                    amount: amount.toString(),
                    depositDate: createdAt,
                    daysActive,
                    estimatedYield: estimatedYield.toFixed(2),
                    projectedYield: projectedYield.toFixed(2),
                    mETHStaked: escrow.cmETHAmount || '0', // Real cMETH amount from contract
                    status: escrow.statusText
                };
            });

            setYieldEscrows(tableData);

            // Calculate totals from REAL data
            const tvl = tableData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const totalYield = tableData.reduce((sum, e) => sum + parseFloat(e.estimatedYield), 0);

            setTotalStats({
                tvl,
                totalYield,
                activeEscrows: tableData.length,
                avgAPY: METH_APY
            });

        } catch (error) {
            console.error('Error loading yield data:', error);
            // On error, show empty state
            setYieldEscrows([]);
            setTotalStats({
                tvl: 0,
                totalYield: 0,
                activeEscrows: 0,
                avgAPY: METH_APY
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateYieldSplit = (totalYield) => {
        return {
            buyer: (totalYield * 0.80).toFixed(2),
            seller: (totalYield * 0.15).toFixed(2),
            platform: (totalYield * 0.05).toFixed(2)
        };
    };

    const columns = [
        {
            title: 'Escrow ID',
            dataIndex: 'escrowId',
            key: 'escrowId',
            render: (id) => <Text strong>#{id}</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `$${parseFloat(amount).toLocaleString()}`
        },
        {
            title: 'Deposit Date',
            dataIndex: 'depositDate',
            key: 'depositDate',
            render: (date) => date.toLocaleDateString()
        },
        {
            title: 'Days Active',
            dataIndex: 'daysActive',
            key: 'daysActive',
            render: (days) => (
                <Tag color="blue">
                    <ClockCircleOutlined /> {days} days
                </Tag>
            )
        },
        {
            title: 'mETH Staked',
            dataIndex: 'mETHStaked',
            key: 'mETHStaked',
            render: (amount) => (
                <Tooltip title="mETH is a value-accumulating token from Mantle Protocol">
                    <Text>{amount} mETH</Text>
                </Tooltip>
            )
        },
        {
            title: 'Accrued Yield',
            dataIndex: 'estimatedYield',
            key: 'estimatedYield',
            render: (yield_) => (
                <Text strong style={{ color: '#52c41a' }}>
                    +${yield_}
                </Text>
            )
        },
        {
            title: 'Projected (Full Year)',
            dataIndex: 'projectedYield',
            key: 'projectedYield',
            render: (yield_) => (
                <Text type="secondary">
                    ${yield_} <small>(7.2% APY)</small>
                </Text>
            )
        },
        {
            title: 'Yield Split',
            key: 'split',
            render: (_, record) => {
                const split = calculateYieldSplit(parseFloat(record.estimatedYield));
                return (
                    <Tooltip 
                        title={
                            <div>
                                <div>Buyer (80%): ${split.buyer}</div>
                                <div>Seller (15%): ${split.seller}</div>
                                <div>Platform (5%): ${split.platform}</div>
                            </div>
                        }
                    >
                        <Button size="small" icon={<InfoCircleOutlined />}>
                            View Split
                        </Button>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color="green" icon={<ThunderboltOutlined />}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    size="small"
                    onClick={() => window.location.href = `/escrow/${record.escrowId}`}
                >
                    Release & Claim
                </Button>
            )
        }
    ];

    if (!walletAddress) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Card>
                    <DollarOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 20 }} />
                    <Title level={3}>Connect Wallet to View Yield Dashboard</Title>
                    <Paragraph type="secondary">
                        Connect your wallet to see your yield-generating escrows and earnings from mETH staking.
                    </Paragraph>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <LineChartOutlined /> Yield Dashboard
                </Title>
                <Paragraph type="secondary">
                    Track your yield-generating escrows powered by Mantle's mETH Protocol. 
                    Escrowed funds are staked in mETH to earn ~7.2% APY while maintaining payment security.
                </Paragraph>
            </div>

            {/* Info Banner */}
            <Card 
                style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={18}>
                        <Space direction="vertical" size={4}>
                            <Title level={4} style={{ color: 'white', margin: 0 }}>
                                <ThunderboltOutlined /> mETH Protocol Integration
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                                Your escrowed funds are staked in Mantle's mETH liquid staking protocol. 
                                Withdrawals require a minimum 12-hour unstaking period.
                            </Text>
                        </Space>
                    </Col>
                    <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                        <Button 
                            size="large" 
                            style={{ background: 'white', color: '#667eea', border: 'none' }}
                            href="https://www.methprotocol.xyz/"
                            target="_blank"
                        >
                            Learn More
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Value Locked (TVL)"
                            value={totalStats.tvl}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#1890ff' }}
                            suffix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Yield Accrued"
                            value={totalStats.totalYield}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#52c41a' }}
                            suffix={<RiseOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Active Yield Escrows"
                            value={totalStats.activeEscrows}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Current mETH APY"
                            value={totalStats.avgAPY}
                            precision={1}
                            suffix="%"
                            valueStyle={{ color: '#fa8c16' }}
                            prefix={<LineChartOutlined />}
                        />
                        <Progress 
                            percent={72} 
                            showInfo={false} 
                            strokeColor="#fa8c16"
                            style={{ marginTop: 8 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Yield Distribution Explainer */}
            <Card 
                title={<><InfoCircleOutlined /> Yield Distribution</>}
                style={{ marginBottom: 24 }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card type="inner">
                            <Statistic
                                title="Buyer Share"
                                value={80}
                                suffix="%"
                                valueStyle={{ color: '#1890ff' }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                You paid for the escrow, you get the majority of yield
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card type="inner">
                            <Statistic
                                title="Seller Share"
                                value={15}
                                suffix="%"
                                valueStyle={{ color: '#52c41a' }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Seller receives bonus for accepting yield-enabled escrow
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card type="inner">
                            <Statistic
                                title="Platform Fee"
                                value={5}
                                suffix="%"
                                valueStyle={{ color: '#fa8c16' }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Covers gas costs and protocol maintenance
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* Yield Escrows Table */}
            <Card 
                title={<><RiseOutlined /> Your Yield-Generating Escrows</>}
                loading={loading}
            >
                {yieldEscrows.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={yieldEscrows}
                        rowKey="escrowId"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 'max-content' }}
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <ThunderboltOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 20 }} />
                        <Title level={4} type="secondary">No Yield-Generating Escrows</Title>
                        <Paragraph type="secondary">
                            Create an escrow with "Enable Yield Generation" to start earning 7.2% APY on your escrowed funds.
                        </Paragraph>
                        <Button type="primary" size="large" href="/escrow">
                            Create Yield Escrow
                        </Button>
                    </div>
                )}
            </Card>

            {/* Important Notes */}
            <Card 
                title="⚠️ Important Information"
                style={{ marginTop: 24 }}
                type="inner"
            >
                <Space direction="vertical" size={12}>
                    <Text>
                        <strong>Unstaking Period:</strong> When you release or refund a yield-enabled escrow, 
                        there is a minimum 12-hour delay for mETH unstaking (up to 40+ days depending on Ethereum validator queue).
                    </Text>
                    <Text>
                        <strong>mETH Protocol Fee:</strong> mETH Protocol charges a 0.04% (4 bps) fee on deposits 
                        and approximately 10% of staking rewards.
                    </Text>
                    <Text>
                        <strong>Exchange Rate:</strong> mETH is a value-accumulating token. 
                        1 mETH ≠ 1 ETH but appreciates over time as staking rewards accrue.
                    </Text>
                    <Text>
                        <strong>Risk:</strong> While mETH is secured by blue-chip protocols (Aave, Ethereum staking), 
                        DeFi always carries smart contract risk. Only enable yield if you're comfortable with this.
                    </Text>
                </Space>
            </Card>
        </div>
    );
}
