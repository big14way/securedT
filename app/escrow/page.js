'use client';

import React, { useState, useEffect } from 'react';
import { App, Button, Card, Form, Input, InputNumber, Typography, Space, Alert, Steps, Tag, Switch, Tooltip, Statistic } from 'antd';
import { LockOutlined, UserOutlined, DollarOutlined, ThunderboltOutlined, SafetyOutlined, WarningOutlined, RiseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { createEscrow, isContractAvailable, isFraudOracleConfigured, getComplianceInfo } from '../util/securedTransferContract';
import { createYieldEscrow, isYieldEscrowAvailable } from '../util/yieldEscrowContract';
import { getTestUSDT, checkUSDTBalance } from '../util/mockUsdtFaucet';
import { useWalletClient } from '../hooks/useWalletClient';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { useNetworkSwitcher } from '../hooks/useNetworkSwitcher';
import { useBlockscout } from '../hooks/useBlockscout';
import { ESCROW_CREATION_STEPS, DEMO_DATA, NETWORK } from '../constants';

// Check if yield escrow is available
const YIELD_AVAILABLE = isYieldEscrowAvailable();
import DemoModeAlert from '../lib/DemoModeAlert';
import ConnectButton from '../lib/ConnectButton';
import { formatUnits, createPublicClient, http } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

// KYC is OPTIONAL - for compliance badges only (Web3-native design)
// All users have unlimited access regardless of KYC level
const KYC_LEVELS = {
    0: { name: 'None (Permissionless)', color: 'default', limit: Infinity },
    1: { name: 'Basic (Verified)', color: 'blue', limit: Infinity },
    2: { name: 'Advanced (Verified)', color: 'green', limit: Infinity },
    3: { name: 'Institutional (Verified)', color: 'gold', limit: Infinity }
};

export default function DepositPage() {
    const { message } = App.useApp();
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
    const [yieldEnabled, setYieldEnabled] = useState(false);
    const [estimatedYield, setEstimatedYield] = useState(null);
    const [usdtBalance, setUsdtBalance] = useState(null);
    const [loadingFaucet, setLoadingFaucet] = useState(false);

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
                const limitInUsdt = Number(formatUnits(info.limit, 6));
                setKycLimit(limitInUsdt);
            } catch (error) {
                console.error('Error loading KYC status:', error);
                setKycLimit(1000); // Default to $1,000
            } finally {
                setLoadingKyc(false);
            }
        };

        loadKycStatus();
    }, [walletAddress]);

    // Check USDT balance
    useEffect(() => {
        const checkBalance = async () => {
            if (!walletAddress || NETWORK !== 'testnet') {
                setUsdtBalance(null);
                return;
            }

            try {
                const publicClient = createPublicClient({
                    chain: mantleSepoliaTestnet,
                    transport: http()
                });

                const balance = await checkUSDTBalance(publicClient, walletAddress);
                setUsdtBalance(balance);
            } catch (error) {
                console.error('Error checking USDT balance:', error);
            }
        };

        checkBalance();
        // Recheck balance every 10 seconds
        const interval = setInterval(checkBalance, 10000);
        return () => clearInterval(interval);
    }, [walletAddress]);

    // Handle faucet button click
    const handleGetTestUSDT = async () => {
        if (!walletClient) {
            message.warning('Please connect your wallet first');
            return;
        }

        setLoadingFaucet(true);
        try {
            const hash = await getTestUSDT(walletClient);
            message.loading({ content: 'Getting test USDT...', key: 'faucet', duration: 0 });

            // Wait for transaction
            const publicClient = createPublicClient({
                chain: mantleSepoliaTestnet,
                transport: http()
            });
            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh balance
            const balance = await checkUSDTBalance(publicClient, walletAddress);
            setUsdtBalance(balance);

            message.destroy('faucet');
            message.success('Successfully received 1,000 test USDT!');
        } catch (error) {
            console.error('Failed to get test USDT:', error);
            message.destroy('faucet');
            message.error(error.message || 'Failed to get test USDT');
        } finally {
            setLoadingFaucet(false);
        }
    };

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

        // KYC is optional - protocol is permissionless (Web3 best practice)
        // Users can create escrows without KYC
        // KYC only provides compliance badges for those who want them

        // Check and switch network if needed
        console.log('Network check:', { isCorrectNetwork });
        if (!isCorrectNetwork) {
            message.info('Switching to Mantle Sepolia Testnet...');
            try {
                await ensureCorrectNetwork();
                console.log('Network switched successfully');
            } catch (networkError) {
                console.error('Network switch failed:', networkError);
                // Don't block - let user try anyway (wallet might already be on correct network)
                message.warning('Network switch failed. If you are already on Mantle Sepolia, you can proceed.');
                // Continue instead of returning - let the transaction fail if network is actually wrong
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

                            // Use YieldEscrow if yield is enabled and available
                            const hash = yieldEnabled && isYieldEscrowAvailable()
                                ? await createYieldEscrow(
                                    dynamicWalletClient,
                                    values.sellerAddress,
                                    values.amount,
                                    values.description,
                                    true, // yieldEnabled
                                    (step) => message.loading({ content: step, key: 'escrow', duration: 0 })
                                )
                                : await createEscrow(
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
                // Use YieldEscrow if yield is enabled and available
                const hash = yieldEnabled && isYieldEscrowAvailable()
                    ? await createYieldEscrow(
                        onDemandClient,
                        values.sellerAddress,
                        values.amount,
                        values.description,
                        true, // yieldEnabled
                        (step) => message.loading({ content: step, key: 'escrow', duration: 0 })
                    )
                    : await createEscrow(
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

        // Progress message key for updating the same message
        let progressKey = 'escrow-creation';

        try {
            console.log('Creating escrow with values:', values);
            console.log('Using wallet:', walletType, walletAddress);

            // Progress callback to show step-by-step UI updates
            const onProgress = (step) => {
                message.loading({ content: step, key: progressKey, duration: 0 });
            };

            // Use YieldEscrow if yield is enabled and available, otherwise use regular escrow
            const hash = yieldEnabled && isYieldEscrowAvailable()
                ? await createYieldEscrow(
                    walletClient,
                    values.sellerAddress,
                    values.amount,
                    values.description,
                    true, // yieldEnabled
                    onProgress
                )
                : await createEscrow(
                    walletClient,
                    values.sellerAddress,
                    values.amount,
                    values.description,
                    onProgress
                );

            // Success!
            message.destroy(progressKey);
            message.success('Escrow created successfully!');
            console.log('Final transaction hash:', hash);

            // Show Mantle Explorer transaction notification
            if (hash) {
                await showTransactionToast(hash);
            }

            // Navigate to my-escrows page
            router.push('/my-escrows');
        } catch (error) {
            console.error('Deposit failed:', error);
            message.destroy(progressKey);
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

    // Calculate estimated yield for UI display (actual yield comes from on-chain cMETH)
    // This is just an approximation based on ~7.2% APY for 30-day period
    const calculateYield = (amount) => {
        if (!amount || amount <= 0) {
            setEstimatedYield(null);
            return;
        }

        const APY = 0.072; // Approximate 7.2% APY from cMETH
        const days = 30;
        const yearlyYield = amount * APY;
        const dailyYield = yearlyYield / 365;
        const totalYield = dailyYield * days;

        // Display estimated yield split (actual split happens on-chain)
        // 80% buyer, 15% seller, 5% platform
        setEstimatedYield({
            total: totalYield.toFixed(2),
            buyer: (totalYield * 0.80).toFixed(2),
            seller: (totalYield * 0.15).toFixed(2),
            platform: (totalYield * 0.05).toFixed(2)
        });
    };

    // Update yield calculation when amount changes
    useEffect(() => {
        if (yieldEnabled) {
            const amount = form.getFieldValue('amount');
            if (amount) {
                calculateYield(amount);
            }
        }
    }, [form, yieldEnabled]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Title level={1}>Create USDT Escrow</Title>
                <Paragraph style={{ fontSize: '18px', color: '#666' }}>
                    Securely deposit USDT with built-in compliance, fraud protection, and oracle verification on Mantle Network
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

            {/* Show USDT balance and faucet button on testnet */}
            {walletAddress && NETWORK === 'testnet' && usdtBalance !== null && (
                <Alert
                    message={
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <span>
                                    <DollarOutlined /> Test USDT Balance: <strong>{formatUnits(usdtBalance, 6)} USDT</strong>
                                </span>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={handleGetTestUSDT}
                                    loading={loadingFaucet}
                                    disabled={loadingFaucet}
                                >
                                    Get 1,000 Test USDT
                                </Button>
                            </Space>
                            {usdtBalance === 0n && (
                                <Text type="warning" style={{ fontSize: '12px' }}>
                                    ⚠️ You need test USDT to create escrows. Click the button above to get 1,000 USDT for free!
                                </Text>
                            )}
                        </Space>
                    }
                    type={usdtBalance === 0n ? 'warning' : 'info'}
                    showIcon
                    style={{ marginBottom: '16px' }}
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
                                <span>USDT Amount</span>
                                {!loadingKyc && walletAddress && (
                                    <Tag color={KYC_LEVELS[kycLevel].color} style={{ marginLeft: 8 }}>
                                        Limit: ${kycLimit.toLocaleString()}
                                    </Tag>
                                )}
                            </Space>
                        }
                        name="amount"
                        rules={[
                            { required: true, message: 'Please enter the USDT amount' },
                            { type: 'number', min: 0.01, message: 'Amount must be at least 0.01 USDT' },
                            { type: 'number', max: kycLimit, message: `Amount exceeds your KYC limit of $${kycLimit.toLocaleString()}` }
                        ]}
                    >
                        <InputNumber
                            prefix={<DollarOutlined />}
                            placeholder="Enter amount in USDT"
                            style={{ width: '100%', borderRadius: '8px' }}
                            step={0.01}
                            precision={2}
                        />
                    </Form.Item>

                    {/* KYC is optional - show informational badge only if user has KYC */}
                    {!loadingKyc && walletAddress && kycLevel > 0 && (
                        <Alert
                            message={`${KYC_LEVELS[kycLevel].name} - Optional Compliance Badge`}
                            description="KYC is optional. You have unlimited access regardless of verification status."
                            type="success"
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

                    {/* mETH Yield Generation Toggle */}
                    <Card 
                        style={{ 
                            marginBottom: 24, 
                            background: yieldEnabled ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
                            border: yieldEnabled ? 'none' : '1px solid #e8e8e8'
                        }}
                    >
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space>
                                    <RiseOutlined style={{ fontSize: 20, color: yieldEnabled ? 'white' : '#667eea' }} />
                                    <Text strong style={{ fontSize: 16, color: yieldEnabled ? 'white' : 'inherit' }}>
                                        Enable Yield Generation {!YIELD_AVAILABLE && <Tag color="orange">Mainnet Only</Tag>}
                                    </Text>
                                    <Tooltip title={YIELD_AVAILABLE
                                        ? "Stake your escrowed USDT in Mantle's mETH Protocol to earn 7.2% APY while maintaining payment security"
                                        : "Yield generation requires Mantle mainnet (Agni Finance DEX + cmETH). Currently on testnet - use regular escrow instead."
                                    }>
                                        <InfoCircleOutlined style={{ color: yieldEnabled ? 'rgba(255,255,255,0.8)' : '#8c8c8c' }} />
                                    </Tooltip>
                                </Space>
                                <Switch
                                    checked={yieldEnabled}
                                    disabled={!YIELD_AVAILABLE}
                                    onChange={(checked) => {
                                        setYieldEnabled(checked);
                                        if (checked) {
                                            const amount = form.getFieldValue('amount');
                                            if (amount) {
                                                calculateYield(amount);
                                            }
                                        }
                                    }}
                                    checkedChildren="ON"
                                    unCheckedChildren="OFF"
                                />
                            </Space>

                            {yieldEnabled && (
                                <>
                                    <Alert
                                        message={
                                            <Space>
                                                <ThunderboltOutlined />
                                                <Text strong style={{ color: 'inherit' }}>mETH Protocol Integration Active</Text>
                                            </Space>
                                        }
                                        description={
                                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                <Text style={{ color: 'inherit' }}>
                                                    Your USDT will be converted to ETH and staked in Mantle's mETH Protocol earning ~7.2% APY
                                                </Text>
                                                <Space split="|">
                                                    <Text style={{ color: 'inherit' }}>
                                                        <strong>Buyer:</strong> 80% yield
                                                    </Text>
                                                    <Text style={{ color: 'inherit' }}>
                                                        <strong>Seller:</strong> 15% yield
                                                    </Text>
                                                    <Text style={{ color: 'inherit' }}>
                                                        <strong>Platform:</strong> 5%
                                                    </Text>
                                                </Space>
                                            </Space>
                                        }
                                        type="info"
                                        showIcon={false}
                                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                                    />

                                    {estimatedYield && (
                                        <Card type="inner" style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}>
                                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                                <Text style={{ color: 'white', fontSize: 12 }}>Estimated Earnings (30 days):</Text>
                                                <Space size={24} wrap>
                                                    <Statistic
                                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Yield</span>}
                                                        value={estimatedYield.total}
                                                        prefix="$"
                                                        precision={2}
                                                        valueStyle={{ color: 'white', fontSize: 18 }}
                                                    />
                                                    <Statistic
                                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Your Share (80%)</span>}
                                                        value={estimatedYield.buyer}
                                                        prefix="$"
                                                        precision={2}
                                                        valueStyle={{ color: '#52c41a', fontSize: 18 }}
                                                    />
                                                    <Statistic
                                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Seller Share (15%)</span>}
                                                        value={estimatedYield.seller}
                                                        prefix="$"
                                                        precision={2}
                                                        valueStyle={{ color: '#faad14', fontSize: 18 }}
                                                    />
                                                </Space>
                                            </Space>
                                        </Card>
                                    )}

                                    <Alert
                                        message={
                                            <Space>
                                                <WarningOutlined />
                                                <Text strong>Important: Unstaking Delay</Text>
                                            </Space>
                                        }
                                        description="Releasing or refunding a yield-enabled escrow requires a minimum 12-hour unstaking period (up to 40+ days). Additional gas costs apply for USDT→ETH→mETH conversion."
                                        type="warning"
                                        showIcon={false}
                                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                                    />
                                </>
                            )}
                        </Space>
                    </Card>

                    <div style={{ 
                        background: '#f8fafc', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        marginBottom: '24px' 
                    }}>
                        <Title level={5}>How it works:</Title>
                        <ul style={{ color: '#666', margin: 0 }}>
                            <li>Your USDT will be held securely in a smart contract escrow</li>
                            {yieldEnabled && <li style={{ color: '#667eea', fontWeight: 500 }}>Your funds will be staked in mETH to earn 7.2% APY during escrow</li>}
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