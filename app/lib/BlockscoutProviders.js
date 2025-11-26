'use client';

import React from 'react';

/**
 * Mantle Explorer integration wrapper (Replaces Blockscout SDK)
 * Provides simplified explorer integration for Mantle Network
 * Uses Ant Design's message component for notifications
 */
export function MantleExplorerProviders({ children }) {
    // No providers needed - we'll use Ant Design's message API directly
    // and open explorer links in new tabs
    return <>{children}</>;
}

// Export as default and BlockscoutProviders for backward compatibility
export default MantleExplorerProviders;
export { MantleExplorerProviders as BlockscoutProviders };