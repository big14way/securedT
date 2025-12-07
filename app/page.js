'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, Spin, Row, Col, Space, Card } from 'antd';
import { APP_DESC, APP_NAME, siteConfig } from './constants';
import {
	CheckCircleTwoTone,
	LockTwoTone,
	SafetyCertificateTwoTone,
	EyeTwoTone,
	ThunderboltOutlined,
	SafetyOutlined,
	SwapOutlined,
	LineChartOutlined,
	ShieldOutlined,
	GlobalOutlined,
	RocketOutlined,
	ApiOutlined
} from '@ant-design/icons';
import Logo from './lib/Logo';
import { useRouter } from 'next/navigation';
import { colors } from './theme/colors';

const CHECKLIST_ITEMS = [
	{
		text: "Secure USDT escrow with compliance & fraud protection",
		icon: <ShieldOutlined style={{ color: '#00f0ff' }} />
	},
	{
		text: "Automated refunds via oracle attestations",
		icon: <ApiOutlined style={{ color: '#ff00ff' }} />
	},
	{
		text: "Transparent on-chain transaction history",
		icon: <GlobalOutlined style={{ color: '#00ff88' }} />
	}
];

const FEATURES = [
	{
		icon: <LockTwoTone twoToneColor="#00f0ff" style={{ fontSize: 32 }} />,
		title: 'Secure Escrow',
		description: 'Smart contract-based escrow with multi-sig security',
		color: '#00f0ff'
	},
	{
		icon: <SafetyCertificateTwoTone twoToneColor="#ff00ff" style={{ fontSize: 32 }} />,
		title: 'KYC Compliance',
		description: 'Built-in identity verification and compliance checks',
		color: '#ff00ff'
	},
	{
		icon: <LineChartOutlined style={{ fontSize: 32, color: '#00ff88' }} />,
		title: 'Yield Generation',
		description: 'Earn yield on idle funds through mETH Protocol',
		color: '#00ff88'
	},
	{
		icon: <SwapOutlined style={{ fontSize: 32, color: '#a855f7' }} />,
		title: 'NFT Invoices',
		description: 'Tokenize invoices as tradable NFTs',
		color: '#a855f7'
	}
];

const Home = () => {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'transparent',
				position: 'relative',
				overflow: 'hidden'
			}}
		>
			{/* Hero Section */}
			<div style={{ padding: '60px 24px 80px', position: 'relative' }}>
				<Row
					gutter={[48, 48]}
					align="middle"
					justify="center"
					style={{ minHeight: '70vh', maxWidth: '1400px', margin: '0 auto' }}
				>
					{/* Left Side - Content */}
					<Col xs={24} lg={12}>
						<div style={{
							textAlign: 'left',
							opacity: mounted ? 1 : 0,
							transform: mounted ? 'translateY(0)' : 'translateY(20px)',
							transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
						}}>
							<Space direction="vertical" size="large" style={{ width: '100%' }}>
								{/* Badge */}
								<div style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: 8,
									background: 'rgba(0, 240, 255, 0.1)',
									border: '1px solid rgba(0, 240, 255, 0.3)',
									borderRadius: 20,
									padding: '6px 16px',
									marginBottom: 16
								}}>
									<ThunderboltOutlined style={{ color: '#00f0ff' }} />
									<span style={{ color: '#00f0ff', fontSize: 13, fontWeight: 500 }}>
										Powered by Mantle Network
									</span>
								</div>

								{/* Hero Title */}
								<div>
									<h1
										style={{
											fontSize: '56px',
											fontWeight: 800,
											lineHeight: '1.1',
											marginBottom: '24px',
											margin: 0,
											fontFamily: "'Orbitron', sans-serif",
											letterSpacing: '-1px'
										}}
									>
										<span style={{ color: '#ffffff' }}>Enterprise RWA</span>
										<br />
										<span style={{
											background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											backgroundClip: 'text',
											display: 'inline-block',
											animation: 'textGlow 3s ease-in-out infinite'
										}}>
											Payment Protocol
										</span>
									</h1>
									<p
										style={{
											fontSize: '18px',
											color: '#94a3b8',
											lineHeight: '1.7',
											marginBottom: '32px',
											maxWidth: '480px'
										}}
									>
										Tokenize invoices as tradable NFTs with instant liquidity through
										blockchain-based escrow and compliance on Mantle's ultra-low-cost Layer 2.
									</p>
								</div>

								{/* Feature List */}
								<div style={{ marginBottom: '32px' }}>
									{CHECKLIST_ITEMS.map((item, i) => (
										<div
											key={i}
											style={{
												display: 'flex',
												alignItems: 'center',
												marginBottom: '16px',
												padding: '12px 16px',
												background: 'rgba(22, 22, 42, 0.6)',
												borderRadius: 10,
												border: '1px solid rgba(0, 240, 255, 0.1)',
												transition: 'all 0.3s ease',
												cursor: 'default'
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
												e.currentTarget.style.transform = 'translateX(8px)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.1)';
												e.currentTarget.style.transform = 'translateX(0)';
											}}
										>
											<span style={{ marginRight: 12, fontSize: 18 }}>
												{item.icon}
											</span>
											<span
												style={{
													color: '#e2e8f0',
													fontSize: '15px',
													lineHeight: '1.5'
												}}
											>
												{item.text}
											</span>
										</div>
									))}
								</div>

								{/* CTA Buttons */}
								<Space size="middle" style={{ marginTop: '16px' }}>
									<Button
										size="large"
										type="primary"
										onClick={() => router.push('/escrow')}
										icon={<RocketOutlined />}
										style={{
											height: '52px',
											padding: '0 36px',
											fontSize: '16px',
											fontWeight: '600',
											borderRadius: '10px',
											background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)',
											border: 'none',
											boxShadow: '0 4px 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.1)'
										}}
									>
										Launch App
									</Button>
									<Button
										size="large"
										onClick={() => router.push('/about')}
										style={{
											height: '52px',
											padding: '0 36px',
											fontSize: '16px',
											fontWeight: '600',
											borderRadius: '10px',
											background: 'transparent',
											border: '1px solid rgba(0, 240, 255, 0.5)',
											color: '#00f0ff'
										}}
									>
										Learn More
									</Button>
								</Space>
							</Space>
						</div>
					</Col>

					{/* Right Side - Cyber Visual */}
					<Col xs={24} lg={12}>
						<div style={{
							textAlign: 'center',
							position: 'relative',
							opacity: mounted ? 1 : 0,
							transform: mounted ? 'translateY(0)' : 'translateY(20px)',
							transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
							transitionDelay: '0.2s'
						}}>
							{/* Main Visual Container */}
							<div
								style={{
									background: 'rgba(22, 22, 42, 0.8)',
									backdropFilter: 'blur(20px)',
									borderRadius: '24px',
									padding: '48px',
									position: 'relative',
									overflow: 'hidden',
									minHeight: '500px',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									border: '1px solid rgba(0, 240, 255, 0.2)',
									boxShadow: '0 0 60px rgba(0, 240, 255, 0.1), inset 0 0 60px rgba(0, 240, 255, 0.03)'
								}}
							>
								{/* Animated Grid Pattern */}
								<div
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										backgroundImage: `
											linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
											linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
										`,
										backgroundSize: '30px 30px',
										opacity: 0.5
									}}
								/>

								{/* Glowing Orbs */}
								<div style={{
									position: 'absolute',
									top: '20%',
									left: '10%',
									width: 150,
									height: 150,
									background: 'radial-gradient(circle, rgba(0, 240, 255, 0.2) 0%, transparent 70%)',
									borderRadius: '50%',
									filter: 'blur(40px)',
									animation: 'float 6s ease-in-out infinite'
								}} />
								<div style={{
									position: 'absolute',
									bottom: '20%',
									right: '10%',
									width: 120,
									height: 120,
									background: 'radial-gradient(circle, rgba(255, 0, 255, 0.2) 0%, transparent 70%)',
									borderRadius: '50%',
									filter: 'blur(40px)',
									animation: 'float 8s ease-in-out infinite reverse'
								}} />

								{/* Main Visual Content */}
								<div style={{ position: 'relative', zIndex: 1, color: 'white', textAlign: 'center' }}>
									{/* Central Shield Icon */}
									<div style={{ marginBottom: '32px' }}>
										<div
											style={{
												width: '140px',
												height: '140px',
												background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(255, 0, 255, 0.2) 100%)',
												borderRadius: '28px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												margin: '0 auto 24px',
												border: '2px solid rgba(0, 240, 255, 0.3)',
												boxShadow: '0 0 40px rgba(0, 240, 255, 0.3), inset 0 0 40px rgba(0, 240, 255, 0.1)',
												animation: 'glow 3s ease-in-out infinite'
											}}
										>
											<svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="url(#shieldGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M9 12L11 14L15 10" stroke="url(#checkGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<defs>
													<linearGradient id="shieldGradient" x1="3" y1="1" x2="21" y2="23" gradientUnits="userSpaceOnUse">
														<stop stopColor="#00f0ff"/>
														<stop offset="1" stopColor="#ff00ff"/>
													</linearGradient>
													<linearGradient id="checkGradient" x1="9" y1="10" x2="15" y2="14" gradientUnits="userSpaceOnUse">
														<stop stopColor="#00ff88"/>
														<stop offset="1" stopColor="#00f0ff"/>
													</linearGradient>
												</defs>
											</svg>
										</div>
									</div>

									{/* Process Flow */}
									<div style={{ marginBottom: '40px' }}>
										<h3 style={{
											color: 'white',
											fontSize: '18px',
											fontWeight: '600',
											marginBottom: '24px',
											fontFamily: "'Orbitron', sans-serif",
											letterSpacing: '2px'
										}}>
											SECURE TRANSACTION FLOW
										</h3>
										<div style={{
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
											gap: 16,
											flexWrap: 'wrap'
										}}>
											{['Deposit', 'Verify', 'Release'].map((step, i) => (
												<React.Fragment key={step}>
													<div style={{ textAlign: 'center' }}>
														<div
															style={{
																width: '64px',
																height: '64px',
																background: 'rgba(0, 240, 255, 0.1)',
																border: '1px solid rgba(0, 240, 255, 0.3)',
																borderRadius: '16px',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																margin: '0 auto 12px',
																fontSize: '24px',
																transition: 'all 0.3s ease',
																cursor: 'default'
															}}
															onMouseEnter={(e) => {
																e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.4)';
																e.currentTarget.style.transform = 'scale(1.1)';
															}}
															onMouseLeave={(e) => {
																e.currentTarget.style.boxShadow = 'none';
																e.currentTarget.style.transform = 'scale(1)';
															}}
														>
															{i === 0 ? '💰' : i === 1 ? '🔍' : '✅'}
														</div>
														<div style={{
															fontSize: '12px',
															fontWeight: '600',
															color: '#94a3b8',
															textTransform: 'uppercase',
															letterSpacing: '1px'
														}}>
															{step}
														</div>
													</div>
													{i < 2 && (
														<div style={{
															color: '#00f0ff',
															fontSize: '20px',
															animation: 'pulse 2s ease-in-out infinite',
															animationDelay: `${i * 0.5}s`
														}}>
															→
														</div>
													)}
												</React.Fragment>
											))}
										</div>
									</div>

									{/* Stats */}
									<div style={{
										display: 'flex',
										justifyContent: 'center',
										gap: '32px',
										flexWrap: 'wrap'
									}}>
										{[
											{ value: '< $0.01', label: 'TX FEES' },
											{ value: '100%', label: 'SECURE' },
											{ value: '24/7', label: 'UPTIME' }
										].map((stat, i) => (
											<div key={i} style={{ textAlign: 'center' }}>
												<div style={{
													fontSize: '28px',
													fontWeight: '700',
													background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
													WebkitBackgroundClip: 'text',
													WebkitTextFillColor: 'transparent',
													backgroundClip: 'text',
													fontFamily: "'Orbitron', sans-serif"
												}}>
													{stat.value}
												</div>
												<div style={{
													fontSize: '11px',
													color: '#64748b',
													letterSpacing: '2px',
													marginTop: '4px'
												}}>
													{stat.label}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</Col>
				</Row>
			</div>

			{/* Features Section */}
			<div style={{
				padding: '80px 24px',
				background: 'rgba(15, 15, 26, 0.5)',
				backdropFilter: 'blur(10px)',
				borderTop: '1px solid rgba(0, 240, 255, 0.1)',
				borderBottom: '1px solid rgba(0, 240, 255, 0.1)'
			}}>
				<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<div style={{ textAlign: 'center', marginBottom: '60px' }}>
						<h2 style={{
							fontSize: '36px',
							fontWeight: '700',
							color: '#ffffff',
							marginBottom: '16px',
							fontFamily: "'Orbitron', sans-serif"
						}}>
							<span style={{
								background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text'
							}}>
								Core Features
							</span>
						</h2>
						<p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
							Built for enterprise-grade security and seamless Web3 integration
						</p>
					</div>

					<Row gutter={[24, 24]}>
						{FEATURES.map((feature, i) => (
							<Col xs={24} sm={12} lg={6} key={i}>
								<Card
									style={{
										background: 'rgba(22, 22, 42, 0.6)',
										border: '1px solid rgba(0, 240, 255, 0.15)',
										borderRadius: '16px',
										height: '100%',
										transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
										cursor: 'default'
									}}
									bodyStyle={{ padding: '32px 24px', textAlign: 'center' }}
									hoverable
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = feature.color;
										e.currentTarget.style.boxShadow = `0 0 40px ${feature.color}33`;
										e.currentTarget.style.transform = 'translateY(-8px)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.15)';
										e.currentTarget.style.boxShadow = 'none';
										e.currentTarget.style.transform = 'translateY(0)';
									}}
								>
									<div style={{
										width: '72px',
										height: '72px',
										background: `${feature.color}15`,
										borderRadius: '20px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										margin: '0 auto 20px',
										border: `1px solid ${feature.color}30`
									}}>
										{feature.icon}
									</div>
									<h3 style={{
										color: '#ffffff',
										fontSize: '18px',
										fontWeight: '600',
										marginBottom: '12px'
									}}>
										{feature.title}
									</h3>
									<p style={{
										color: '#94a3b8',
										fontSize: '14px',
										lineHeight: '1.6',
										margin: 0
									}}>
										{feature.description}
									</p>
								</Card>
							</Col>
						))}
					</Row>
				</div>
			</div>

			{/* CTA Section */}
			<div style={{
				padding: '80px 24px',
				textAlign: 'center'
			}}>
				<div style={{ maxWidth: '600px', margin: '0 auto' }}>
					<h2 style={{
						fontSize: '32px',
						fontWeight: '700',
						color: '#ffffff',
						marginBottom: '20px',
						fontFamily: "'Orbitron', sans-serif"
					}}>
						Ready to get started?
					</h2>
					<p style={{
						color: '#94a3b8',
						fontSize: '16px',
						marginBottom: '32px',
						lineHeight: '1.7'
					}}>
						Join the future of enterprise payments with secure escrow,
						compliant transactions, and yield generation.
					</p>
					<Button
						size="large"
						type="primary"
						onClick={() => router.push('/escrow')}
						style={{
							height: '56px',
							padding: '0 48px',
							fontSize: '18px',
							fontWeight: '600',
							borderRadius: '12px',
							background: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)',
							border: 'none',
							boxShadow: '0 4px 30px rgba(0, 240, 255, 0.4)'
						}}
					>
						Create Your First Escrow
					</Button>
				</div>
			</div>

			<style jsx>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-20px); }
				}
				@keyframes pulse {
					0%, 100% { opacity: 1; transform: scale(1); }
					50% { opacity: 0.7; transform: scale(1.1); }
				}
				@keyframes glow {
					0%, 100% { box-shadow: 0 0 40px rgba(0, 240, 255, 0.3), inset 0 0 40px rgba(0, 240, 255, 0.1); }
					50% { box-shadow: 0 0 60px rgba(0, 240, 255, 0.5), inset 0 0 60px rgba(0, 240, 255, 0.15); }
				}
				@keyframes textGlow {
					0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.3)); }
					50% { filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.5)); }
				}
			`}</style>
		</div>
	);
};

export default Home;
