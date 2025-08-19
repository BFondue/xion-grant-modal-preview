import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StytchProvider } from "@stytch/react";
import { KeplrExtensionProvider } from "@delphi-labs/shuttle";
import { ShuttleProvider } from "@delphi-labs/shuttle-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { stytchClient } from "./lib";
import { AbstraxionContextProvider } from "./components/AbstraxionContext";
import { App } from "./components/App";
import { SHUTTLE_NETWORKS } from "./config/shuttle";

import "./index.css";

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

// TODO: pull from asset repo before provider.
const providers = [
  new KeplrExtensionProvider({
    networks: [SHUTTLE_NETWORKS.mainnet, SHUTTLE_NETWORKS.testnet],
  }),
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <StytchProvider stytch={stytchClient}>
          <AbstraxionContextProvider>
            <ShuttleProvider
              extensionProviders={providers}
              mobileProviders={[]}
            >
              <App />
            </ShuttleProvider>
          </AbstraxionContextProvider>
        </StytchProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
