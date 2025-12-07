'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, Badge, Tag } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import {
    HomeOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
    SafetyOutlined,
    DashboardOutlined,
    CheckCircleOutlined,
    ShoppingOutlined,
    LineChartOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { useBlockscout } from '../hooks/useBlockscout';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { getComplianceInfo, isContractAvailable } from '../util/securedTransferContract';
import { APP_NAME } from '../constants';

const { Text } = Typography;

const KYC_LEVELS = {
    0: { name: 'None', color: 'default', icon: null },
    1: { name: 'Basic', color: '#00f0ff', icon: null },
    2: { name: 'Advanced', color: '#00ff88', icon: null },
    3: { name: 'Institutional', color: '#fbbf24', icon: null }
};

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { showChainTransactions, showContractTransactions } = useBlockscout();
    const { address: walletAddress } = useWalletAddress();
    const [kycLevel, setKycLevel] = useState(0);
    const [loadingKyc, setLoadingKyc] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);

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
            } catch (error) {
                console.error('Error loading KYC status:', error);
            } finally {
                setLoadingKyc(false);
            }
        };

        loadKycStatus();
    }, [walletAddress]);

    // Hide escrow creation tabs on /escrow pages
    const isEscrowPage = pathname.startsWith('/escrow');
    const navItems = [
        !isEscrowPage && {
            key: 'escrow',
            label: 'Create Escrow',
            icon: <PlusOutlined />,
            path: '/escrow',
            glowColor: '#00f0ff'
        },
        !isEscrowPage && walletAddress && {
            key: 'my-escrows',
            label: 'My Escrows',
            icon: <HomeOutlined />,
            path: '/my-escrows',
            glowColor: '#a855f7'
        },
        walletAddress && {
            key: 'marketplace',
            label: 'Marketplace',
            icon: <ShoppingOutlined />,
            path: '/marketplace',
            glowColor: '#ff00ff'
        },
        walletAddress && {
            key: 'yield',
            label: 'Yield',
            icon: <LineChartOutlined />,
            path: '/yield',
            glowColor: '#00ff88'
        },
        walletAddress && {
            key: 'kyc',
            label: (
                <Space size={4}>
                    KYC
                    {!loadingKyc && kycLevel > 0 && (
                        <CheckCircleOutlined style={{ color: '#00ff88', fontSize: 12 }} />
                    )}
                </Space>
            ),
            icon: <SafetyOutlined />,
            path: '/kyc',
            glowColor: '#fbbf24'
        },
        walletAddress && {
            key: 'compliance',
            label: 'Compliance',
            icon: <DashboardOutlined />,
            path: '/compliance',
            glowColor: '#ec4899'
        },
        {
            key: 'about',
            label: 'About',
            icon: <InfoCircleOutlined />,
            path: '/about',
            glowColor: '#00f0ff'
        }
    ].filter(Boolean);

    const isActive = (path) => pathname === path;

    return (
        <div
            style={{
                background: 'transparent',
                padding: 0,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                minWidth: 0,
                minHeight: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    gap: 16,
                    width: '100%',
                    height: 64,
                    paddingLeft: 24,
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        cursor: 'pointer',
                        flex: '0 0 auto',
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.3s ease'
                    }}
                    onClick={() => router.push('/')}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <Text
                        strong
                        style={{
                            fontSize: '22px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            fontFamily: "'Orbitron', sans-serif",
                            background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))'
                        }}
                    >
                        {APP_NAME}
                    </Text>
                    <ThunderboltOutlined
                        style={{
                            marginLeft: 6,
                            color: '#00f0ff',
                            fontSize: 16,
                            filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.5))'
                        }}
                    />
                </div>

                {/* Navigation Items */}
                <div
                    style={{
                        display: 'flex',
                        flex: '1 1 auto',
                        gap: 8,
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        alignItems: 'center',
                        marginLeft: 24,
                    }}
                >
                    {navItems.map(item => {
                        const active = isActive(item.path);
                        const hovered = hoveredItem === item.key;

                        return (
                            <div
                                key={item.key}
                                onClick={() => router.push(item.path)}
                                onMouseEnter={() => setHoveredItem(item.key)}
                                onMouseLeave={() => setHoveredItem(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: active
                                        ? `rgba(0, 240, 255, 0.1)`
                                        : hovered
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'transparent',
                                    border: active
                                        ? `1px solid ${item.glowColor}`
                                        : '1px solid transparent',
                                    color: active ? '#00f0ff' : hovered ? '#ffffff' : '#94a3b8',
                                    fontWeight: active ? 600 : 500,
                                    fontSize: '14px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: active
                                        ? `0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(0, 240, 255, 0.05)`
                                        : 'none',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Glow effect on hover */}
                                {hovered && !active && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: `linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.1), transparent)`,
                                        animation: 'shimmer 1.5s ease-in-out infinite',
                                        pointerEvents: 'none'
                                    }} />
                                )}
                                <span style={{
                                    marginRight: 8,
                                    fontSize: '16px',
                                    color: active ? item.glowColor : 'inherit',
                                    filter: active ? `drop-shadow(0 0 5px ${item.glowColor})` : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {item.icon}
                                </span>
                                <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
                            </div>
                        );
                    })}

                    {/* Blockscout Transactions Button */}
                    <div
                        onClick={() => {
                            const contractAddress = typeof window !== 'undefined' &&
                                                  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
                            if (contractAddress) {
                                showContractTransactions(contractAddress);
                            } else {
                                showChainTransactions();
                            }
                        }}
                        onMouseEnter={() => setHoveredItem('transactions')}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: hoveredItem === 'transactions'
                                ? 'rgba(255, 0, 255, 0.1)'
                                : 'transparent',
                            border: hoveredItem === 'transactions'
                                ? '1px solid rgba(255, 0, 255, 0.3)'
                                : '1px solid transparent',
                            color: hoveredItem === 'transactions' ? '#ff00ff' : '#94a3b8',
                            fontWeight: 500,
                            fontSize: '14px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        title={process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? 'View Contract Transactions' : 'View Chain Transactions'}
                    >
                        <HistoryOutlined style={{ marginRight: 8, fontSize: '16px' }} />
                        <span>Txns</span>
                    </div>
                </div>
            </div>

            {/* Add shimmer animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
