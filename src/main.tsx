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
