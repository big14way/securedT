'use client';

import React, { useState, useEffect } from 'react';
import { Dropdown, Space, Typography } from 'antd';
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
    ThunderboltOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { useBlockscout } from '../hooks/useBlockscout';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { getComplianceInfo, isContractAvailable } from '../util/securedTransferContract';
import { APP_NAME } from '../constants';

const { Text } = Typography;

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { showChainTransactions, showContractTransactions } = useBlockscout();
    const { address: walletAddress } = useWalletAddress();
    const [kycLevel, setKycLevel] = useState(0);
    const [loadingKyc, setLoadingKyc] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Mobile menu items for dropdown
    const mobileMenuItems = navItems.map(item => ({
        key: item.key,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.icon}
                <span>{typeof item.label === 'string' ? item.label : 'KYC'}</span>
            </div>
        ),
        onClick: () => {
            router.push(item.path);
            setMobileMenuOpen(false);
        }
    }));

    // Add transactions to mobile menu
    mobileMenuItems.push({
        key: 'transactions',
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HistoryOutlined />
                <span>Transactions</span>
            </div>
        ),
        onClick: () => {
            const contractAddress = typeof window !== 'undefined' &&
                                  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
            if (contractAddress) {
                showContractTransactions(contractAddress);
            } else {
                showChainTransactions();
            }
            setMobileMenuOpen(false);
        }
    });

    return (
        <div
            style={{
                background: 'transparent',
                padding: '0 16px',
                minHeight: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
            }}
        >
            <div
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    gap: 16,
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        cursor: 'pointer',
                        flex: '0 0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        minWidth: 'fit-content'
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
                            fontSize: 'clamp(16px, 4vw, 22px)',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            fontFamily: "'Orbitron', sans-serif",
                            background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {APP_NAME}
                    </Text>
                    <ThunderboltOutlined
                        style={{
                            marginLeft: 6,
                            color: '#00f0ff',
                            fontSize: 'clamp(14px, 3vw, 16px)',
                            filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.5))'
                        }}
                    />
                </div>

                {/* Desktop Navigation - Hidden on mobile */}
                <div
                    className="desktop-nav"
                    style={{
                        display: 'flex',
                        flex: '1 1 auto',
                        gap: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
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
                                    padding: '6px 12px',
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
                                    fontSize: '13px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: active
                                        ? `0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(0, 240, 255, 0.05)`
                                        : 'none',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                }}
                            >
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
                                    marginRight: 6,
                                    fontSize: '14px',
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

                    {/* Transactions Button */}
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
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: hoveredItem === 'transactions'
                                ? 'rgba(255, 0, 255, 0.1)'
                                : 'transparent',
                            border: hoveredItem === 'transactions'
                                ? '1px solid rgba(255, 0, 255, 0.3)'
                                : '1px solid transparent',
                            color: hoveredItem === 'transactions' ? '#ff00ff' : '#94a3b8',
                            fontWeight: 500,
                            fontSize: '13px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap'
                        }}
                        title={process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? 'View Contract Transactions' : 'View Chain Transactions'}
                    >
                        <HistoryOutlined style={{ marginRight: 6, fontSize: '14px' }} />
                        <span>Txns</span>
                    </div>
                </div>

                {/* Mobile Menu Button - Shown on mobile */}
                <div className="mobile-nav" style={{ flex: '0 0 auto' }}>
                    <Dropdown
                        menu={{ items: mobileMenuItems }}
                        trigger={['click']}
                        open={mobileMenuOpen}
                        onOpenChange={setMobileMenuOpen}
                        placement="bottomRight"
                        overlayStyle={{
                            minWidth: 200,
                        }}
                    >
                        <div
                            style={{
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: mobileMenuOpen ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                                border: mobileMenuOpen ? '1px solid #00f0ff' : '1px solid transparent',
                                color: mobileMenuOpen ? '#00f0ff' : '#94a3b8',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <MenuOutlined style={{ fontSize: '18px' }} />
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>Menu</span>
                        </div>
                    </Dropdown>
                </div>
            </div>

            {/* Responsive CSS */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .desktop-nav {
                    display: flex;
                }

                .mobile-nav {
                    display: none;
                }

                /* Tablet and smaller screens */
                @media (max-width: 1200px) {
                    .desktop-nav {
                        gap: 4px;
                    }
                }

                /* Mobile screens - show hamburger menu */
                @media (max-width: 968px) {
                    .desktop-nav {
                        display: none;
                    }

                    .mobile-nav {
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
}
