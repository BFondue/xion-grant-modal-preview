import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StytchProvider } from '@stytch/react';
import { ShuttleProvider } from '@delphi-labs/shuttle-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { stytchClient } from '../../hooks/useStytchClient';
import { AbstraxionContextProvider } from '../AbstraxionContext';

interface AppProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  extensionProviders: any[]; // Using any[] to match ShuttleProvider's expected type
}

/**
 * Shared provider wrapper for both main app and iframe
 * Includes all necessary context providers in the correct order
 */
export function AppProviders({ 
  children, 
  queryClient: customQueryClient,
  extensionProviders
}: AppProvidersProps) {
  const queryClient = customQueryClient || new QueryClient();

  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {stytchClient ? (
            <StytchProvider stytch={stytchClient}>
              <AbstraxionContextProvider>
                <ShuttleProvider
                  extensionProviders={extensionProviders}
                  mobileProviders={[]}
                >
                  {children}
                </ShuttleProvider>
              </AbstraxionContextProvider>
            </StytchProvider>
          ) : (
            <div style={{ padding: '20px', color: 'red' }}>
              Error: Stytch client failed to initialize. Please check VITE_STYTCH_PUBLIC_TOKEN configuration.
            </div>
          )}
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
