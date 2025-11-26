'use client';

import React, { useState } from 'react';
import { Card, Typography, Space, Button, Steps, Row, Col, Statistic, Tag, Alert, Timeline } from 'antd';
import { 
    DollarOutlined, 
    SafetyOutlined,
    RiseOutlined,
    CheckCircleOutlined,
    ThunderboltOutlined,
    UserOutlined,
    ShoppingOutlined,
    RocketOutlined,
    BankOutlined,
    ToolOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

export default function WorkingCapitalTutorial() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: 'Create Escrow',
            icon: <DollarOutlined />,
            description: 'Client agrees to $10,000 project payment',
            details: 'Freelancer creates an escrow with the client for a $10,000 project. Funds are locked in a smart contract.'
        },
        {
            title: 'Deposit as Collateral',
            icon: <SafetyOutlined />,
            description: 'Use escrow as collateral on INIT Capital',
            details: 'Deposit the $10,000 escrow as collateral on INIT Capital lending protocol. This keeps payment security while unlocking liquidity.'
        },
        {
            title: 'Borrow Working Capital',
            icon: <BankOutlined />,
            description: 'Borrow $8,000 at 80% LTV',
            details: 'Borrow up to $8,000 (80% loan-to-value) immediately. Use these funds for equipment, outsourcing, or other project needs.'
        },
        {
            title: 'Complete Project',
            icon: <ToolOutlined />,
            description: 'Execute project with borrowed funds',
            details: 'Use the borrowed capital to purchase equipment, hire subcontractors, or cover other project expenses. Complete the work for the client.'
        },
        {
            title: 'Client Releases Payment',
            icon: <CheckCircleOutlined />,
            description: 'Client approves and releases escrow',
            details: 'Once project is complete and approved, client releases the $10,000 escrow payment.'
        },
        {
            title: 'Repay & Profit',
            icon: <CrownOutlined />,
            description: 'Repay loan and keep profit',
            details: 'Repay the $8,000 + interest (~$35/month). Keep the remaining amount as profit from the project.'
        }
    ];

    const useCase = {
        escrowAmount: 10000,
        borrowAmount: 8000,
        ltv: 0.8,
        interestRate: 5.2,
        projectDuration: 30, // days
        projectCost: 6000,
        profit: 0
    };

    // Calculate profit
    useCase.profit = useCase.escrowAmount - useCase.borrowAmount - ((useCase.borrowAmount * useCase.interestRate / 100) / 12);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <RocketOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                <Title level={1}>Working Capital Financing</Title>
                <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: 800, margin: '0 auto' }}>
                    Learn how freelancers and service providers can access immediate working capital by borrowing against their escrowed payments
                </Paragraph>
            </div>

            {/* Key Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Escrow Amount"
                            value={useCase.escrowAmount}
                            prefix="$"
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Borrow Capacity"
                            value={useCase.borrowAmount}
                            prefix="$"
                            suffix={`(${useCase.ltv * 100}%)`}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Interest Rate"
                            value={useCase.interestRate}
                            suffix="% APY"
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Net Profit"
                            value={useCase.profit.toFixed(2)}
                            prefix="$"
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Process Flow */}
            <Card style={{ marginBottom: 40 }}>
                <Title level={3} style={{ marginBottom: 24 }}>How It Works</Title>
                <Steps
                    current={currentStep}
                    onChange={setCurrentStep}
                    direction="vertical"
                >
                    {steps.map((step, index) => (
                        <Step
                            key={index}
                            title={step.title}
                            description={step.description}
                            icon={step.icon}
                        />
                    ))}
                </Steps>

                {/* Step Details */}
                <Card 
                    style={{ marginTop: 24, background: '#f5f5f5' }}
                    title={
                        <Space>
                            {steps[currentStep].icon}
                            <span>{steps[currentStep].title}</span>
                        </Space>
                    }
                >
                    <Paragraph style={{ fontSize: 16, marginBottom: 16 }}>
                        {steps[currentStep].details}
                    </Paragraph>

                    <Space wrap>
                        {currentStep > 0 && (
                            <Button onClick={() => setCurrentStep(currentStep - 1)}>
                                Previous
                            </Button>
                        )}
                        {currentStep < steps.length - 1 && (
                            <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                                Next
                            </Button>
                        )}
                        {currentStep === steps.length - 1 && (
                            <Button type="primary" icon={<RocketOutlined />} onClick={() => router.push('/escrow')}>
                                Start Creating Escrow
                            </Button>
                        )}
                    </Space>
                </Card>
            </Card>

            {/* Example Scenario */}
            <Card 
                title={
                    <Space>
                        <UserOutlined />
                        <span>Real-World Example: Sarah the Freelance Designer</span>
                    </Space>
                }
                style={{ marginBottom: 40 }}
            >
                <Timeline>
                    <Timeline.Item color="blue">
                        <Space direction="vertical" size={4}>
                            <Text strong>Day 1: Client Agreement</Text>
                            <Text>Sarah lands a $10,000 website redesign project. Client creates escrow with $10,000 USDT.</Text>
                        </Space>
                    </Timeline.Item>
                    <Timeline.Item color="green">
                        <Space direction="vertical" size={4}>
                            <Text strong>Day 2: Unlock Liquidity</Text>
                            <Text>Sarah deposits the escrow as collateral and borrows $8,000 immediately.</Text>
                        </Space>
                    </Timeline.Item>
                    <Timeline.Item color="purple">
                        <Space direction="vertical" size={4}>
                            <Text strong>Day 3-7: Invest in Project</Text>
                            <Text>
                                Sarah uses the $8,000 to:
                                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                                    <li>Purchase premium design software license: $500</li>
                                    <li>Hire a junior designer for assistance: $3,000</li>
                                    <li>Outsource copywriting: $1,500</li>
                                    <li>Buy stock photos and assets: $1,000</li>
                                    <li>Remaining for other expenses: $2,000</li>
                                </ul>
                            </Text>
                        </Space>
                    </Timeline.Item>
                    <Timeline.Item color="orange">
                        <Space direction="vertical" size={4}>
                            <Text strong>Day 8-28: Project Execution</Text>
                            <Text>Sarah completes the website redesign with professional quality thanks to the additional resources.</Text>
                        </Space>
                    </Timeline.Item>
                    <Timeline.Item color="green">
                        <Space direction="vertical" size={4}>
                            <Text strong>Day 29: Client Approval</Text>
                            <Text>Client loves the work and releases the $10,000 escrow payment.</Text>
                        </Space>
                    </Timeline.Item>
                    <Timeline.Item color="gold">
                        <Space direction="vertical" size={4}>
                            <Text strong>Day 30: Settlement</Text>
                            <Text>
                                Sarah repays the loan and settles:
                                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                                    <li>Loan repayment: $8,000</li>
                                    <li>Interest (5.2% APY for 30 days): ~$35</li>
                                    <li>Net profit: $1,965</li>
                                </ul>
                            </Text>
                        </Space>
                    </Timeline.Item>
                </Timeline>

                <Alert
                    message="The Result"
                    description="Sarah earned $1,965 net profit and delivered a higher quality project thanks to working capital financing. Without this, she would have needed to bootstrap everything or turn down the project."
                    type="success"
                    showIcon
                    icon={<CrownOutlined />}
                    style={{ marginTop: 24 }}
                />
            </Card>

            {/* Benefits */}
            <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                <Col xs={24} md={8}>
                    <Card>
                        <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                            <ThunderboltOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                            <Title level={4}>Immediate Liquidity</Title>
                            <Text>Access 80% of your escrowed funds instantly without waiting for project completion.</Text>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                            <SafetyOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                            <Title level={4}>Payment Security</Title>
                            <Text>Maintain buyer protection and fraud detection while unlocking capital.</Text>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                            <RiseOutlined style={{ fontSize: 48, color: '#faad14' }} />
                            <Title level={4}>Scale Your Business</Title>
                            <Text>Take on bigger projects by financing expenses upfront instead of bootstrapping.</Text>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Use Cases */}
            <Card title="Perfect For" style={{ marginBottom: 40 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Space direction="vertical" size="small">
                            <Text strong>
                                <ShoppingOutlined /> Freelancers & Service Providers
                            </Text>
                            <Text>Need equipment, tools, or outsourcing before project payment arrives.</Text>
                        </Space>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space direction="vertical" size="small">
                            <Text strong>
                                <RocketOutlined /> Startups & Agencies
                            </Text>
                            <Text>Want to scale operations without waiting for client payments to clear.</Text>
                        </Space>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space direction="vertical" size="small">
                            <Text strong>
                                <ToolOutlined /> Contractors
                            </Text>
                            <Text>Need to purchase materials and pay subcontractors before getting paid.</Text>
                        </Space>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space direction="vertical" size="small">
                            <Text strong>
                                <BankOutlined /> Consultants
                            </Text>
                            <Text>Want to invest in resources to deliver higher quality work.</Text>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* CTA */}
            <Card style={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Title level={2} style={{ color: 'white', marginBottom: 0 }}>
                        Ready to Unlock Your Working Capital?
                    </Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 0 }}>
                        Create your first escrow and start borrowing against it for immediate liquidity
                    </Paragraph>
                    <Space size="large">
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<DollarOutlined />}
                            onClick={() => router.push('/escrow')}
                            style={{ background: 'white', color: '#667eea', borderColor: 'white' }}
                        >
                            Create Escrow
                        </Button>
                        <Button 
                            size="large"
                            icon={<SafetyOutlined />}
                            onClick={() => router.push('/collateral')}
                            style={{ background: 'transparent', color: 'white', borderColor: 'white' }}
                        >
                            View Collateral Dashboard
                        </Button>
                    </Space>
                </Space>
            </Card>
        </div>
    );
}
