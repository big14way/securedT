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
                    <b>SecuredTransfer</b> is a PYUSD escrow system with fraud protection. Create secure escrow transactions with automatic refunds via oracle attestations—bringing PayPal-like consumer protection to on-chain payments.
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
                            <li>Connect wallet via Dynamic to authenticate as client or service provider.</li>
                            <li>Client submits a service request form with payment details.</li>
                            <li>Smart contract is deployed via Hardhat; PYUSD payment is deposited.</li>
                            <li>Service provider reviews request and generates an offer.</li>
                            <li>Client approves; contract releases payment automatically.</li>
                            <li>Both parties receive confirmation and transaction records on-chain.</li>
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
                                <li>Dynamic: wallet-based authentication for clients and providers</li>
                                <li>Hardhat: smart contract development, deployment, and on-chain automation</li>
                                <li>PYUSD: stablecoin payments for deposits, milestones, and offers</li>
                                <li>Vercel: open-source hosting and deployment</li>
                            </ul>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="Frontend & Integration" style={{ height: '100%' }}>
                            <ul style={{ paddingLeft: '20px', color: '#666' }}>
                                <li>Next.js React application with modern UI components</li>
                                <li>Wagmi hooks for seamless Web3 wallet integration</li>
                                <li>Ethers.js for blockchain interactions and transaction handling</li>
                                <li>Ant Design for professional, responsive user interface</li>
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
                        {APP_NAME} is open source and built for the hackathon community. Future enhancements could include:
                        <ul style={{ textAlign: 'left', margin: '16px auto', maxWidth: '600px', color: '#666' }}>
                            <li>Recurring subscriptions or retainers (automated PYUSD payments)</li>
                            <li>Cross-chain support for broader ecosystem compatibility</li>
                            <li>Document attachment verification with decentralized storage</li>
                            <li>Multi-party escrow and milestone-based releases</li>
                            <li>Integration with fiat on-ramps for easier adoption</li>
                        </ul>
                        The complete source code, smart contracts, and documentation are available on GitHub.
                    </Paragraph>
                    <Space size="middle">
                        <Button 
                            type="default" 
                            size="large"
                            href="https://github.com/cbonoz/ethnyc25" 
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
                            Try the Demo
                        </Button>
                    </Space>
                </Card>
            </div>
        </div>
    );
}
