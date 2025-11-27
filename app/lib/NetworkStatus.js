'use client';

import { App, Alert, Button, Spin } from 'antd';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useNetworkSwitcher } from '../hooks/useNetworkSwitcher';
import { useState, useEffect } from 'react';

const NetworkStatus = ({ showSwitcher = true, style = {} }) => {
  const { message } = App.useApp();
  const { primaryWallet } = useDynamicContext();
  const { 
    isCorrectNetwork, 
    isChecking, 
    switchToRequiredNetwork, 
    requiredNetwork 
  } = useNetworkSwitcher();
  
  // Add local state to prevent flashing
  const [isVisible, setIsVisible] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Only show component after initial check is complete
  useEffect(() => {
    if (primaryWallet) {
      // Small delay to let network check complete
      const timer = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [primaryWallet]);

  // Don't show anything if no wallet is connected or not yet visible
  if (!primaryWallet || !isVisible) {
    return null;
  }

  const handleSwitchNetwork = async () => {
    try {
      setLastError(null);
      await switchToRequiredNetwork();
      message.success(`Successfully switched to ${requiredNetwork.name}`);
    } catch (error) {
      console.error('Network switch failed:', error);
      const errorMsg = error.message || `Unable to switch networks automatically. Please manually switch your wallet to ${requiredNetwork.name} (Chain ID: ${requiredNetwork.id})`;
      setLastError(errorMsg);
      message.error(errorMsg);
    }
  };

  if (isCorrectNetwork) {
    return null
    return (
      <div style={style}>
        <Alert 
          message={`Connected to ${requiredNetwork.name}`}
          type="success" 
          showIcon 
          size="small"
        />
      </div>
    );
  }

  return (
    <div style={style}>
      <Alert 
        message={`Please switch to ${requiredNetwork.name} (Chain ID: ${requiredNetwork.id})`}
        description={
          lastError ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                {showSwitcher ? "Automatic network switching failed. Please manually switch in your wallet." : "Please manually switch your wallet network."}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Error: {lastError}
              </div>
            </div>
          ) : (
            showSwitcher ? "Click the button below to switch networks, or manually switch in your wallet." : "Please manually switch your wallet network."
          )
        }
        type={lastError ? "error" : "warning"}
        showIcon
        action={showSwitcher && (
          <Button 
            size="small" 
            type="primary" 
            onClick={handleSwitchNetwork}
            loading={isChecking}
          >
            {isChecking ? 'Switching...' : 'Switch Network'}
          </Button>
        )}
      />
    </div>
  );
};

export default NetworkStatus;
