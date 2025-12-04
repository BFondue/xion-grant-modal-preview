import { useStytch } from '@stytch/react';
import { StytchHeadlessClient } from '@stytch/vanilla-js/headless';
import { STYTCH_PROXY_URL, STYTCH_PUBLIC_TOKEN } from '../config';

// Create a singleton instance for StytchProvider initialization
let stytchClientInstance: StytchHeadlessClient | null = null;

export function getStytchClient(): StytchHeadlessClient | null {
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
        customBaseUrl: STYTCH_PROXY_URL,
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
