'use client';

import { Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { isContractAvailable } from '../util/securedTransferContract';

export default function DemoModeAlert({ 
    style = { marginBottom: '24px' },
    message = "Demo Mode",
    description = "SecuredTransferContract is not deployed or configured. Showing sample data for demonstration purposes. In production, this would connect to the actual deployed contract.",
    showIcon = true,
    type = "info",
    closable = false
}) {
    // Only show if contract is not available
    if (isContractAvailable()) {
        return null;
    }

    return (
        <Alert
            message={message}
            description={description}
            type={type}
            showIcon={showIcon}
            icon={<InfoCircleOutlined />}
            closable={closable}
            style={style}
        />
    );
}