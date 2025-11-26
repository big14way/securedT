import UiLayoutWrapper from './lib/UiLayoutWrapper';
import DynamicWrapper from './lib/DynamicWrapper';
import ErrorBoundary from './lib/ErrorBoundary';
import MantleExplorerProviders from './lib/BlockscoutProviders';

import './globals.css';
import { siteConfig } from './constants';

export default function RootLayout({ children }) {
    return (
        <html>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <title>
                    {siteConfig.title}
                </title>
                <meta
                    name="description"
                    content={siteConfig.description}
                />
            </head>
            <body>
                <ErrorBoundary>
                    <DynamicWrapper>
                        <MantleExplorerProviders>
                            <UiLayoutWrapper>{children}</UiLayoutWrapper>
                        </MantleExplorerProviders>
                    </DynamicWrapper>
                </ErrorBoundary>
            </body>
        </html>
    );
}
