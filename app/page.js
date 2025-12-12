'use client';

import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Space, Card, Typography, Tag, Badge, Divider } from 'antd';
import {
  CheckCircleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  BankOutlined,
  FileProtectOutlined,
  RocketOutlined,
  DollarOutlined,
  SwapOutlined,
  TeamOutlined,
  LockOutlined,
  CloudOutlined,
  TrophyOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { modernColors, spacing, glassEffect } from './theme/modernTheme';

const { Title, Text, Paragraph } = Typography;

// Animated background component
const AnimatedBackground = () => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  }}>
    <div style={{
      position: 'absolute',
      width: '150%',
      height: '150%',
      top: '-25%',
      left: '-25%',
      background: modernColors.gradients.light,
      opacity: 0.6,
    }}>
      {/* Animated circles */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: modernColors.gradients.primary,
        opacity: 0.1,
        animation: 'float 20s infinite ease-in-out',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: modernColors.gradients.secondary,
        opacity: 0.1,
        animation: 'float 25s infinite ease-in-out reverse',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: modernColors.gradients.purple,
        opacity: 0.08,
        animation: 'float 30s infinite ease-in-out',
      }} />
    </div>
  </div>
);

const Home = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Feature cards with modern design
  const features = [
    {
      icon: <FileProtectOutlined style={{ fontSize: 32 }} />,
      title: 'Invoice NFT Tokenization',
      description: 'Convert invoices into tradable ERC-721 NFTs for instant liquidity',
      gradient: modernColors.gradients.primary,
      stats: '10,000+',
      statsLabel: 'Escrows Created'
    },
    {
      icon: <SwapOutlined style={{ fontSize: 32 }} />,
      title: 'Instant Factoring',
      description: 'Sell invoices at discount for immediate payment, no waiting',
      gradient: modernColors.gradients.secondary,
      stats: '0.5%',
      statsLabel: 'Platform Fee'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 32 }} />,
      title: 'KYC/AML Compliance',
      description: '4-level verification system with automated fraud detection',
      gradient: modernColors.gradients.purple,
      stats: '$1M',
      statsLabel: 'Max Transaction'
    },
    {
      icon: <LineChartOutlined style={{ fontSize: 32 }} />,
      title: '7.2% APY Yield',
      description: 'Optional cmETH staking for yield on escrowed funds',
      gradient: modernColors.gradients.ocean,
      stats: '80%',
      statsLabel: 'Buyer Rewards'
    }
  ];

  // Stats for the platform
  const platformStats = [
    { value: 10007, suffix: '+', title: 'Total Escrows', prefix: '', icon: <FileProtectOutlined /> },
    { value: 1.2, suffix: 'M', title: 'Total Volume', prefix: '$', icon: <DollarOutlined /> },
    { value: 0.01, suffix: '', title: 'Gas Cost', prefix: '$', icon: <ThunderboltOutlined /> },
    { value: 99.9, suffix: '%', title: 'Uptime', prefix: '', icon: <CloudOutlined /> },
  ];

  // Use cases
  const useCases = [
    {
      title: 'Freelancers',
      icon: <TeamOutlined />,
      description: 'Get paid instantly for completed work',
      color: modernColors.primary,
    },
    {
      title: 'SME Suppliers',
      icon: <BankOutlined />,
      description: 'Convert invoices to working capital',
      color: modernColors.secondary,
    },
    {
      title: 'Investors',
      icon: <TrophyOutlined />,
      description: 'Earn returns from invoice discounts',
      color: modernColors.accent,
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: modernColors.lightBg,
    }}>
      <AnimatedBackground />

      {/* Hero Section with Modern Design */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        paddingTop: spacing.xxxl,
        paddingBottom: spacing.xxl,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `0 ${spacing.xl}px`,
        }}>
          {/* Hero Content */}
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Tag
                  color="blue"
                  style={{
                    padding: '6px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 20,
                    border: 'none',
                    background: modernColors.primaryLight,
                    color: modernColors.primary,
                  }}
                >
                  <RocketOutlined /> Powered by Mantle Network L2
                </Tag>

                <Title
                  level={1}
                  style={{
                    fontSize: 56,
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1.1,
                    background: modernColors.gradients.primary,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Invoice Factoring
                  <br />
                  <span style={{
                    background: modernColors.gradients.secondary,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Reimagined
                  </span>
                </Title>

                <Paragraph style={{
                  fontSize: 20,
                  color: modernColors.gray,
                  lineHeight: 1.6,
                  maxWidth: 500,
                }}>
                  Transform your invoices into liquid assets with blockchain-powered escrow
                  and instant NFT tokenization. Get paid today, not in 30 days.
                </Paragraph>

                {/* CTA Buttons */}
                <Space size="large" wrap>
                  <Button
                    type="primary"
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={() => router.push('/escrow')}
                    style={{
                      height: 56,
                      padding: '0 32px',
                      fontSize: 18,
                      fontWeight: 600,
                      borderRadius: 12,
                      background: modernColors.gradients.primary,
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
                    }}
                  >
                    Start Trading
                  </Button>

                  <Button
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => router.push('/marketplace')}
                    style={{
                      height: 56,
                      padding: '0 32px',
                      fontSize: 18,
                      fontWeight: 600,
                      borderRadius: 12,
                      background: 'white',
                      color: modernColors.primary,
                      border: `2px solid ${modernColors.primaryLight}`,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = modernColors.primaryLight;
                      e.currentTarget.style.borderColor = modernColors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = modernColors.primaryLight;
                    }}
                  >
                    Browse Marketplace
                  </Button>
                </Space>

                {/* Trust Indicators */}
                <Space size="large" style={{ marginTop: spacing.lg }}>
                  <Space size="small">
                    <CheckCircleOutlined style={{ color: modernColors.success, fontSize: 20 }} />
                    <Text style={{ color: modernColors.gray, fontWeight: 500 }}>
                      KYC Verified
                    </Text>
                  </Space>
                  <Space size="small">
                    <LockOutlined style={{ color: modernColors.success, fontSize: 20 }} />
                    <Text style={{ color: modernColors.gray, fontWeight: 500 }}>
                      Escrow Protected
                    </Text>
                  </Space>
                  <Space size="small">
                    <ThunderboltOutlined style={{ color: modernColors.success, fontSize: 20 }} />
                    <Text style={{ color: modernColors.gray, fontWeight: 500 }}>
                      Instant Settlement
                    </Text>
                  </Space>
                </Space>
              </Space>
            </Col>

            <Col xs={24} lg={12}>
              {/* Animated Stats Card */}
              <Card
                style={{
                  ...glassEffect,
                  borderRadius: 24,
                  padding: spacing.xl,
                  border: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  background: modernColors.gradients.primary,
                  borderRadius: '50%',
                  opacity: 0.1,
                }} />

                <Title level={4} style={{ marginBottom: spacing.lg, color: modernColors.dark }}>
                  Platform Statistics
                </Title>

                <Row gutter={[24, 24]}>
                  {platformStats.map((stat, index) => (
                    <Col span={12} key={index}>
                      <div style={{
                        opacity: statsVisible ? 1 : 0,
                        transform: statsVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.5s ease ${index * 0.1}s`,
                      }}>
                        <div style={{ fontSize: 24, color: modernColors.primary, marginBottom: 8 }}>
                          {stat.icon}
                        </div>
                        <div style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: modernColors.dark,
                        }}>
                          {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                        </div>
                        <Text style={{ fontSize: 14, color: modernColors.gray }}>
                          {stat.title}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>

                <Divider />

                <div style={{
                  padding: spacing.md,
                  background: modernColors.primaryLight,
                  borderRadius: 12,
                  textAlign: 'center',
                }}>
                  <Space>
                    <Badge status="success" />
                    <Text strong style={{ color: modernColors.primary }}>
                      Live on Mantle Sepolia Testnet
                    </Text>
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: `${spacing.xxxl}px ${spacing.xl}px`,
        background: 'white',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
            <Title level={2} style={{
              fontSize: 42,
              fontWeight: 700,
              marginBottom: spacing.md,
              background: modernColors.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Why Choose SecuredTransfer?
            </Title>
            <Paragraph style={{
              fontSize: 18,
              color: modernColors.gray,
              maxWidth: 600,
              margin: '0 auto',
            }}>
              The most advanced invoice factoring platform built on blockchain technology
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card
                  hoverable
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    height: '100%',
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: hoveredCard === index
                      ? '0 20px 40px rgba(0,0,0,0.1)'
                      : '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    transform: hoveredCard === index ? 'translateY(-8px)' : 'translateY(0)',
                    background: hoveredCard === index ? 'white' : modernColors.lightBg,
                  }}
                >
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: feature.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    color: 'white',
                  }}>
                    {feature.icon}
                  </div>

                  <Title level={4} style={{
                    fontSize: 20,
                    marginBottom: spacing.sm,
                  }}>
                    {feature.title}
                  </Title>

                  <Paragraph style={{
                    color: modernColors.gray,
                    marginBottom: spacing.lg,
                  }}>
                    {feature.description}
                  </Paragraph>

                  <div style={{
                    paddingTop: spacing.md,
                    borderTop: `1px solid ${modernColors.grayLighter}`,
                  }}>
                    <Text strong style={{ fontSize: 24, color: modernColors.dark }}>
                      {feature.stats}
                    </Text>
                    <br />
                    <Text style={{ color: modernColors.gray, fontSize: 12 }}>
                      {feature.statsLabel}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Use Cases Section */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: `${spacing.xxxl}px ${spacing.xl}px`,
        background: modernColors.lightBg,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
            <Title level={2} style={{
              fontSize: 42,
              fontWeight: 700,
              marginBottom: spacing.md,
            }}>
              Built for Everyone
            </Title>
            <Paragraph style={{
              fontSize: 18,
              color: modernColors.gray,
            }}>
              From freelancers to enterprises, we've got you covered
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} justify="center">
            {useCases.map((useCase, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card
                  style={{
                    borderRadius: 20,
                    border: 'none',
                    textAlign: 'center',
                    padding: spacing.xl,
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                  }}
                  hoverable
                >
                  <div style={{
                    fontSize: 48,
                    color: useCase.color,
                    marginBottom: spacing.lg,
                  }}>
                    {useCase.icon}
                  </div>
                  <Title level={4}>{useCase.title}</Title>
                  <Paragraph style={{ color: modernColors.gray }}>
                    {useCase.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: `${spacing.xxxl}px ${spacing.xl}px`,
        background: modernColors.gradients.primary,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{
            color: 'white',
            fontSize: 42,
            fontWeight: 700,
            marginBottom: spacing.md,
          }}>
            Ready to Get Started?
          </Title>
          <Paragraph style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 18,
            marginBottom: spacing.xl,
          }}>
            Join thousands of businesses already using SecuredTransfer for instant invoice liquidity
          </Paragraph>
          <Space size="large">
            <Button
              size="large"
              onClick={() => router.push('/escrow')}
              style={{
                height: 56,
                padding: '0 40px',
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 12,
                background: 'white',
                color: modernColors.primary,
                border: 'none',
              }}
            >
              Create Your First Escrow
            </Button>
            <Button
              size="large"
              ghost
              onClick={() => router.push('/tutorials')}
              style={{
                height: 56,
                padding: '0 40px',
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 12,
                color: 'white',
                borderColor: 'white',
              }}
            >
              Learn More
            </Button>
          </Space>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(1deg);
          }
          66% {
            transform: translateY(20px) rotate(-1deg);
          }
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }
      `}</style>
    </div>
  );
};

export default Home;