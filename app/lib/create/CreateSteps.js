'use client';

import React from 'react';
import { Steps } from 'antd';
import { 
    FileTextOutlined, 
    DollarOutlined, 
    LinkOutlined 
} from '@ant-design/icons';

export const CREATE_STEPS = [
    {
        title: 'Service Details',
        description: 'Define your service offering',
        icon: <FileTextOutlined />
    },
    {
        title: 'Payment Terms',
        description: 'Set stablecoin pricing and payment structure',
        icon: <DollarOutlined />
    },
    {
        title: 'Deploy & Share',
        description: 'Create smart contract and get link',
        icon: <LinkOutlined />
    }
];

export default function CreateSteps({ currentStep }) {
    return (
        <Steps 
            current={currentStep} 
            style={{ marginBottom: 48 }}
            items={CREATE_STEPS}
        />
    );
}
