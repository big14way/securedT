'use client';

import React from 'react';
import { Button, Row, Col, Space, Card } from 'antd';
import { CheckCircleTwoTone, SafetyCertificateOutlined, ThunderboltOutlined, FileProtectOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const FEATURES = [
	{
		icon: <SafetyCertificateOutlined style={{ fontSize: '32px', color: '#00aef2' }} />,
		title: 'Secure Escrow',
		description: 'Smart contract-based escrow holds USDT securely until transaction conditions are met.'
	},
	{
		icon: <FileProtectOutlined style={{ fontSize: '32px', color: '#00aef2' }} />,
		title: 'Invoice NFTs',
		description: 'Tokenize invoices as ERC-721 NFTs for tradable, verifiable payment claims.'
	},
	{
		icon: <ThunderboltOutlined style={{ fontSize: '32px', color: '#00aef2' }} />,
		title: 'Instant Liquidity',
		description: 'Sell invoices on the marketplace for immediate payment at competitive discounts.'
	},
	{
		icon: <DollarCircleOutlined style={{ fontSize: '32px', color: '#00aef2' }} />,
		title: 'Ultra-Low Fees',
		description: 'Pay just 0.1-0.5% in fees vs 2-5% with traditional invoice factoring.'
	}
];

const CHECKLIST_ITEMS = [
	"Secure USDT escrow with compliance & fraud protection",
	"Automated refunds via oracle attestations",
	"Transparent on-chain transaction history"
];

const Home = () => {
	const router = useRouter();

	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #e6f7ff 0%, #d6f1ff 100%)'
			}}
		>
			{/* Hero Section */}
			<div style={{ padding: '80px 48px' }}>
				<Row
					gutter={[64, 48]}
					align="middle"
					justify="center"
					style={{ minHeight: '60vh', maxWidth: '1800px', margin: '0 auto' }}
				>
					{/* Left Side - Content */}
					<Col xs={24} lg={12}>
						<div style={{ textAlign: 'left' }}>
							<Space direction="vertical" size="large" style={{ width: '100%' }}>
								{/* Hero Title */}
								<div>
									<h1
										style={{
											fontSize: '52px',
											fontWeight: 'bold',
											color: '#1f2937',
											lineHeight: '1.1',
											marginBottom: '24px',
											margin: 0
										}}
									>
										Enterprise RWA Payments
										<span style={{ color: '#00aef2', display: 'block' }}>On Mantle Network</span>
									</h1>
									<p
										style={{
											fontSize: '22px',
											color: '#6b7280',
											lineHeight: '1.6',
											marginBottom: '32px',
											maxWidth: '500px'
										}}
									>
										Tokenize invoices as tradable NFTs with instant liquidity through blockchain-based escrow and compliance on Mantle's ultra-low-cost Layer 2.
									</p>
								</div>

								{/* Feature List */}
								<div style={{ marginBottom: '32px' }}>
									{CHECKLIST_ITEMS.map((item, i) => (
										<div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
											<CheckCircleTwoTone
												twoToneColor="#00aef2"
												style={{ fontSize: '20px', marginTop: '4px', marginRight: '12px' }}
											/>
											<span
												style={{
													color: '#4b5563',
													fontSize: '16px',
													lineHeight: '1.6'
												}}
											>
												{item}
											</span>
										</div>
									))}
								</div>

								{/* CTA Buttons */}
								<Space size="middle" style={{ marginTop: '32px' }}>
									<Button
										size="large"
										type="primary"
										onClick={() => router.push('/escrow')}
										style={{
											height: '48px',
											padding: '0 32px',
											fontSize: '18px',
											fontWeight: '600',
											borderRadius: '8px'
										}}
									>
										Create Escrow
									</Button>
									<Button
										size="large"
										onClick={() => router.push('/about')}
										style={{
											height: '48px',
											padding: '0 32px',
											fontSize: '18px',
											fontWeight: '600',
											borderRadius: '8px'
										}}
									>
										Learn More
									</Button>
								</Space>
							</Space>
						</div>
					</Col>

					{/* Right Side - Visual */}
					<Col xs={24} lg={12}>
						<div style={{ textAlign: 'center', position: 'relative' }}>
							{/* Animated Visual Container */}
							<div
								style={{
									background: 'linear-gradient(135deg, #00aef2 0%, #4f4d4c 100%)',
									borderRadius: '24px',
									padding: '48px',
									position: 'relative',
									overflow: 'hidden',
									minHeight: '500px',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								{/* Background Pattern */}
								<div
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
										opacity: 0.2
									}}
								/>
								
								{/* Main Visual Content */}
								<div style={{ position: 'relative', zIndex: 1, color: 'white', textAlign: 'center' }}>
									{/* Central Animation - Escrow Shield */}
									<div style={{ marginBottom: '40px' }}>
										<div
											style={{
												width: '140px',
												height: '140px',
												background: 'rgba(255, 255, 255, 0.15)',
												borderRadius: '20px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												margin: '0 auto 24px',
												animation: 'pulse 2s ease-in-out infinite',
												border: '2px solid rgba(255, 255, 255, 0.3)'
											}}
										>
											<svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</div>

										{/* Floating Elements */}
										<div style={{ position: 'relative', height: '80px' }}>
											<div
												style={{
													position: 'absolute',
													top: '10px',
													left: '20%',
													background: 'rgba(255, 255, 255, 0.2)',
													padding: '8px 12px',
													borderRadius: '15px',
													fontSize: '12px',
													animation: 'float 3s ease-in-out infinite',
													animationDelay: '0s'
												}}
											>
												🔒 Escrow
											</div>
											<div
												style={{
													position: 'absolute',
													top: '40px',
													right: '20%',
													background: 'rgba(255, 255, 255, 0.2)',
													padding: '8px 12px',
													borderRadius: '15px',
													fontSize: '12px',
													animation: 'float 3s ease-in-out infinite',
													animationDelay: '1s'
												}}
											>
												💰 USDT
											</div>
											<div
												style={{
													position: 'absolute',
													top: '0px',
													right: '10%',
													background: 'rgba(255, 255, 255, 0.2)',
													padding: '8px 12px',
													borderRadius: '15px',
													fontSize: '12px',
													animation: 'float 3s ease-in-out infinite',
													animationDelay: '2s'
												}}
											>
												🔍 Oracle
											</div>
										</div>
									</div>

									{/* Process Flow */}
									<div style={{ marginBottom: '32px' }}>
										<h3 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
											Secure Transaction Flow
										</h3>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '300px', margin: '0 auto' }}>
											<div style={{ textAlign: 'center', opacity: 0.9 }}>
												<div
													style={{
														width: '50px',
														height: '50px',
														background: 'rgba(255, 255, 255, 0.2)',
														borderRadius: '50%',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														margin: '0 auto 8px',
														fontSize: '20px'
													}}
												>
													💰
												</div>
												<div style={{ fontSize: '11px', fontWeight: '500' }}>Deposit</div>
											</div>
											<div style={{ color: 'white', fontSize: '16px', animation: 'slideRight 2s ease-in-out infinite' }}>→</div>
											<div style={{ textAlign: 'center', opacity: 0.9 }}>
												<div
													style={{
														width: '50px',
														height: '50px',
														background: 'rgba(255, 255, 255, 0.2)',
														borderRadius: '50%',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														margin: '0 auto 8px',
														fontSize: '20px'
													}}
												>
													🔍
												</div>
												<div style={{ fontSize: '11px', fontWeight: '500' }}>Verify</div>
											</div>
											<div style={{ color: 'white', fontSize: '16px', animation: 'slideRight 2s ease-in-out infinite', animationDelay: '0.5s' }}>→</div>
											<div style={{ textAlign: 'center', opacity: 0.9 }}>
												<div
													style={{
														width: '50px',
														height: '50px',
														background: 'rgba(255, 255, 255, 0.2)',
														borderRadius: '50%',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														margin: '0 auto 8px',
														fontSize: '20px'
													}}
												>
													✅
												</div>
												<div style={{ fontSize: '11px', fontWeight: '500' }}>Release</div>
											</div>
										</div>
									</div>

									{/* Feature Badges */}
									<div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
										<div
											style={{
												background: 'rgba(255, 255, 255, 0.15)',
												padding: '6px 12px',
												borderRadius: '15px',
												fontSize: '12px',
												fontWeight: '500',
												animation: 'glow 2s ease-in-out infinite alternate'
											}}
										>
											🛡️ Protected
										</div>
										<div
											style={{
												background: 'rgba(255, 255, 255, 0.15)',
												padding: '6px 12px',
												borderRadius: '15px',
												fontSize: '12px',
												fontWeight: '500',
												animation: 'glow 2s ease-in-out infinite alternate',
												animationDelay: '0.5s'
											}}
										>
											⚡ Automated
										</div>
										<div
											style={{
												background: 'rgba(255, 255, 255, 0.15)',
												padding: '6px 12px',
												borderRadius: '15px',
												fontSize: '12px',
												fontWeight: '500',
												animation: 'glow 2s ease-in-out infinite alternate',
												animationDelay: '1s'
											}}
										>
											🔍 Transparent
										</div>
									</div>
								</div>
							</div>
						</div>
					</Col>
				</Row>

				<style jsx>{`
					@keyframes float {
						0%, 100% { transform: translateY(0px); }
						50% { transform: translateY(-15px); }
					}
					@keyframes pulse {
						0%, 100% { transform: scale(1); }
						50% { transform: scale(1.05); }
					}
					@keyframes slideRight {
						0%, 100% { transform: translateX(0px); opacity: 1; }
						50% { transform: translateX(5px); opacity: 0.7; }
					}
					@keyframes glow {
						0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.2); }
						100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.4); }
					}
				`}</style>

			</div>

			{/* Features Section */}
			<div style={{ padding: '80px 48px', background: 'white' }}>
				<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<h2 style={{
						textAlign: 'center',
						fontSize: '36px',
						fontWeight: 'bold',
						color: '#1f2937',
						marginBottom: '16px'
					}}>
						Why SecuredTransfer?
					</h2>
					<p style={{
						textAlign: 'center',
						fontSize: '18px',
						color: '#6b7280',
						marginBottom: '48px',
						maxWidth: '600px',
						margin: '0 auto 48px'
					}}>
						Built on Mantle Network for enterprise-grade security with ultra-low transaction costs
					</p>

					<Row gutter={[32, 32]}>
						{FEATURES.map((feature, index) => (
							<Col xs={24} sm={12} lg={6} key={index}>
								<Card
									bordered={false}
									style={{
										height: '100%',
										textAlign: 'center',
										background: '#f8fafc',
										borderRadius: '16px',
										transition: 'transform 0.2s, box-shadow 0.2s'
									}}
									hoverable
								>
									<div style={{ marginBottom: '16px' }}>
										{feature.icon}
									</div>
									<h3 style={{
										fontSize: '18px',
										fontWeight: '600',
										color: '#1f2937',
										marginBottom: '12px'
									}}>
										{feature.title}
									</h3>
									<p style={{
										fontSize: '14px',
										color: '#6b7280',
										lineHeight: '1.6',
										margin: 0
									}}>
										{feature.description}
									</p>
								</Card>
							</Col>
						))}
					</Row>

					{/* Stats Section */}
					<Row gutter={[32, 32]} style={{ marginTop: '64px' }}>
						<Col xs={24} sm={8}>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00aef2' }}>~$0.10</div>
								<div style={{ fontSize: '16px', color: '#6b7280' }}>Average Transaction Cost</div>
							</div>
						</Col>
						<Col xs={24} sm={8}>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00aef2' }}>7.2%</div>
								<div style={{ fontSize: '16px', color: '#6b7280' }}>Yield APY via mETH</div>
							</div>
						</Col>
						<Col xs={24} sm={8}>
							<div style={{ textAlign: 'center' }}>
								<div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00aef2' }}>300+</div>
								<div style={{ fontSize: '16px', color: '#6b7280' }}>Supported Wallets</div>
							</div>
						</Col>
					</Row>

					{/* CTA Section */}
					<div style={{ textAlign: 'center', marginTop: '64px' }}>
						<Button
							type="primary"
							size="large"
							onClick={() => router.push('/escrow')}
							style={{
								height: '56px',
								padding: '0 48px',
								fontSize: '18px',
								fontWeight: '600',
								borderRadius: '8px'
							}}
						>
							Get Started Now
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;