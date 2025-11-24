'use client';

import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Tag, 
    Button, 
    Space, 
    Typography, 
    Alert, 
    Select, 
    Input,
    Statistic,
    Row,
    Col,
    Badge,
    Tooltip,
    message
} from 'antd';
import { 
    DownloadOutlined, 
    SearchOutlined, 
    FilterOutlined,
    DashboardOutlined,
    SafetyOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { 
    getBuyerEscrows, 
    getSellerEscrows, 
    getComplianceInfo,
    getAMLRiskScore,
    isContractAvailable 
} from '../util/securedTransferContract';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const KYC_LEVELS = {
    0: { name: 'None', color: 'default', icon: '❌', badge: 'default' },
    1: { name: 'Basic', color: 'blue', icon: '✓', badge: 'processing' },
    2: { name: 'Advanced', color: 'green', icon: '✓✓', badge: 'success' },
    3: { name: 'Institutional', color: 'gold', icon: '⭐', badge: 'warning' }
};

const getRiskLevel = (score) => {
    if (score === 0) return { level: 'Unknown', color: 'default', status: 'default' };
    if (score < 30) return { level: 'Low', color: 'success', status: 'success' };
    if (score < 60) return { level: 'Medium', color: 'warning', status: 'warning' };
    if (score < 80) return { level: 'High', color: 'error', status: 'error' };
    return { level: 'Critical', color: 'error', status: 'error' };
};

export default function ComplianceDashboard() {
    const router = useRouter();
    const { address: walletAddress, isConnected } = useWalletAddress();
    const [loading, setLoading] = useState(true);
    const [escrows, setEscrows] = useState([]);
    const [filteredEscrows, setFilteredEscrows] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('all');
    const [userCompliance, setUserCompliance] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        flagged: 0,
        highRisk: 0,
        noKyc: 0
    });

    useEffect(() => {
        if (walletAddress && isContractAvailable()) {
            loadComplianceData();
        } else {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        filterEscrows();
    }, [searchText, statusFilter, riskFilter, escrows]);

    const loadComplianceData = async () => {
        try {
            setLoading(true);
            
            // Load user's compliance info
            const complianceInfo = await getComplianceInfo(walletAddress);
            setUserCompliance(complianceInfo);

            // Load user's escrows (both as buyer and seller)
            const buyerEscrowIds = await getBuyerEscrows(walletAddress);
            const sellerEscrowIds = await getSellerEscrows(walletAddress);
            
            // Combine and get details
            const allEscrowIds = [...new Set([...buyerEscrowIds, ...sellerEscrowIds])];
            
            // Fetch real escrow details with compliance data
            const escrowsWithCompliance = await Promise.all(
                allEscrowIds.slice(0, 10).map(async (id) => {
                    try {
                        // Get real escrow details from blockchain
                        const escrow = await getEscrow(id);
                        
                        // Get real compliance info for buyer and seller
                        const [buyerCompliance, sellerCompliance] = await Promise.all([
                            getComplianceInfo(escrow.buyer),
                            getComplianceInfo(escrow.seller)
                        ]);
                        
                        // Get AML risk scores
                        const [buyerRiskScore, sellerRiskScore] = await Promise.all([
                            getAMLRiskScore(escrow.buyer),
                            getAMLRiskScore(escrow.seller)
                        ]);
                        
                        const isFlagged = escrow.fraudFlagged || 
                                        buyerRiskScore > 80 || 
                                        sellerRiskScore > 80 || 
                                        buyerCompliance.level === 0;

                        return {
                            id: Number(id),
                            buyer: escrow.buyer,
                            seller: escrow.seller,
                            amount: (Number(escrow.amount) / 1e6).toFixed(2), // Convert from 6 decimals
                            buyerKycLevel: buyerCompliance.level,
                            sellerKycLevel: sellerCompliance.level,
                            buyerRiskScore: Number(buyerRiskScore),
                            sellerRiskScore: Number(sellerRiskScore),
                            status: getStatusText(escrow.status),
                            createdAt: new Date(Number(escrow.createdAt) * 1000).toLocaleDateString(),
                            isFlagged
                        };
                    } catch (error) {
                        console.error(`Error loading escrow ${id}:`, error);
                        return null;
                    }
                })
            );
            
            // Filter out any failed loads
            const validEscrows = escrowsWithCompliance.filter(e => e !== null);

            setEscrows(validEscrows);
            
            // Calculate statistics
            const flagged = validEscrows.filter(e => e.isFlagged).length;
            const highRisk = validEscrows.filter(e => 
                e.buyerRiskScore > 60 || e.sellerRiskScore > 60
            ).length;
            const noKyc = validEscrows.filter(e => 
                e.buyerKycLevel === 0 || e.sellerKycLevel === 0
            ).length;

            setStats({
                total: validEscrows.length,
                flagged,
                highRisk,
                noKyc
            });

        } catch (error) {
            console.error('Error loading compliance data:', error);
            message.error('Failed to load compliance data');
        } finally {
            setLoading(false);
        }
    };

    const filterEscrows = () => {
        let filtered = [...escrows];

        // Search filter
        if (searchText) {
            filtered = filtered.filter(e => 
                e.id.toString().includes(searchText) ||
                e.buyer.toLowerCase().includes(searchText.toLowerCase()) ||
                e.seller.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'flagged') {
                filtered = filtered.filter(e => e.isFlagged);
            } else {
                filtered = filtered.filter(e => e.status === statusFilter);
            }
        }

        // Risk filter
        if (riskFilter !== 'all') {
            filtered = filtered.filter(e => {
                const maxRisk = Math.max(e.buyerRiskScore, e.sellerRiskScore);
                const riskLevel = getRiskLevel(maxRisk).level;
                return riskLevel === riskFilter;
            });
        }

        setFilteredEscrows(filtered);
    };

    const exportToCSV = () => {
        const headers = [
            'Escrow ID',
            'Buyer',
            'Seller',
            'Amount',
            'Buyer KYC Level',
            'Seller KYC Level',
            'Buyer Risk Score',
            'Seller Risk Score',
            'Status',
            'Created At',
            'Flagged'
        ];

        const rows = filteredEscrows.map(e => [
            e.id,
            e.buyer,
            e.seller,
            e.amount,
            KYC_LEVELS[e.buyerKycLevel].name,
            KYC_LEVELS[e.sellerKycLevel].name,
            e.buyerRiskScore,
            e.sellerRiskScore,
            e.status,
            e.createdAt,
            e.isFlagged ? 'Yes' : 'No'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        message.success('Compliance report exported successfully');
    };

    const columns = [
        {
            title: 'Escrow ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            render: (id, record) => (
                <Space>
                    <Button 
                        type="link" 
                        onClick={() => router.push(`/escrow/${id}`)}
                        style={{ padding: 0 }}
                    >
                        #{id}
                    </Button>
                    {record.isFlagged && (
                        <Tooltip title="Transaction flagged for review">
                            <WarningOutlined style={{ color: '#ff4d4f' }} />
                        </Tooltip>
                    )}
                </Space>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (amount) => `$${Number(amount).toLocaleString()}`
        },
        {
            title: 'Buyer KYC',
            dataIndex: 'buyerKycLevel',
            key: 'buyerKycLevel',
            width: 120,
            render: (level) => (
                <Tag color={KYC_LEVELS[level].color}>
                    {KYC_LEVELS[level].icon} {KYC_LEVELS[level].name}
                </Tag>
            )
        },
        {
            title: 'Seller KYC',
            dataIndex: 'sellerKycLevel',
            key: 'sellerKycLevel',
            width: 120,
            render: (level) => (
                <Tag color={KYC_LEVELS[level].color}>
                    {KYC_LEVELS[level].icon} {KYC_LEVELS[level].name}
                </Tag>
            )
        },
        {
            title: 'Buyer Risk',
            dataIndex: 'buyerRiskScore',
            key: 'buyerRiskScore',
            width: 120,
            render: (score) => {
                const risk = getRiskLevel(score);
                return (
                    <Tooltip title={`AML Risk Score: ${score}/100`}>
                        <Badge status={risk.status} text={`${risk.level} (${score})`} />
                    </Tooltip>
                );
            }
        },
        {
            title: 'Seller Risk',
            dataIndex: 'sellerRiskScore',
            key: 'sellerRiskScore',
            width: 120,
            render: (score) => {
                const risk = getRiskLevel(score);
                return (
                    <Tooltip title={`AML Risk Score: ${score}/100`}>
                        <Badge status={risk.status} text={`${risk.level} (${score})`} />
                    </Tooltip>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => {
                const statusColors = {
                    'Active': 'blue',
                    'Released': 'green',
                    'Refunded': 'orange',
                    'Flagged': 'red'
                };
                return <Tag color={statusColors[status]}>{status}</Tag>;
            }
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120
        }
    ];

    if (!isConnected) {
        return (
            <div style={{ maxWidth: 1400, margin: '48px auto', padding: '0 24px' }}>
                <Alert
                    message="Wallet Not Connected"
                    description="Please connect your wallet to access the compliance dashboard."
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1400, margin: '48px auto', padding: '0 24px' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2}>
                    <DashboardOutlined /> Compliance Dashboard
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>
                    Monitor KYC status, AML risk scores, and compliance metrics for all escrow transactions.
                </Paragraph>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Escrows"
                            value={stats.total}
                            prefix={<DashboardOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Flagged"
                            value={stats.flagged}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="High Risk"
                            value={stats.highRisk}
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="No KYC"
                            value={stats.noKyc}
                            prefix={<SafetyOutlined />}
                            valueStyle={{ color: '#8c8c8c' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* User Compliance Card */}
            {userCompliance && (
                <Card style={{ marginBottom: 24, background: '#fafafa' }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Your Compliance Status</Text>
                        <Space size="large" wrap>
                            <Space>
                                <Text type="secondary">KYC Level:</Text>
                                <Tag color={KYC_LEVELS[userCompliance.level].color}>
                                    {KYC_LEVELS[userCompliance.level].name}
                                </Tag>
                            </Space>
                            <Space>
                                <Text type="secondary">AML Risk Score:</Text>
                                <Badge 
                                    status={getRiskLevel(userCompliance.riskScore).status} 
                                    text={`${userCompliance.riskScore}/100`} 
                                />
                            </Space>
                            <Space>
                                <Text type="secondary">Status:</Text>
                                {userCompliance.isBlacklisted ? (
                                    <Tag color="red">Blacklisted</Tag>
                                ) : (
                                    <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>
                                )}
                            </Space>
                            {userCompliance.level < 3 && (
                                <Button 
                                    type="link" 
                                    size="small"
                                    onClick={() => router.push('/kyc')}
                                    style={{ padding: 0 }}
                                >
                                    Upgrade KYC
                                </Button>
                            )}
                        </Space>
                    </Space>
                </Card>
            )}

            {/* Filters and Export */}
            <Card style={{ marginBottom: 24 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space wrap size="middle">
                        <Input
                            placeholder="Search by ID or address..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                        />
                        
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 150 }}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Option value="all">All Status</Option>
                            <Option value="Active">Active</Option>
                            <Option value="Released">Released</Option>
                            <Option value="Refunded">Refunded</Option>
                            <Option value="flagged">Flagged</Option>
                        </Select>

                        <Select
                            value={riskFilter}
                            onChange={setRiskFilter}
                            style={{ width: 150 }}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Option value="all">All Risk Levels</Option>
                            <Option value="Low">Low Risk</Option>
                            <Option value="Medium">Medium Risk</Option>
                            <Option value="High">High Risk</Option>
                            <Option value="Critical">Critical Risk</Option>
                        </Select>

                        <Button 
                            icon={<DownloadOutlined />}
                            onClick={exportToCSV}
                            disabled={filteredEscrows.length === 0}
                        >
                            Export CSV
                        </Button>
                    </Space>

                    <Text type="secondary">
                        Showing {filteredEscrows.length} of {escrows.length} escrows
                    </Text>
                </Space>
            </Card>

            {/* Escrows Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredEscrows}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} escrows`
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Info Box */}
            <Card style={{ marginTop: 24, background: '#f0f9ff', border: '1px solid #91d5ff' }}>
                <Space direction="vertical" size="small">
                    <Text strong style={{ color: '#0050b3' }}>
                        <SafetyOutlined /> About Compliance Monitoring
                    </Text>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#0050b3' }}>
                        <li>All escrow transactions are automatically screened for AML compliance</li>
                        <li>KYC verification is required before creating or participating in escrows</li>
                        <li>High-risk transactions (score {'>'} 80) are automatically flagged for review</li>
                        <li>Compliance data is updated in real-time as transactions occur</li>
                        <li>Export reports for regulatory audits and record-keeping</li>
                    </ul>
                </Space>
            </Card>
        </div>
    );
}
