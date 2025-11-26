'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { abbreviate, isAdminAddress } from '../util';
import { ACTIVE_CHAIN, APP_NAME, siteConfig } from '../constants';
import StyledComponentsRegistry from './AntdRegistry';
import { Button, ConfigProvider, Layout } from 'antd';
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
			       <Layout>
				       <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', padding: 0 }}>
					       <Navigation />
					       <span
						       style={{
							       float: 'right',
							       right: 20,
							       position: 'absolute',
							       display: 'flex',
							       alignItems: 'center',
							       gap: '12px'
						       }}
					       >
						       <NetworkStatus showSwitcher={true} />
						       <ConnectButton size="middle" />
					       </span>
				       </Header>
				       {/* <span className="float-right bold active-network" style={{ color: '#8c8c8c' }}>
					       Using network: {ACTIVE_CHAIN.name}&nbsp;
				       </span> */}
				       <Content className="container">
					       <div className="container">{children}</div>
				       </Content>
				       {/* Hide Footer on offer details page */}
				       {!isOfferDetails && (
					       <Footer style={{ textAlign: 'center' }}>
						       <hr />
						       <br />
						       {APP_NAME}. {ACTIVE_CHAIN.name} network. <a href="/about">About</a>
					       </Footer>
				       )}
			       </Layout>
		       </ConfigProvider>
	       </StyledComponentsRegistry>
       );
}

export default UiLayoutWrapper;
