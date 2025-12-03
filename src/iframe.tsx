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
import ReactDOM from "react-dom/client";
import { StandAloneWrapper } from './components/IframeApp/StandAloneWrapper';
import { KeplrExtensionProvider } from "@delphi-labs/shuttle";
import { IframeApp } from './components/IframeApp';
import { QueryClient } from "@tanstack/react-query";
import { loadShuttleNetworks } from "./config/shuttle";
import { AppProviders } from './components/AppProviders';
import './index.css';

(function captureOAuthTokens() {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const state = urlParams.get("state");

    if (token) {
      let isAddMode = false;
      let provider = null;

      // For Stytch SDK-initiated OAuth, rely on sessionStorage markers
      // since SDK may not preserve our custom state
      isAddMode = sessionStorage.getItem("oauth_add_mode") === "true";
      provider = sessionStorage.getItem("oauth_provider") || "twitter";

      if (state) {
        // Try to parse state if available
        const stateToProcess = state.includes(":")
          ? state.split(":")[1]
          : state;

        try {
          const stateData = JSON.parse(atob(stateToProcess));
          if (stateData.oauth_add_mode === true) {
            isAddMode = true;
            provider = stateData.provider || provider;
          }
        } catch (e) {
          console.log("State parsing failed, using sessionStorage:", e);
        }
      }

      if (isAddMode) {
        sessionStorage.setItem(
          "captured_oauth_add",
          JSON.stringify({
            oAuthToken: token,
            provider,
            state,
            timestamp: Date.now(),
          }),
        );
        // Clear URL to prevent Stytch SDK from processing it
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }
})();

const queryClient = new QueryClient();

// Load networks and render app
(async () => {
  const shuttleNetworks = await loadShuttleNetworks();
  const providers = [
    new KeplrExtensionProvider({
      networks: [shuttleNetworks.mainnet, shuttleNetworks.testnet],
    }),
  ];

  const urlParams = new URLSearchParams(window.location.search);
  const isIframe = window.self !== window.top;
  const isStandaloneApp = !isIframe || urlParams.get('dashboard') === 'true';

  console.log('[Main] Running in', isStandaloneApp ? 'STANDALONE' : 'IFRAME', 'mode');

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {isIframe ? (
        // Iframe mode - render the IframeApp directly
        <AppProviders queryClient={queryClient} extensionProviders={providers}>
          <IframeApp isStandalone={isStandaloneApp} />
        </AppProviders>
      ) : (
        // Standalone mode - just render the App with iframe wrapper
        <StandAloneWrapper />
      )}
    </React.StrictMode>
  );
})();
