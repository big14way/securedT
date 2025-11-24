'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Steps, Result, Typography, Space, Upload, Select, Alert, message, Badge, Tag, Spin } from 'antd';
import { 
    UserOutlined, 
    IdcardOutlined, 
    SafetyOutlined, 
    CheckCircleOutlined,
    UploadOutlined,
    BankOutlined,
    LockOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { isContractAvailable, getComplianceInfo } from '../util/securedTransferContract';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

const KYC_LEVELS = {
    0: { name: 'None', color: 'default', limit: '$1,000', icon: '❌' },
    1: { name: 'Basic', color: 'blue', limit: '$10,000', icon: '✓' },
    2: { name: 'Advanced', color: 'green', limit: '$100,000', icon: '✓✓' },
    3: { name: 'Institutional', color: 'gold', limit: 'Unlimited', icon: '⭐' }
};

export default function KYCPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const { address: walletAddress, isConnected } = useWalletAddress();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [kycSubmitted, setKycSubmitted] = useState(false);
    const [kycLevel, setKycLevel] = useState(0);
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [loadingCompliance, setLoadingCompliance] = useState(true);
    const [complianceInfo, setComplianceInfo] = useState(null);

    // Load current KYC status
    useEffect(() => {
        const loadKYCStatus = async () => {
            if (!walletAddress || !isContractAvailable()) {
                setLoadingCompliance(false);
                return;
            }

            try {
                const info = await getComplianceInfo(walletAddress);
                setComplianceInfo(info);
                setKycLevel(info.level);
                setLoadingCompliance(false);
            } catch (error) {
                console.error('Error loading KYC status:', error);
                setLoadingCompliance(false);
            }
        };

        loadKYCStatus();
    }, [walletAddress]);

    const handleBasicInfoSubmit = () => {
        form.validateFields(['fullName', 'email', 'country']).then(() => {
            setCurrentStep(1);
        }).catch(() => {
            message.error('Please fill in all required fields');
        });
    };

    const handleDocumentUpload = () => {
        // In production, this would upload documents to a secure server
        setCurrentStep(2);
    };

    const handleKYCSubmit = async () => {
        try {
            setLoading(true);
            
            // Simulate KYC verification process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In production, this would:
            // 1. Submit KYC data to verification service
            // 2. Wait for verification approval
            // 3. Oracle owner calls setKYCStatus on ComplianceOracle contract
            
            message.success('KYC verification submitted! Approval typically takes 1-2 business days.');
            setKycSubmitted(true);
            setCurrentStep(3);
            
        } catch (error) {
            console.error('KYC submission error:', error);
            message.error('Failed to submit KYC verification');
        } finally {
            setLoading(false);
        }
    };

    const renderKYCLevelSelection = () => (
        <Card>
            <Title level={4}>Select KYC Level</Title>
            <Paragraph type="secondary">
                Choose the verification level that matches your transaction needs. Higher levels unlock larger transaction limits.
            </Paragraph>
            
            <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
                {[1, 2, 3].map(level => (
                    <Card
                        key={level}
                        hoverable
                        onClick={() => setSelectedLevel(level)}
                        style={{
                            border: selectedLevel === level ? '2px solid #00aef2' : '1px solid #d9d9d9',
                            background: selectedLevel === level ? '#f0f9ff' : 'white'
                        }}
                    >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space>
                                <Badge 
                                    count={KYC_LEVELS[level].icon} 
                                    style={{ backgroundColor: 'transparent', color: '#000', fontSize: 20 }}
                                />
                                <Text strong style={{ fontSize: 18 }}>
                                    {KYC_LEVELS[level].name} KYC
                                </Text>
                                <Tag color={KYC_LEVELS[level].color}>
                                    {KYC_LEVELS[level].limit} max
                                </Tag>
                            </Space>
                            
                            <Paragraph type="secondary" style={{ margin: 0, marginTop: 8 }}>
                                {level === 1 && 'Basic identity verification with email and phone confirmation. Suitable for personal transactions.'}
                                {level === 2 && 'Enhanced verification with government ID and address proof. Required for larger transactions.'}
                                {level === 3 && 'Full institutional verification with business documents. Unlimited transaction amounts.'}
                            </Paragraph>
                            
                            {selectedLevel === level && (
                                <div style={{ marginTop: 12 }}>
                                    <Text type="success">
                                        <CheckCircleOutlined /> Selected
                                    </Text>
                                </div>
                            )}
                        </Space>
                    </Card>
                ))}
            </Space>
            
            <div style={{ marginTop: 24 }}>
                <Button 
                    type="primary" 
                    size="large"
                    onClick={() => setCurrentStep(0)}
                    style={{ width: '100%' }}
                >
                    Continue with {KYC_LEVELS[selectedLevel].name} KYC
                </Button>
            </div>
        </Card>
    );

    const renderBasicInfo = () => (
        <Card>
            <Title level={4}>
                {selectedLevel === 3 ? <BankOutlined /> : <UserOutlined />}
                {' '}
                {selectedLevel === 3 ? 'Business Information' : 'Personal Information'}
            </Title>
            <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                {selectedLevel === 3 ? (
                    <>
                        <Form.Item
                            label="Company Name"
                            name="companyName"
                            rules={[{ required: true, message: 'Please enter company name' }]}
                        >
                            <Input prefix={<BankOutlined />} placeholder="Acme Corporation Inc." />
                        </Form.Item>
                        <Form.Item
                            label="Business Registration Number"
                            name="registrationNumber"
                            rules={[{ required: true, message: 'Please enter registration number' }]}
                        >
                            <Input placeholder="123456789" />
                        </Form.Item>
                        <Form.Item
                            label="Contact Person"
                            name="contactPerson"
                            rules={[{ required: true, message: 'Please enter contact person name' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="John Doe" />
                        </Form.Item>
                    </>
                ) : (
                    <Form.Item
                        label="Full Name"
                        name="fullName"
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="John Doe" />
                    </Form.Item>
                )}
                
                <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' }
                    ]}
                >
                    <Input placeholder="john@example.com" />
                </Form.Item>
                
                <Form.Item
                    label="Country of Residence"
                    name="country"
                    rules={[{ required: true, message: 'Please select your country' }]}
                >
                    <Select placeholder="Select country">
                        <Option value="US">United States</Option>
                        <Option value="GB">United Kingdom</Option>
                        <Option value="CA">Canada</Option>
                        <Option value="AU">Australia</Option>
                        <Option value="SG">Singapore</Option>
                        <Option value="other">Other</Option>
                    </Select>
                </Form.Item>
                
                {selectedLevel >= 2 && (
                    <>
                        <Form.Item
                            label="Phone Number"
                            name="phone"
                            rules={[{ required: true, message: 'Please enter your phone number' }]}
                        >
                            <Input placeholder="+1 234 567 8900" />
                        </Form.Item>
                        
                        <Form.Item
                            label="Residential Address"
                            name="address"
                            rules={[{ required: true, message: 'Please enter your address' }]}
                        >
                            <Input.TextArea rows={3} placeholder="Street address, city, postal code" />
                        </Form.Item>
                    </>
                )}
            </Form>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <Button onClick={() => setCurrentStep(-1)}>
                    Back
                </Button>
                <Button type="primary" onClick={handleBasicInfoSubmit} style={{ flex: 1 }}>
                    Continue
                </Button>
            </div>
        </Card>
    );

    const renderDocumentUpload = () => (
        <Card>
            <Title level={4}>
                <IdcardOutlined /> Document Verification
            </Title>
            <Paragraph type="secondary">
                Upload required documents for identity verification. All documents are encrypted and stored securely.
            </Paragraph>
            
            <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
                {selectedLevel === 3 ? (
                    <>
                        <Form.Item label="Business Registration Certificate">
                            <Upload beforeUpload={() => false} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Upload Certificate</Button>
                            </Upload>
                        </Form.Item>
                        
                        <Form.Item label="Proof of Business Address">
                            <Upload beforeUpload={() => false} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Upload Document</Button>
                            </Upload>
                        </Form.Item>
                        
                        <Form.Item label="Director/Owner ID">
                            <Upload beforeUpload={() => false} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Upload ID</Button>
                            </Upload>
                        </Form.Item>
                    </>
                ) : (
                    <>
                        <Form.Item label="Government-issued ID (Passport, Driver's License, National ID)">
                            <Upload beforeUpload={() => false} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Upload ID Document</Button>
                            </Upload>
                            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                                Ensure the document is clear, in color, and all details are visible
                            </Paragraph>
                        </Form.Item>
                        
                        {selectedLevel >= 2 && (
                            <Form.Item label="Proof of Address (Utility bill, Bank statement)">
                                <Upload beforeUpload={() => false} maxCount={1}>
                                    <Button icon={<UploadOutlined />}>Upload Document</Button>
                                </Upload>
                                <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                                    Document must be dated within the last 3 months
                                </Paragraph>
                            </Form.Item>
                        )}
                    </>
                )}
                
                <Alert
                    message="Document Security"
                    description="Your documents are encrypted end-to-end and only accessible by authorized compliance officers. We never share your information with third parties."
                    type="info"
                    icon={<LockOutlined />}
                    showIcon
                />
            </Space>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <Button onClick={() => setCurrentStep(0)}>
                    Back
                </Button>
                <Button type="primary" onClick={handleDocumentUpload} style={{ flex: 1 }}>
                    Continue
                </Button>
            </div>
        </Card>
    );

    const renderReview = () => (
        <Card>
            <Title level={4}>
                <SafetyOutlined /> Review & Submit
            </Title>
            
            <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
                <Card type="inner" title="Verification Level">
                    <Space>
                        <Badge 
                            count={KYC_LEVELS[selectedLevel].icon} 
                            style={{ backgroundColor: 'transparent', color: '#000', fontSize: 20 }}
                        />
                        <Text strong style={{ fontSize: 16 }}>{KYC_LEVELS[selectedLevel].name} KYC</Text>
                        <Tag color={KYC_LEVELS[selectedLevel].color}>
                            {KYC_LEVELS[selectedLevel].limit} transaction limit
                        </Tag>
                    </Space>
                </Card>
                
                <Card type="inner" title="Wallet Address">
                    <Text code copyable>{walletAddress}</Text>
                </Card>
                
                <Alert
                    message="Processing Time"
                    description={`${KYC_LEVELS[selectedLevel].name} KYC verification typically takes 1-2 business days. You'll receive an email notification once your verification is approved.`}
                    type="info"
                    showIcon
                />
                
                <Alert
                    message="Important Notice"
                    description="By submitting this verification, you confirm that all information provided is accurate and complete. False information may result in account suspension."
                    type="warning"
                    showIcon
                />
            </Space>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <Button onClick={() => setCurrentStep(1)}>
                    Back
                </Button>
                <Button 
                    type="primary" 
                    onClick={handleKYCSubmit} 
                    loading={loading}
                    style={{ flex: 1 }}
                >
                    Submit Verification
                </Button>
            </div>
        </Card>
    );

    const renderSuccess = () => (
        <Result
            status="success"
            title="KYC Verification Submitted!"
            subTitle={`Your ${KYC_LEVELS[selectedLevel].name} KYC application has been received. We'll review your documents and notify you within 1-2 business days.`}
            extra={[
                <Button type="primary" key="home" onClick={() => router.push('/')}>
                    Go Home
                </Button>,
                <Button key="escrows" onClick={() => router.push('/my-escrows')}>
                    View My Escrows
                </Button>
            ]}
        />
    );

    if (!isConnected) {
        return (
            <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px' }}>
                <Alert
                    message="Wallet Not Connected"
                    description="Please connect your wallet to access KYC verification."
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    if (loadingCompliance) {
        return (
            <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px', textAlign: 'center' }}>
                <Spin size="large" tip="Loading compliance information..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2}>
                    <SafetyOutlined /> KYC Verification
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>
                    Complete KYC verification to unlock higher transaction limits and ensure regulatory compliance for RWA transactions.
                </Paragraph>
                
                {kycLevel > 0 && (
                    <Alert
                        message="Current KYC Status"
                        description={
                            <Space direction="vertical" size="small">
                                <div>
                                    <Text>Your wallet is verified at </Text>
                                    <Tag color={KYC_LEVELS[kycLevel].color}>
                                        {KYC_LEVELS[kycLevel].name} Level
                                    </Tag>
                                </div>
                                <Text type="secondary">
                                    Transaction Limit: {KYC_LEVELS[kycLevel].limit}
                                </Text>
                                <Text type="secondary">
                                    You can upgrade to a higher level for increased limits.
                                </Text>
                            </Space>
                        }
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{ marginTop: 16 }}
                    />
                )}
            </div>

            {!kycSubmitted && currentStep !== -1 && (
                <Steps current={currentStep} style={{ marginBottom: 32 }}>
                    <Step title="Basic Info" icon={<UserOutlined />} />
                    <Step title="Documents" icon={<IdcardOutlined />} />
                    <Step title="Review" icon={<SafetyOutlined />} />
                </Steps>
            )}

            {currentStep === -1 && renderKYCLevelSelection()}
            {currentStep === 0 && renderBasicInfo()}
            {currentStep === 1 && renderDocumentUpload()}
            {currentStep === 2 && renderReview()}
            {currentStep === 3 && renderSuccess()}
            
            {!kycSubmitted && currentStep === -1 && (
                <Card style={{ marginTop: 24, background: '#fafafa' }}>
                    <Title level={5}>
                        <TrophyOutlined /> Why Complete KYC?
                    </Title>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Unlock higher transaction limits for RWA trading</li>
                        <li>Meet regulatory compliance requirements</li>
                        <li>Build trust with counterparties</li>
                        <li>Access institutional-grade features</li>
                        <li>Protect your account from fraud</li>
                    </ul>
                </Card>
            )}
        </div>
    );
}
