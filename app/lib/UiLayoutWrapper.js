'use client';

import { usePathname } from 'next/navigation';
import { ACTIVE_CHAIN, APP_NAME } from '../constants';
import StyledComponentsRegistry from './AntdRegistry';
import { App, ConfigProvider, Layout } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import ModernNavigation from './ModernNavigation';
import { modernTheme } from '../theme/modernTheme';

function UiLayoutWrapper({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <StyledComponentsRegistry>
      <ConfigProvider theme={modernTheme}>
        <App>
          <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <ModernNavigation />

            <Content style={{
              background: isHomePage ? 'transparent' : '#F8FAFC',
              padding: isHomePage ? 0 : '24px',
            }}>
              {children}
            </Content>

            <Footer style={{
              textAlign: 'center',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              padding: '24px 50px',
            }}>
              <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}>
                  <div>
                    <strong>{APP_NAME}</strong> · Built on {ACTIVE_CHAIN.name}
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <a href="/about" style={{ color: '#64748B' }}>About</a>
                    <a href="/tutorials" style={{ color: '#64748B' }}>Tutorials</a>
                    <a href="https://github.com/big14way/securedT" target="_blank" rel="noopener noreferrer" style={{ color: '#64748B' }}>
                      GitHub
                    </a>
                  </div>
                </div>
                <div style={{ marginTop: '16px', color: '#94A3B8', fontSize: '14px' }}>
                  © 2025 SecuredTransfer. All rights reserved.
                </div>
              </div>
            </Footer>
          </Layout>
        </App>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}

export default UiLayoutWrapper;
