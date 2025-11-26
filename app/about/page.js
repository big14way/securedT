'use client';

import { APP_DESC, APP_NAME, EXAMPLE_DATASETS, siteConfig } from '../constants';
import Logo from '../lib/Logo';
import { Button, Card, Row, Col, Divider, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { CheckCircleTwoTone, RocketOutlined, CodeOutlined, SafetyCertificateTwoTone, DollarOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function About() {
    const router = useRouter();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                {/* <Logo style={{ marginBottom: '24px' }} /> */}
                <Title level={1} style={{ marginBottom: '16px', fontSize: '48px' }}>
                    About {APP_NAME}
                </Title>
                <Paragraph style={{ fontSize: '20px', color: '#666', maxWidth: '700px', margin: '0 auto 32px' }}>
                    <b>SecuredTransfer</b> is a Web3-native, permissionless USDT escrow system with fraud protection on Mantle Network. Tokenize real-world invoices as tradable NFTs with instant liquidity through blockchain-based escrow—bringing enterprise-grade payment protection to on-chain transactions without KYC barriers.
                </Paragraph>
                
                <Button 
                    type="primary" 
                    size="large"
                    onClick={() => router.push('/escrow')}
                    style={{ 
                        height: '48px', 
                        padding: '0 32px', 
                        fontSize: '18px',
                        fontWeight: '600'
                    }}
                >
                    {siteConfig.cta.primary}
                </Button>
            </div>

           
            {/* How It Works Section */}
            <div style={{ marginBottom: '60px' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    How It Works
                </Title>
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={4}></Col>
                    <Col xs={24} md={16}>
                        <ol style={{ fontSize: '18px', color: '#444', lineHeight: '2', paddingLeft: '24px' }}>
                            <li>Connect wallet via WalletConnect v2 (supports 300+ wallets including MetaMask, Coinbase Wallet).</li>
                            <li>Create escrow with USDT on Mantle Network's ultra-low-cost Layer 2.</li>
                            <li>Automatic invoice NFT minting (ERC-721) for tradable real-world assets.</li>
                            <li>Optional yield generation via cmETH staking (7.2% APY) or collateral for working capital (80% LTV).</li>
                            <li>Fraud protection via ComplianceOracle (blacklist, AML scoring, wash trading prevention) - permissionless by default.</li>
                            <li>Secure release/refund with fraud protection and on-chain transparency via Mantle Explorer.</li>
                        </ol>
                    </Col>
                    <Col xs={24} md={4}></Col>
                </Row>
            </div>

            {/* Use Cases Section */}
            <div style={{ marginBottom: '60px' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    Perfect For
                </Title>
                <Card>
                    <Row gutter={[16, 16]}>
                        {siteConfig.useCases.map((useCase, index) => (
                            <Col key={index} xs={24} sm={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '16px' }} />
                                    <Text>{useCase}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card>
            </div>

            {/* Technical Details Section */}
            <div style={{ marginBottom: '60px' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    Technical Implementation
                </Title>
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={12}>
                        <Card title="Core Infrastructure" style={{ height: '100%' }}>
                            <ul style={{ paddingLeft: '20px', color: '#666' }}>
                                <li><b>Mantle Network:</b> Layer 2 with ultra-low gas fees (~0.02 gwei)</li>
                                <li><b>WalletConnect v2:</b> Multi-wallet support (300+ wallets)</li>
                                <li><b>Hardhat + Viem:</b> Smart contract development and type-safe interactions</li>
                                <li><b>USDT:</b> Stablecoin payments for escrow and invoices (6 decimals)</li>
                                <li><b>cmETH:</b> Liquid staking on Mantle for 7.2% APY yield generation</li>
                                <li><b>INIT Capital:</b> Collateral lending for working capital (80% LTV)</li>
                            </ul>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="Frontend & Integration" style={{ height: '100%' }}>
                            <ul style={{ paddingLeft: '20px', color: '#666' }}>
                                <li><b>Next.js 14:</b> React application with App Router</li>
                                <li><b>Viem + Wagmi:</b> Type-safe Web3 wallet integration</li>
                                <li><b>Dynamic SDK:</b> Seamless wallet management</li>
                                <li><b>Ant Design:</b> Professional, responsive UI/UX</li>
                                <li><b>Mantle Explorer:</b> On-chain transaction transparency</li>
                            </ul>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Open Source & Future Work Section */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Card style={{ background: '#f8f9fa' }}>
                    <Title level={3}>Open Source & Future Work</Title>
                    <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
                        {APP_NAME} is open source with 5 deployed smart contracts on Mantle Sepolia testnet. Future enhancements could include:
                        <ul style={{ textAlign: 'left', margin: '16px auto', maxWidth: '600px', color: '#666' }}>
                            <li>Mainnet deployment on Mantle Network (Chain ID: 5000)</li>
                            <li>Enhanced invoice factoring marketplace with liquidity pools</li>
                            <li>Real INIT Capital integration for mainnet collateral lending</li>
                            <li>Multi-party escrow and milestone-based releases</li>
                            <li>Document attachment verification with IPFS/Arweave</li>
                            <li>Cross-chain support via Layer Zero or Wormhole</li>
                        </ul>
                        The complete source code, smart contracts, and comprehensive documentation are available on GitHub.
                    </Paragraph>
                    <Space size="middle">
                        <Button
                            type="default"
                            size="large"
                            href="https://github.com/big14way/securedT"
                            target="_blank"
                            icon={<CodeOutlined />}
                        >
                            View Source Code
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => router.push('/escrow')}
                        >
                            Create Escrow
                        </Button>
                    </Space>
                </Card>
            </div>
        </div>
    );
}
