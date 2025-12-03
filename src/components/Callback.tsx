// Polyfills must be imported first
import { Buffer } from 'buffer';
import process from 'process';

// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.process = process;
// @ts-ignore
window.global = window;

import React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { getHumanReadablePubkey } from '../utils';
import { loadShuttleNetworks } from '../config/shuttle';
import type { Network } from '@delphi-labs/shuttle';

type CallbackType = 'oauth' | 'keplr' | 'okx' | 'metamask' | null;

export function Callback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing...');
  const [callbackType, setCallbackType] = useState<CallbackType>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const stytchTokenType = urlParams.get('stytch_token_type');
        const walletType = urlParams.get('wallet') as 'keplr' | 'okx' | 'metamask' | null;

        console.log('[Callback] Received params:', {
          token: token ? 'present' : 'missing',
          stytchTokenType,
          walletType,
        });

        // Handle OAuth callback
        if (token) {
          setCallbackType('oauth');
          handleOAuthCallback(token, stytchTokenType);
          return;
        }

        // Handle wallet connection
        if (walletType) {
          setCallbackType(walletType);
          await handleWalletConnection(walletType);
          return;
        }

        // No valid callback type
        setStatus('error');
        setMessage('Invalid callback - no token or wallet type specified');
      } catch (err) {
        console.error('[Callback] Error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleCallback();
  }, []);

  const handleOAuthCallback = (token: string, stytchTokenType: string | null) => {
    if (window.opener) {
      console.log('[Callback] Sending OAuth token to opener');
      window.opener.postMessage(
        {
          type: 'OAUTH_SUCCESS',
          token,
          stytchTokenType,
        },
        '*' // In production, specify the exact origin
      );

      setStatus('success');
      setMessage('Authentication successful! This window will close automatically.');

      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      console.error('[Callback] No opener window found');
      setStatus('error');
      setMessage('No opener window found. Please close this window and try again.');
    }
  };

  const handleWalletConnection = async (walletType: 'keplr' | 'okx' | 'metamask') => {
    setMessage(`Connecting to ${walletType.toUpperCase()} wallet...`);

    try {
      // Load chain info
      const networks = await loadShuttleNetworks();
      const chainId = import.meta.env.VITE_XION_CHAIN_ID || 'xion-testnet-2';
      const network = chainId.includes('mainnet') ? networks.mainnet : networks.testnet;

      let result: { type: string; data: any };

      switch (walletType) {
        case 'keplr':
          result = await connectKeplr(network);
          break;
        case 'okx':
          result = await connectOkx(network);
          break;
        case 'metamask':
          result = await connectMetamask();
          break;
        default:
          throw new Error(`Unknown wallet type: ${walletType}`);
      }

      if (window.opener) {
        console.log('[Callback] Sending wallet connection result to opener:', result);
        window.opener.postMessage(result, '*');

        setStatus('success');
        setMessage('Wallet connected! This window will close automatically.');

        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        setStatus('error');
        setMessage('No opener window found. Please close this window and try again.');
      }
    } catch (error) {
      console.error('[Callback] Wallet connection error:', error);
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'WALLET_ERROR',
          walletType,
          error: error instanceof Error ? error.message : 'Connection failed',
        }, '*');
      }

      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Wallet connection failed');

      setTimeout(() => {
        window.close();
      }, 3000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      margin: 0,
      background: 'hsl(0, 0%, 7%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        body {
          background: hsl(0, 0%, 7%) !important;
          margin: 0;
        }
      `}</style>
      
      <div style={{
        textAlign: 'center',
        padding: '2rem',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
        
        {status === 'success' && (
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem',
          }}>✓</div>
        )}
        
        {status === 'error' && (
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#ff6b6b',
          }}>✗</div>
        )}
        
        <p style={{ margin: 0, opacity: 0.9 }}>{message}</p>
        
        {callbackType && (
          <p style={{ 
            margin: '0.5rem 0 0', 
            fontSize: '0.875rem', 
            opacity: 0.6,
            textTransform: 'capitalize',
          }}>
            {callbackType === 'oauth' ? 'OAuth' : callbackType} Authentication
          </p>
        )}
      </div>
    </div>
  );
}

// Wallet connection functions
async function connectKeplr(network: Network): Promise<{ type: string; data: any }> {
  if (!window.keplr) {
    throw new Error('Keplr wallet extension not found. Please install it first.');
  }

  try {
    await window.keplr.experimentalSuggestChain(network as any);
  } catch (e) {
    console.log('[Callback] Chain already exists or suggest failed:', e);
  }

  await window.keplr.enable(network.chainId);
  const key = await window.keplr.getKey(network.chainId);
  const authenticator = getHumanReadablePubkey(key.pubKey);

  return {
    type: 'WALLET_SUCCESS',
    data: {
      walletType: 'keplr',
      authenticator,
      address: key.bech32Address,
      name: key.name,
    },
  };
}

async function connectOkx(network: Network): Promise<{ type: string; data: any }> {
  if (!window.okxwallet?.keplr) {
    throw new Error('OKX wallet extension not found. Please install it first.');
  }

  const keplr = window.okxwallet.keplr;

  try {
    await keplr.experimentalSuggestChain(network as any);
  } catch (e) {
    console.log('[Callback] Chain already exists or suggest failed:', e);
  }

  await keplr.enable(network.chainId);
  const okxAccount = await keplr.getKey(network.chainId);
  const authenticator = getHumanReadablePubkey(okxAccount.pubKey);

  return {
    type: 'WALLET_SUCCESS',
    data: {
      walletType: 'okx',
      authenticator,
      address: okxAccount.bech32Address,
      name: okxAccount.name,
    },
  };
}

async function connectMetamask(): Promise<{ type: string; data: any }> {
  if (!window.ethereum) {
    throw new Error('MetaMask wallet extension not found. Please install it first.');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  }) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found in MetaMask');
  }

  const primaryAccount = accounts[0];

  return {
    type: 'WALLET_SUCCESS',
    data: {
      walletType: 'metamask',
      authenticator: primaryAccount,
      address: primaryAccount,
    },
  };
}

// Initialize the app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Callback />
    </React.StrictMode>
  );
}
