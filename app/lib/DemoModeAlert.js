'use client';

import { Alert, Typography, Space } from 'antd';
import { WarningOutlined, SettingOutlined } from '@ant-design/icons';
import { isContractAvailable } from '../util/securedTransferContract';

const { Text, Link } = Typography;

export default function DemoModeAlert({
    style = { marginBottom: '24px' },
    showEnvInstructions = true,
    closable = false
}) {
    // Only show if contract is not available
    if (isContractAvailable()) {
        return null;
    }

    return (
        <Alert
            message={
                <Space>
                    <WarningOutlined />
                    <Text strong style={{ color: '#faad14' }}>Demo Mode - Smart Contracts Not Connected</Text>
                </Space>
            }
            description={
                <div>
                    <p style={{ margin: '8px 0' }}>
                        The application is running without blockchain connectivity.
                        Escrows created in demo mode are <strong>simulated</strong> and won't appear in "My Escrows".
                    </p>
                    {showEnvInstructions && (
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.2)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginTop: '12px'
                        }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                                <SettingOutlined /> To enable real blockchain transactions:
                            </Text>
                            <Text style={{ fontSize: '13px', color: '#94a3b8' }}>
                                Add these environment variables in <strong>Vercel</strong> (Settings → Environment Variables):
                            </Text>
                            <pre style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                marginTop: '8px',
                                overflow: 'auto',
                                color: '#00f0ff'
                            }}>
{`NEXT_PUBLIC_CONTRACT_ADDRESS=0xb8a1446e1a9feb78c0e83196cda8366a53df5376
NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=0x99ce6cc9064a6a88b6fb4abda170844c45d8d1ae
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=0x71f43c6c9598369f94dbd162dadb24c3d8df675c
NEXT_PUBLIC_YIELD_ESCROW_ADDRESS=0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933
NEXT_PUBLIC_NETWORK=testnet`}
                            </pre>
                            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                                After adding, redeploy your application for changes to take effect.
                            </Text>
                        </div>
                    )}
                </div>
            }
            type="warning"
            showIcon={false}
            closable={closable}
            style={{
                ...style,
                background: 'rgba(250, 173, 20, 0.1)',
                border: '1px solid rgba(250, 173, 20, 0.3)',
                borderRadius: '12px'
            }}
        />
    );
}
