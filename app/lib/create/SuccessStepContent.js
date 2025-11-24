'use client';

import React from 'react';
import { 
    Button, 
    Card, 
    Space, 
    Typography 
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function SuccessStepContent({ 
    contractAddress,
    onCreateAnother,
    onViewDashboard 
}) {
    return (
        <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined 
                style={{ fontSize: 64, color: '#ec348b', marginBottom: 24 }} 
            />
            <Title level={2}>Offer Created Successfully!</Title>
            <Paragraph type="secondary">
                Your decentralized offer is now live on-chain. Share the link below with potential clients.
            </Paragraph>
            
            <Card style={{ marginBottom: 24 }}>
                <Text strong>Your Offer Link:</Text>
                <br />
                <Text copyable code>
                    {typeof window !== 'undefined' 
                        ? `${window.location.origin}/offer/${contractAddress}`
                        : `https://yourapp.com/offer/${contractAddress}`
                    }
                </Text>
            </Card>

            <Space>
                <Button type="primary" onClick={onCreateAnother}>
                    Create Another Offer
                </Button>
                <Button onClick={() => {
                    if (typeof window !== 'undefined' && contractAddress) {
                        window.location.href = `/offer/${contractAddress}`;
                    } else {
                        onViewDashboard();
                    }
                }}>
                    View Offer
                </Button>
            </Space>
        </div>
    );
}
