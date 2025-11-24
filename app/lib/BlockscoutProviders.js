'use client';

import React from 'react';

/**
 * Mantle Explorer integration wrapper (Replaces Blockscout SDK)
 * Provides simplified explorer integration for Mantle Network
 * Uses Ant Design's message component for notifications
 */
export default function MantleExplorerProviders({ children }) {
    // No providers needed - we'll use Ant Design's message API directly
    // and open explorer links in new tabs
    return <>{children}</>;
}

// Export as BlockscoutProviders for backward compatibility
export { MantleExplorerProviders as BlockscoutProviders };