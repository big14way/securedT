'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { abbreviate, isAdminAddress } from '../util';
import { ACTIVE_CHAIN, APP_NAME, siteConfig } from '../constants';
import StyledComponentsRegistry from './AntdRegistry';
import { App, Button, ConfigProvider, Layout } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import Image from 'next/image';
import ConnectButton from './ConnectButton';
import NetworkStatus from './NetworkStatus';
import Logo from './Logo';
import Navigation from './Navigation';
import { Theme } from '@ant-design/cssinjs';
import { antdTheme, colors } from '../theme/colors';


function UiLayoutWrapper({ children }) {
	const pathname = usePathname();
	const isOfferDetails = pathname && pathname.startsWith('/offer/');

	return (
		<StyledComponentsRegistry>
			<ConfigProvider theme={antdTheme}>
				<App>
					<Layout style={{
						minHeight: '100vh',
						background: 'transparent'
					}}>
					<Header style={{
						background: 'rgba(15, 15, 26, 0.85)',
						backdropFilter: 'blur(20px) saturate(180%)',
						WebkitBackdropFilter: 'blur(20px) saturate(180%)',
						borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
						boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 240, 255, 0.05)',
						display: 'grid',
						gridTemplateColumns: '1fr auto',
						alignItems: 'center',
						padding: 0,
						position: 'sticky',
						top: 0,
						zIndex: 1000,
						height: 64,
						gap: '16px'
					}}>
						<Navigation />
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								paddingRight: '16px',
								zIndex: 1001
							}}
						>
							<NetworkStatus showSwitcher={true} />
							<ConnectButton size="middle" />
						</div>
					</Header>
					<Content className="container" style={{ position: 'relative', zIndex: 1 }}>
						<div className="container">{children}</div>
					</Content>
					{/* Hide Footer on offer details page */}
					{!isOfferDetails && (
						<Footer style={{
							textAlign: 'center',
							background: 'rgba(15, 15, 26, 0.85)',
							backdropFilter: 'blur(20px)',
							WebkitBackdropFilter: 'blur(20px)',
							borderTop: '1px solid rgba(0, 240, 255, 0.2)',
							color: '#94a3b8',
							padding: '24px 50px'
						}}>
							<div style={{
								borderTop: '1px solid rgba(0, 240, 255, 0.1)',
								paddingTop: '24px',
								marginBottom: '16px'
							}} />
							<div style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								gap: '8px',
								flexWrap: 'wrap'
							}}>
								<span style={{
									background: 'linear-gradient(90deg, #00f0ff, #ff00ff)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
									backgroundClip: 'text',
									fontWeight: 600
								}}>{APP_NAME}</span>
								<span style={{ color: '#64748b' }}>|</span>
								<span style={{
									color: '#00f0ff',
									fontSize: '13px'
								}}>{ACTIVE_CHAIN.name}</span>
								<span style={{ color: '#64748b' }}>|</span>
								<Link href="/about" style={{
									color: '#94a3b8',
									transition: 'all 0.3s ease'
								}}>About</Link>
							</div>
							<div style={{
								marginTop: '12px',
								fontSize: '12px',
								color: '#64748b'
							}}>
								Powered by blockchain technology
							</div>
						</Footer>
					)}
					</Layout>
				</App>
			</ConfigProvider>
		</StyledComponentsRegistry>
	);
}

export default UiLayoutWrapper;
