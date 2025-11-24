'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, InputNumber, Typography, Space, Alert, Steps, message, Tag } from 'antd';
import { LockOutlined, UserOutlined, DollarOutlined, ThunderboltOutlined, SafetyOutlined, WarningOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { createEscrow, isContractAvailable, isFraudOracleConfigured, getComplianceInfo } from '../util/securedTransferContract';
import { useWalletClient } from '../hooks/useWalletClient';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { useNetworkSwitcher } from '../hooks/useNetworkSwitcher';
import { useBlockscout } from '../hooks/useBlockscout';
import { ESCROW_CREATION_STEPS, DEMO_DATA } from '../constants';
import DemoModeAlert from '../lib/DemoModeAlert';
import ConnectButton from '../lib/ConnectButton';
import { formatUnits } from 'viem';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const KYC_LEVELS = {
    0: { name: 'None', color: 'default', limit: 1000 },
    1: { name: 'Basic', color: 'blue', limit: 10000 },
    2: { name: 'Advanced', color: 'green', limit: 100000 },
    3: { name: 'Institutional', color: 'gold', limit: Infinity }
};

export default function DepositPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { primaryWallet, user } = useDynamicContext();
    const walletClient = useWalletClient();
    const { address: walletAddress, isConnected, walletType, hasChanged, resetHasChanged } = useWalletAddress();
    const { ensureCorrectNetwork, isCorrectNetwork } = useNetworkSwitcher();
    const { showTransactionToast } = useBlockscout();
    const [kycLevel, setKycLevel] = useState(0);
    const [kycLimit, setKycLimit] = useState(1000);
    const [loadingKyc, setLoadingKyc] = useState(true);

    // Load KYC status
    useEffect(() => {
        const loadKycStatus = async () => {
            if (!walletAddress || !isContractAvailable()) {
                setLoadingKyc(false);
                return;
            }

            try {
                const info = await getComplianceInfo(walletAddress);
                setKycLevel(info.level);
                const limitInPyusd = Number(formatUnits(info.limit, 6));
                setKycLimit(limitInPyusd);
            } catch (error) {
                console.error('Error loading KYC status:', error);
                setKycLimit(1000); // Default to $1,000
            } finally {
                setLoadingKyc(false);
            }
        };

        loadKycStatus();
    }, [walletAddress]);

    // Debug wallet connection state
    useEffect(() => {
        console.log('Create Escrow Page - Wallet State:', {
            primaryWallet: !!primaryWallet,
            primaryWalletAddress: primaryWallet?.address,
            user: !!user,
            userWalletAddress: user?.walletAddress,
            walletClient: !!walletClient,
            walletAddress,
            isConnected,
            walletType,
            hasChanged,
            buttonShouldBeEnabled: !!(primaryWallet && isConnected && walletAddress),
            buttonCurrentlyDisabled: !primaryWallet || !walletClient,
            kycLevel,
            kycLimit
        });
    }, [primaryWallet, user, walletClient, walletAddress, isConnected, walletType, hasChanged, kycLevel, kycLimit]);

    // Reset hasChanged flag after showing success message
    useEffect(() => {
        if (walletAddress && hasChanged) {
            // Reset the flag after a short delay to ensure the success message is shown
            const timer = setTimeout(() => {
                resetHasChanged();
            }, 5000); // Hide after 5 seconds
            
            return () => clearTimeout(timer);
        }
    }, [walletAddress, hasChanged, resetHasChanged]);

    const handleDeposit = async (values) => {
        // Enhanced wallet connection checks using Dynamic.xyz
        console.log('Starting escrow creation with wallet state:', {
            primaryWallet: !!primaryWallet,
            walletAddress,
            isConnected,
            walletClient: !!walletClient,
            isCorrectNetwork,
            kycLevel,
            kycLimit
        });

        if (!primaryWallet || !isConnected || !walletAddress) {
            message.warning('Please connect your wallet to create an escrow');
            console.log('Wallet connection check failed:', {
                primaryWallet: !!primaryWallet,
                isConnected,
                walletAddress: !!walletAddress
            });
            return;
        }

        // Check KYC compliance
        if (kycLevel === 0) {
            message.error('KYC verification required. Please complete KYC verification to create escrows.');
            setTimeout(() => router.push('/kyc'), 1500);
            return;
        }

        // Check transaction limit
        if (values.amount > kycLimit) {
            message.error(`Amount exceeds your KYC limit of $${kycLimit.toLocaleString()}. Please upgrade your KYC level or reduce the amount.`);
            return;
        }

        // Check and switch network if needed
        if (!isCorrectNetwork) {
            message.info('Switching to Sepolia network...');
            try {
                await ensureCorrectNetwork();
                console.log('Network switched successfully');
            } catch (networkError) {
                console.error('Network switch failed:', networkError);
                message.error('Please manually switch your wallet to Sepolia network to continue');
                return;
            }
        }

        if (!isContractAvailable()) {
            message.info('Running in demo mode - would create escrow in production');
            // Simulate transaction for demo
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLoading(false);
            router.push(`/escrow/demo-${Date.now()}`);
            return;
        }

        if (!walletClient) {
            // Try to create wallet client on-demand using Dynamic.xyz + viem approach
            console.log('Wallet client not available, attempting to create one using Dynamic.xyz approach...');
            try {
                const { createWalletClient, custom } = await import('viem');
                const { ACTIVE_CHAIN } = await import('../constants');
                
                console.log('Available connector keys:', primaryWallet.connector ? Object.keys(primaryWallet.connector) : []);
                
                // Method 1: Use Dynamic.xyz recommended approach - get provider from primaryWallet directly
                let provider = null;
                
                if (primaryWallet.getWalletClient) {
                    try {
                        console.log('Trying primaryWallet.getWalletClient()...');
                        const dynamicWalletClient = await primaryWallet.getWalletClient();
                        if (dynamicWalletClient) {
                            console.log('Got wallet client from Dynamic, using it directly');
                            const hash = await createEscrow(
                                dynamicWalletClient,
                                values.sellerAddress,
                                values.amount,
                                values.description
                            );
                            
                            message.success('Escrow created successfully!');
                            console.log('Transaction hash:', hash);
                            
                            // Show Blockscout transaction notification
                            if (hash) {
                                await showTransactionToast(hash);
                            }
                            
                            router.push('/my-escrows');
                            return;
                        }
                    } catch (dynamicClientError) {
                        console.log('primaryWallet.getWalletClient() failed:', dynamicClientError);
                    }
                }
                
                // Method 2: Try to get ethereum provider from Dynamic
                if (primaryWallet.connector && typeof primaryWallet.connector.getProvider === 'function') {
                    try {
                        console.log('Trying connector.getProvider()...');
                        provider = await primaryWallet.connector.getProvider();
                        console.log('Got provider from connector.getProvider():', !!provider);
                    } catch (providerError) {
                        console.log('connector.getProvider() failed:', providerError);
                    }
                }
                
                // Method 3: Check for ethereum provider in window for browser wallets
                if (!provider && typeof window !== 'undefined') {
                    console.log('Checking window.ethereum...');
                    if (window.ethereum) {
                        // For Coinbase Wallet
                        if (window.ethereum.isCoinbaseWallet || 
                            (window.ethereum.providers && window.ethereum.providers.find(p => p.isCoinbaseWallet))) {
                            provider = window.ethereum.isCoinbaseWallet ? 
                                window.ethereum : 
                                window.ethereum.providers.find(p => p.isCoinbaseWallet);
                            console.log('Found Coinbase provider in window.ethereum');
                        }
                        // Generic fallback
                        else {
                            provider = window.ethereum;
                            console.log('Using window.ethereum as fallback');
                        }
                    }
                }
                
                // Method 4: Deep inspection of connector properties
                if (!provider && primaryWallet.connector) {
                    console.log('Trying deep connector inspection...');
                    const connector = primaryWallet.connector;
                    
                    // Check all properties that might contain a provider
                    const possibleProviderPaths = [
                        'provider', 'ethereum', '_provider', 'walletProvider',
                        'client', '_client', 'signer', '_signer',
                        'connection.provider', 'connection.client',
                        'wallet.provider', 'wallet.client', 'wallet.ethereum',
                        'options.provider', 'options.client'
                    ];
                    
                    for (const path of possibleProviderPaths) {
                        const value = path.split('.').reduce((obj, key) => obj && obj[key], connector);
                        if (value && (value.request || value.send || value.sendAsync)) {
                            console.log(`Found potential provider at connector.${path}`);
                            provider = value;
                            break;
                        }
                    }
                }
                
                if (!provider) {
                    // Log detailed connector structure for debugging
                    console.log('All provider detection methods failed. Detailed connector analysis:');
                    console.log('Connector keys:', Object.keys(primaryWallet.connector));
                    console.log('Connector methods:', Object.keys(primaryWallet.connector).filter(key => 
                        typeof primaryWallet.connector[key] === 'function'));
                    
                    throw new Error(`No provider found. Available connector keys: ${Object.keys(primaryWallet.connector).join(', ')}`);
                }
                
                console.log('Successfully found provider, creating viem wallet client...');
                console.log('Provider type:', typeof provider, 'Has request:', !!provider.request);
                
                const onDemandClient = createWalletClient({
                    account: walletAddress,
                    chain: ACTIVE_CHAIN,
                    transport: custom(provider),
                });
                
                console.log('Successfully created on-demand wallet client');
                
                // Use the on-demand client for this transaction
                const hash = await createEscrow(
                    onDemandClient,
                    values.sellerAddress,
                    values.amount,
                    values.description
                );
                
                message.success('Escrow created successfully!');
                console.log('Transaction hash:', hash);
                router.push('/my-escrows');
                return; // Exit early since we handled the transaction
                
            } catch (onDemandError) {
                console.error('Failed to create on-demand wallet client:', onDemandError);
                message.error(`Wallet connection issue: ${onDemandError.message}. Please try disconnecting and reconnecting your wallet.`);
                return;
            }
        }

        // If we get here, walletClient should be available
        setLoading(true);
        try {
            console.log('Creating escrow with values:', values);
            console.log('Using wallet:', walletType, walletAddress);
            
            const hash = await createEscrow(
                walletClient,
                values.sellerAddress,  // Fix: use correct field name
                values.amount,
                values.description
            );
            
            message.success('Escrow created successfully!');
            console.log('Transaction hash:', hash);
            
            // Show Blockscout transaction notification
            if (hash) {
                await showTransactionToast(hash);
            }
            
            // Navigate to a transaction status page or back to my-escrows
            router.push('/my-escrows');
        } catch (error) {
            console.error('Deposit failed:', error);
            message.error(error.message || 'Failed to create escrow');
        } finally {
            setLoading(false);
        }
    };

    const handlePrefillDemo = () => {
        form.setFieldsValue({
            sellerAddress: DEMO_DATA.sellerAddress,
            amount: DEMO_DATA.amount,
            description: DEMO_DATA.description
        });
        message.success('Demo data loaded! You can now create a test escrow.');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Title level={1}>Create PYUSD Escrow</Title>
                <Paragraph style={{ fontSize: '18px', color: '#666' }}>
                    Securely deposit PYUSD with built-in fraud protection and oracle verification
                </Paragraph>
            </div>

            <Steps current={currentStep} style={{ marginBottom: '40px' }}>
                {ESCROW_CREATION_STEPS.map(item => (
                    <Step key={item.title} title={item.title} description={item.description} />
                ))}
            </Steps>

            <DemoModeAlert 
                description="This is a demonstration interface. In production, this would connect to deployed SecuredTransfer smart contracts on Ethereum."
            />

            {!walletAddress && (
                <Alert
                    message="Wallet Connection Required"
                    description="Please connect your wallet to create an escrow. Your wallet will be used to sign transactions and interact with the SecuredTransfer smart contract."
                    type="warning"
                    showIcon
                    style={{ marginBottom: '24px' }}
                />
            )}

            {walletAddress && hasChanged && (
                <Alert
                    message={`Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                    description="Wallet connected successfully. You can now create escrow transactions."
                    type="success"
                    showIcon
                    style={{ marginBottom: '24px' }}
                />
            )}

            <Card>
                {/* Demo Data Prefill Button */}
                <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                    <Button 
                        icon={<ThunderboltOutlined />}
                        onClick={handlePrefillDemo}
                        type="link"
                        size="small"
                        style={{ color: '#8c8c8c' }}
                    >
                        Load demo data
                    </Button>
                </div>
                
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleDeposit}
                    size="large"
                >
                    <Form.Item
                        label="Seller Address"
                        name="sellerAddress"
                        rules={[
                            { required: true, message: 'Please enter the seller address' },
                            { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Please enter a valid Ethereum address' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="0x..."
                            style={{ borderRadius: '8px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <Space>
                                <span>PYUSD Amount</span>
                                {!loadingKyc && walletAddress && (
                                    <Tag color={KYC_LEVELS[kycLevel].color} style={{ marginLeft: 8 }}>
                                        Limit: ${kycLimit.toLocaleString()}
                                    </Tag>
                                )}
                            </Space>
                        }
                        name="amount"
                        rules={[
                            { required: true, message: 'Please enter the PYUSD amount' },
                            { type: 'number', min: 0.01, message: 'Amount must be at least 0.01 PYUSD' },
                            { type: 'number', max: kycLimit, message: `Amount exceeds your KYC limit of $${kycLimit.toLocaleString()}` }
                        ]}
                    >
                        <InputNumber
                            prefix={<DollarOutlined />}
                            placeholder="Enter amount in PYUSD"
                            style={{ width: '100%', borderRadius: '8px' }}
                            step={0.01}
                            precision={2}
                        />
                    </Form.Item>

                    {!loadingKyc && walletAddress && kycLevel === 0 && (
                        <Alert
                            message="KYC Verification Required"
                            description={
                                <Space direction="vertical">
                                    <Text>You must complete KYC verification before creating escrows.</Text>
                                    <Button 
                                        type="link" 
                                        icon={<SafetyOutlined />}
                                        onClick={() => router.push('/kyc')}
                                        style={{ padding: 0 }}
                                    >
                                        Complete KYC Now
                                    </Button>
                                </Space>
                            }
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    {!loadingKyc && walletAddress && kycLevel > 0 && kycLevel < 3 && (
                        <Alert
                            message={`${KYC_LEVELS[kycLevel].name} KYC Active`}
                            description={
                                <Space direction="vertical" size="small">
                                    <Text>Your current limit is ${kycLimit.toLocaleString()}.</Text>
                                    <Button 
                                        type="link" 
                                        icon={<SafetyOutlined />}
                                        onClick={() => router.push('/kyc')}
                                        style={{ padding: 0 }}
                                    >
                                        Upgrade KYC Level for Higher Limits
                                    </Button>
                                </Space>
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[
                            { required: true, message: 'Please provide a description' },
                            { min: 10, message: 'Description must be at least 10 characters' },
                            { max: 500, message: 'Description must be less than 500 characters' }
                        ]}
                    >
                        <Input.TextArea
                            placeholder="Describe the transaction or service..."
                            rows={3}
                            style={{ borderRadius: '8px' }}
                        />
                    </Form.Item>

                    <div style={{ 
                        background: '#f8fafc', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        marginBottom: '24px' 
                    }}>
                        <Title level={5}>How it works:</Title>
                        <ul style={{ color: '#666', margin: 0 }}>
                            <li>Your PYUSD will be held securely in a smart contract escrow</li>
                            <li>Fraud oracles monitor the transaction for any suspicious activity</li>
                            <li>Funds are released to seller only when transaction is verified safe</li>
                            <li>Automatic refund if fraud is detected by oracle attestation</li>
                        </ul>
                    </div>

                    <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                        <Button
                            size="large"
                            onClick={() => router.push('/')}
                        >
                            Cancel
                        </Button>
                        {!isConnected || !walletAddress ? (
                            <ConnectButton />
                        ) : (
                            <Button
                                type="primary"
                                size="large"
                                htmlType="submit"
                                loading={loading}
                                icon={<LockOutlined />}
                                disabled={!primaryWallet}
                                title={!primaryWallet ? 'Wallet not connected' : 
                                       !walletClient ? 'Wallet client will be created on-demand' : 
                                       'Create escrow transaction'}
                            >
                                {loading ? 'Creating Escrow...' : 'Create Escrow'}
                            </Button>
                        )}
                    </Space>
                </Form>
            </Card>
        </div>
    );
}