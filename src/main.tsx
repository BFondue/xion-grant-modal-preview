import React from "react";
import ReactDOM from "react-dom/client";
import { StytchProvider } from "@stytch/react";
import { GrazProvider } from "graz";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { stytchClient } from "./lib";
import { AbstraxionContextProvider } from "./components/AbstraxionContext";
import { App } from "./components/App";

import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Provider order matters: QueryClient → Stytch → Abstraxion → Graz
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <StytchProvider stytch={stytchClient}>
          <AbstraxionContextProvider>
            <GrazProvider>
              <App />
            </GrazProvider>
          </AbstraxionContextProvider>
        </StytchProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
