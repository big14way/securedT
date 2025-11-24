'use client';

import React from 'react';
import { Card, Row, Col, Button, Typography, Space, Tag } from 'antd';
import { 
    HistoryOutlined, 
    BellOutlined, 
    LinkOutlined, 
    EyeOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useBlockscout } from '../hooks/useBlockscout';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { siteConfig, PYUSD_TOKEN_ADDRESS } from '../constants';

const { Title, Text, Paragraph } = Typography;

/**
 * Blockscout Integration Demo Component
 * Showcases the real-time transaction monitoring and explorer integration
 */
export default function BlockscoutDemo() {
    const { 
        showContractTransactions, 
        showAddressTransactions,
        showTokenTransactions,
        showChainTransactions
    } = useBlockscout();
    const { address: walletAddress } = useWalletAddress();

    const demoFeatures = [
        {
            icon: <BellOutlined style={{ color: '#1890ff' }} />,
            title: 'Transaction Notifications',
            description: 'Real-time toast notifications for all escrow operations with status updates',
            demo: 'Live notifications during escrow create, release, and refund operations'
        },
        {
            icon: <HistoryOutlined style={{ color: '#52c41a' }} />,
            title: 'Transaction History',
            description: 'Complete transaction history for contracts, addresses, and tokens',
            demo: 'Click buttons below to explore transaction history'
        },
        {
            icon: <LinkOutlined style={{ color: '#722ed1' }} />,
            title: 'Multi-Chain Support',
            description: 'Compatible with any blockchain that has Blockscout explorer support',
            demo: 'Currently configured for Ethereum Sepolia testnet'
        },
        {
            icon: <EyeOutlined style={{ color: '#fa8c16' }} />,
            title: 'Instant Explorer Access',
            description: 'Direct integration with Blockscout explorer for detailed transaction analysis',
            demo: 'Enhanced explorer features built into the SecuredTransfer interface'
        }
    ];

    return (
        <div 
            style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '80px 0',
                color: 'white'
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title level={2} style={{ color: 'white', marginBottom: '16px' }}>
                        🚀 Powered by Blockscout SDK
                    </Title>
                    <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', maxWidth: '800px', margin: '0 auto' }}>
                        Experience real-time blockchain transaction monitoring and instant explorer feedback 
                        directly integrated into your escrow workflow
                    </Paragraph>
                </div>

                {/* Features Grid */}
                <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
                    {demoFeatures.map((feature, index) => (
                        <Col xs={24} md={12} key={index}>
                            <Card
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px'
                                }}
                                bodyStyle={{ padding: '24px' }}
                            >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {feature.icon}
                                        <Title level={4} style={{ color: 'white', margin: 0 }}>
                                            {feature.title}
                                        </Title>
                                    </div>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                                        {feature.description}
                                    </Text>
                                    <Tag color="blue" style={{ alignSelf: 'flex-start' }}>
                                        {feature.demo}
                                    </Tag>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Interactive Demo Buttons */}
                <Card 
                    title={
                        <Space>
                            <HistoryOutlined />
                            <span>Try Blockscout Integration</span>
                        </Space>
                    }
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '12px',
                        border: 'none'
                    }}
                >
                    <Paragraph style={{ marginBottom: '24px', color: '#666' }}>
                        Click the buttons below to open Blockscout transaction history popups and experience 
                        the integrated explorer functionality:
                    </Paragraph>
                    
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Button 
                                block 
                                size="large"
                                icon={<LinkOutlined />}
                                onClick={() => showTokenTransactions(PYUSD_TOKEN_ADDRESS)}
                                style={{ height: '48px' }}
                            >
                                PYUSD Activity
                            </Button>
                        </Col>
                        
                        {siteConfig.contractAddress && (
                            <Col xs={24} sm={12} md={6}>
                                <Button 
                                    block 
                                    size="large"
                                    icon={<HistoryOutlined />}
                                    onClick={() => showContractTransactions(siteConfig.contractAddress)}
                                    style={{ height: '48px' }}
                                >
                                    Contract History
                                </Button>
                            </Col>
                        )}
                        
                        <Col xs={24} sm={12} md={6}>
                            <Button 
                                block 
                                size="large"
                                icon={<EyeOutlined />}
                                onClick={() => showChainTransactions()}
                                style={{ height: '48px' }}
                            >
                                Chain Activity
                            </Button>
                        </Col>
                        
                        {walletAddress && (
                            <Col xs={24} sm={12} md={6}>
                                <Button 
                                    block 
                                    size="large"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => showAddressTransactions(walletAddress, undefined, 'My Wallet')}
                                    style={{ height: '48px' }}
                                    type="primary"
                                >
                                    My Transactions
                                </Button>
                            </Col>
                        )}
                    </Row>

                    {!walletAddress && (
                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <Text type="secondary">
                                <ExclamationCircleOutlined /> Connect your wallet to view personal transaction history
                            </Text>
                        </div>
                    )}
                </Card>

                {/* Technical Details */}
                <div style={{ marginTop: '48px', textAlign: 'center' }}>
                    <Title level={4} style={{ color: 'white', marginBottom: '16px' }}>
                        Technical Implementation
                    </Title>
                    <Row gutter={[24, 16]} justify="center">
                        <Col>
                            <Tag color="blue" style={{ padding: '4px 12px', fontSize: '14px' }}>
                                @blockscout/app-sdk
                            </Tag>
                        </Col>
                        <Col>
                            <Tag color="green" style={{ padding: '4px 12px', fontSize: '14px' }}>
                                React Hooks Integration
                            </Tag>
                        </Col>
                        <Col>
                            <Tag color="purple" style={{ padding: '4px 12px', fontSize: '14px' }}>
                                Real-time Notifications
                            </Tag>
                        </Col>
                        <Col>
                            <Tag color="orange" style={{ padding: '4px 12px', fontSize: '14px' }}>
                                Transaction History Popup
                            </Tag>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
}