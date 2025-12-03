import { useStytch } from '@stytch/react';
import { StytchHeadlessClient } from '@stytch/vanilla-js/headless';

export const XION_STYTCH_API = import.meta.env.VITE_XION_STYTCH_API || 'http://localhost:8787';

// Create a singleton instance for StytchProvider initialization
let stytchClientInstance: StytchHeadlessClient | null = null;

export function getStytchClient(): StytchHeadlessClient | null {
  const STYTCH_PUBLIC_TOKEN = import.meta.env.VITE_STYTCH_PUBLIC_TOKEN;
  
  if (!STYTCH_PUBLIC_TOKEN) {
    console.error('Missing STYTCH_PUBLIC_TOKEN environment variable');
    return null;
  }

  if (!stytchClientInstance) {
    try {
      stytchClientInstance = new StytchHeadlessClient(STYTCH_PUBLIC_TOKEN, {
        cookieOptions: {
          jwtCookieName: 'stytch_session_jwt',
        },
        endpointOptions: {
          dfppaDomain: "stytchauth.burnt.com",
        },
        customBaseUrl: XION_STYTCH_API,
      });
    } catch (error) {
      console.error('Failed to initialize Stytch client:', error);
      return null;
    }
  }

  return stytchClientInstance;
}

// Export the singleton client for StytchProvider initialization
export const stytchClient = getStytchClient();

// Use the React SDK's hook for components
export function useStytchClient() {
  return useStytch();
}
