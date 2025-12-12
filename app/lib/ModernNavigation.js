'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Badge, Dropdown, Avatar, Drawer } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeOutlined,
  PlusOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  SafetyOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MenuOutlined,
  UserOutlined,
  WalletOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { getComplianceInfo, isContractAvailable } from '../util/securedTransferContract';
import { modernColors, spacing } from '../theme/modernTheme';
import ConnectButton from './ConnectButton';
import NetworkStatus from './NetworkStatus';

const ModernNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { address: walletAddress, isConnected } = useWalletAddress();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kycLevel, setKycLevel] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load KYC status
  useEffect(() => {
    const loadKycStatus = async () => {
      if (!walletAddress || !isContractAvailable()) return;
      try {
        const info = await getComplianceInfo(walletAddress);
        setKycLevel(info.level);
      } catch (error) {
        console.error('Error loading KYC status:', error);
      }
    };
    loadKycStatus();
  }, [walletAddress]);

  const mainNavItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <HomeOutlined />,
      path: '/',
    },
    {
      key: 'escrow',
      label: 'Create Escrow',
      icon: <PlusOutlined />,
      path: '/escrow',
      badge: 'New',
      badgeColor: modernColors.success,
    },
    {
      key: 'marketplace',
      label: 'Marketplace',
      icon: <ShoppingOutlined />,
      path: '/marketplace',
    },
    {
      key: 'invoices',
      label: 'My Invoices',
      icon: <FileTextOutlined />,
      path: '/invoices',
      requiresAuth: true,
    },
    {
      key: 'yield',
      label: 'Yield',
      icon: <LineChartOutlined />,
      path: '/yield',
      requiresAuth: true,
    },
    {
      key: 'compliance',
      label: 'Compliance',
      icon: <SafetyOutlined />,
      path: '/compliance',
      requiresAuth: true,
      badge: kycLevel > 0 ? '✓' : null,
      badgeColor: modernColors.success,
    },
  ];

  const userMenuItems = [
    {
      key: 'dashboard',
      label: 'My Escrows',
      icon: <DashboardOutlined />,
      onClick: () => router.push('/my-escrows'),
    },
    {
      key: 'kyc',
      label: 'KYC Status',
      icon: <SafetyOutlined />,
      onClick: () => router.push('/kyc'),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Disconnect',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        // Handle disconnect
        window.location.reload();
      },
    },
  ];

  const NavItem = ({ item, mobile = false }) => {
    const isActive = pathname === item.path;
    const show = !item.requiresAuth || isConnected;

    if (!show) return null;

    return (
      <div
        onClick={() => {
          router.push(item.path);
          if (mobile) setMobileMenuOpen(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: mobile ? '12px 16px' : '8px 16px',
          borderRadius: 10,
          cursor: 'pointer',
          position: 'relative',
          background: isActive
            ? mobile
              ? modernColors.primaryLight
              : `linear-gradient(135deg, ${modernColors.primaryLight}, transparent)`
            : 'transparent',
          color: isActive ? modernColors.primary : modernColors.gray,
          fontWeight: isActive ? 600 : 500,
          fontSize: mobile ? 16 : 15,
          transition: 'all 0.3s ease',
          ...(mobile && {
            borderLeft: isActive ? `3px solid ${modernColors.primary}` : '3px solid transparent',
          }),
        }}
        onMouseEnter={(e) => {
          if (!mobile && !isActive) {
            e.currentTarget.style.background = modernColors.lightBg;
            e.currentTarget.style.color = modernColors.dark;
          }
        }}
        onMouseLeave={(e) => {
          if (!mobile && !isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = modernColors.gray;
          }
        }}
      >
        <span style={{ fontSize: mobile ? 20 : 18 }}>{item.icon}</span>
        <span>{item.label}</span>
        {item.badge && (
          <Badge
            count={item.badge}
            style={{
              backgroundColor: item.badgeColor || modernColors.primary,
              fontSize: 10,
              height: 18,
              minWidth: 18,
              lineHeight: '18px',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${scrolled ? modernColors.grayLighter : 'transparent'}`,
          boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: `0 ${spacing.xl}px`,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: modernColors.gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              ST
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                background: modernColors.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SecuredTransfer
            </span>
          </div>

          {/* Desktop Menu */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            className="desktop-menu"
          >
            {mainNavItems.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </div>

          {/* Right Side Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            {/* Network Status */}
            <div className="desktop-only">
              <NetworkStatus showSwitcher={true} />
            </div>

            {/* Notifications */}
            {isConnected && (
              <Button
                type="text"
                icon={
                  <Badge count={3} size="small">
                    <BellOutlined style={{ fontSize: 20 }} />
                  </Badge>
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            )}

            {/* User Menu / Connect Button */}
            {isConnected ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  type="text"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px',
                    height: 40,
                  }}
                >
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    style={{
                      background: modernColors.gradients.primary,
                    }}
                  />
                  <span className="desktop-only">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                  {kycLevel > 0 && (
                    <CheckCircleOutlined
                      style={{
                        color: modernColors.success,
                        fontSize: 16,
                      }}
                    />
                  )}
                </Button>
              </Dropdown>
            ) : (
              <ConnectButton
                size="middle"
                style={{
                  background: modernColors.gradients.primary,
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Mobile Menu Button */}
            <Button
              className="mobile-only"
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: modernColors.gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              ST
            </div>
            <span style={{ fontWeight: 600 }}>SecuredTransfer</span>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={300}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '16px 0' }}>
          {/* Mobile Network Status */}
          <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${modernColors.grayLighter}` }}>
            <NetworkStatus showSwitcher={true} />
          </div>

          {/* Mobile Navigation Items */}
          <div style={{ padding: '16px 0' }}>
            {mainNavItems.map((item) => (
              <NavItem key={item.key} item={item} mobile />
            ))}
          </div>

          {/* Mobile User Section */}
          {isConnected && (
            <div style={{ padding: '16px', borderTop: `1px solid ${modernColors.grayLighter}` }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  background: modernColors.lightBg,
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  style={{
                    background: modernColors.gradients.primary,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </div>
                  {kycLevel > 0 && (
                    <div style={{ fontSize: 12, color: modernColors.success }}>
                      <CheckCircleOutlined /> KYC Verified
                    </div>
                  )}
                </div>
              </div>

              {userMenuItems.map((item) =>
                item.type === 'divider' ? (
                  <div
                    key="divider"
                    style={{
                      height: 1,
                      background: modernColors.grayLighter,
                      margin: '8px 0',
                    }}
                  />
                ) : (
                  <Button
                    key={item.key}
                    type="text"
                    icon={item.icon}
                    danger={item.danger}
                    onClick={item.onClick}
                    block
                    style={{
                      textAlign: 'left',
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </Button>
                )
              )}
            </div>
          )}

          {/* Mobile Connect Button */}
          {!isConnected && (
            <div style={{ padding: '16px' }}>
              <ConnectButton
                size="large"
                style={{
                  width: '100%',
                  background: modernColors.gradients.primary,
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  height: 48,
                }}
              />
            </div>
          )}
        </div>
      </Drawer>

      {/* Spacer for fixed navigation */}
      <div style={{ height: 72 }} />

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ModernNavigation;