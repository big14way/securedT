'use client';

import { APP_DESC, APP_NAME, EXAMPLE_DATASETS, siteConfig } from '../constants';
import Logo from '../lib/Logo';
import { Button, Card, Row, Col, Divider, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import {
    CheckCircleTwoTone,
    RocketOutlined,
    CodeOutlined,
    SafetyCertificateTwoTone,
    DollarOutlined,
    ThunderboltOutlined,
    ApiOutlined,
    GlobalOutlined,
    LockOutlined,
    LineChartOutlined,
    SwapOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function About() {
    const router = useRouter();

    const techCards = [
        {
            title: 'Core Infrastructure',
            icon: <ApiOutlined style={{ color: '#00f0ff', fontSize: 24 }} />,
            items: [
                { label: 'Mantle Network', desc: 'Layer 2 with ultra-low gas fees (~0.02 gwei)' },
                { label: 'WalletConnect v2', desc: 'Multi-wallet support (300+ wallets)' },
                { label: 'Hardhat + Viem', desc: 'Smart contract development and type-safe interactions' },
                { label: 'USDT', desc: 'Stablecoin payments for escrow and invoices (6 decimals)' },
                { label: 'cmETH', desc: 'Liquid staking on Mantle for 7.2% APY yield generation' },
                { label: 'INIT Capital', desc: 'Collateral lending for working capital (80% LTV)' }
            ],
            color: '#00f0ff'
        },
        {
            title: 'Frontend & Integration',
            icon: <GlobalOutlined style={{ color: '#ff00ff', fontSize: 24 }} />,
            items: [
                { label: 'Next.js 14', desc: 'React application with App Router' },
                { label: 'Viem + Wagmi', desc: 'Type-safe Web3 wallet integration' },
                { label: 'Dynamic SDK', desc: 'Seamless wallet management' },
                { label: 'Ant Design', desc: 'Professional, responsive UI/UX' },
                { label: 'Mantle Explorer', desc: 'On-chain transaction transparency' }
            ],
            color: '#ff00ff'
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: 20,
                    padding: '8px 20px',
                    marginBottom: 32
                }}>
                    <ThunderboltOutlined style={{ color: '#00f0ff' }} />
                    <span style={{ color: '#00f0ff', fontSize: 14, fontWeight: 500 }}>
                        Built on Mantle Network
                    </span>
                </div>

                <Title level={1} style={{
                    marginBottom: '24px',
                    fontSize: '52px',
                    fontWeight: 800,
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#ffffff'
                }}>
                    About{' '}
                    <span style={{
                        background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {APP_NAME}
                    </span>
                </Title>

                <Paragraph style={{
                    fontSize: '18px',
                    color: '#94a3b8',
                    maxWidth: '800px',
                    margin: '0 auto 40px',
                    lineHeight: '1.8'
                }}>
                    <strong style={{ color: '#00f0ff' }}>SecuredTransfer</strong> is a Web3-native, permissionless USDT escrow system
                    with fraud protection on Mantle Network. Tokenize real-world invoices as tradable NFTs with instant
                    liquidity through blockchain-based escrow—bringing enterprise-grade payment protection to on-chain
                    transactions without KYC barriers.
                </Paragraph>

                <Button
                    type="primary"
                    size="large"
                    onClick={() => router.push('/escrow')}
                    icon={<RocketOutlined />}
                    style={{
                        height: '56px',
                        padding: '0 40px',
                        fontSize: '18px',
                        fontWeight: '600',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 240, 255, 0.4)'
                    }}
                >
                    {siteConfig.cta.primary}
                </Button>
            </div>

            {/* How It Works Section */}
            <div style={{ marginBottom: '80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title level={2} style={{
                        color: '#ffffff',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '32px'
                    }}>
                        <span style={{
                            background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            How It Works
                        </span>
                    </Title>
                </div>

                <Card style={{
                    background: 'rgba(22, 22, 42, 0.6)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)'
                }}>
                    <Row gutter={[32, 24]}>
                        {[
                            { step: 1, text: 'Connect wallet via WalletConnect v2 (supports 300+ wallets including MetaMask, Coinbase Wallet).', color: '#00f0ff' },
                            { step: 2, text: "Create escrow with USDT on Mantle Network's ultra-low-cost Layer 2.", color: '#ff00ff' },
                            { step: 3, text: 'Automatic invoice NFT minting (ERC-721) for tradable real-world assets.', color: '#a855f7' },
                            { step: 4, text: 'Optional yield generation via cmETH staking (7.2% APY) or collateral for working capital (80% LTV).', color: '#00ff88' },
                            { step: 5, text: 'Fraud protection via ComplianceOracle (blacklist, AML scoring, wash trading prevention) - permissionless by default.', color: '#fbbf24' },
                            { step: 6, text: 'Secure release/refund with fraud protection and on-chain transparency via Mantle Explorer.', color: '#ec4899' }
                        ].map((item) => (
                            <Col xs={24} md={12} key={item.step}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '16px',
                                    padding: '16px',
                                    background: 'rgba(0, 240, 255, 0.05)',
                                    borderRadius: '12px',
                                    border: `1px solid ${item.color}30`,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `${item.color}20`,
                                        border: `1px solid ${item.color}50`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: "'Orbitron', sans-serif",
                                        fontWeight: 700,
                                        color: item.color,
                                        fontSize: '16px',
                                        flexShrink: 0
                                    }}>
                                        {item.step}
                                    </div>
                                    <Text style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: '1.6' }}>
                                        {item.text}
                                    </Text>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card>
            </div>

            {/* Use Cases Section */}
            <div style={{ marginBottom: '80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title level={2} style={{
                        color: '#ffffff',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '32px'
                    }}>
                        <span style={{
                            background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Perfect For
                        </span>
                    </Title>
                </div>

                <Card style={{
                    background: 'rgba(22, 22, 42, 0.6)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)'
                }}>
                    <Row gutter={[24, 20]}>
                        {siteConfig.useCases.map((useCase, index) => (
                            <Col key={index} xs={24} sm={12}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    background: 'rgba(0, 255, 136, 0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 255, 136, 0.2)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <CheckCircleTwoTone twoToneColor="#00ff88" style={{ fontSize: '18px' }} />
                                    <Text style={{ color: '#e2e8f0', fontSize: '15px' }}>{useCase}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card>
            </div>

            {/* Technical Details Section */}
            <div style={{ marginBottom: '80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title level={2} style={{
                        color: '#ffffff',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '32px'
                    }}>
                        <span style={{
                            background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Technical Implementation
                        </span>
                    </Title>
                </div>

                <Row gutter={[32, 32]}>
                    {techCards.map((card, index) => (
                        <Col xs={24} md={12} key={index}>
                            <Card
                                style={{
                                    height: '100%',
                                    background: 'rgba(22, 22, 42, 0.6)',
                                    border: `1px solid ${card.color}30`,
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(20px)',
                                    transition: 'all 0.3s ease'
                                }}
                                hoverable
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = card.color;
                                    e.currentTarget.style.boxShadow = `0 0 40px ${card.color}20`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = `${card.color}30`;
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: `${card.color}15`,
                                        border: `1px solid ${card.color}30`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {card.icon}
                                    </div>
                                    <Title level={4} style={{
                                        margin: 0,
                                        color: '#ffffff',
                                        fontFamily: "'Orbitron', sans-serif"
                                    }}>
                                        {card.title}
                                    </Title>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {card.items.map((item, i) => (
                                        <div key={i} style={{
                                            padding: '10px 12px',
                                            background: 'rgba(0, 240, 255, 0.03)',
                                            borderRadius: '8px',
                                            borderLeft: `2px solid ${card.color}50`
                                        }}>
                                            <Text strong style={{ color: card.color, fontSize: '14px' }}>
                                                {item.label}:
                                            </Text>
                                            <Text style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '8px' }}>
                                                {item.desc}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Open Source & Future Work Section */}
            <div style={{ textAlign: 'center' }}>
                <Card style={{
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '24px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 60px rgba(0, 240, 255, 0.1)'
                }}>
                    <Title level={3} style={{
                        color: '#ffffff',
                        fontFamily: "'Orbitron', sans-serif",
                        marginBottom: '24px'
                    }}>
                        <span style={{
                            background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Open Source & Future Work
                        </span>
                    </Title>

                    <Paragraph style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '24px' }}>
                        {APP_NAME} is open source with 5 deployed smart contracts on Mantle Sepolia testnet.
                    </Paragraph>

                    <Row gutter={[16, 12]} style={{ maxWidth: '700px', margin: '0 auto 32px' }}>
                        {[
                            'Mainnet deployment on Mantle Network (Chain ID: 5000)',
                            'Enhanced invoice factoring marketplace with liquidity pools',
                            'Real INIT Capital integration for mainnet collateral lending',
                            'Multi-party escrow and milestone-based releases',
                            'Document attachment verification with IPFS/Arweave',
                            'Cross-chain support via Layer Zero or Wormhole'
                        ].map((item, i) => (
                            <Col xs={24} sm={12} key={i}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    background: 'rgba(0, 240, 255, 0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 240, 255, 0.15)'
                                }}>
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#00f0ff',
                                        boxShadow: '0 0 10px #00f0ff'
                                    }} />
                                    <Text style={{ color: '#e2e8f0', fontSize: '13px' }}>{item}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    <Space size="middle">
                        <Button
                            size="large"
                            href="https://github.com/big14way/securedT"
                            target="_blank"
                            icon={<CodeOutlined />}
                            style={{
                                height: '48px',
                                padding: '0 28px',
                                fontSize: '16px',
                                fontWeight: '600',
                                borderRadius: '10px',
                                background: 'transparent',
                                border: '1px solid rgba(0, 240, 255, 0.5)',
                                color: '#00f0ff'
                            }}
                        >
                            View Source Code
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => router.push('/escrow')}
                            style={{
                                height: '48px',
                                padding: '0 28px',
                                fontSize: '16px',
                                fontWeight: '600',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)',
                                border: 'none',
                                boxShadow: '0 4px 20px rgba(0, 240, 255, 0.3)'
                            }}
                        >
                            Create Escrow
                        </Button>
                    </Space>
                </Card>
            </div>
        </div>
    );
}
