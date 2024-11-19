import React from "react";
import ReactDOM from "react-dom/client";
import { StytchProvider } from "@stytch/react";
import { GrazProvider } from "graz";
import { stytchClient } from "./lib";
import { AbstraxionContextProvider } from "./components/AbstraxionContext";
import { App } from "./components/App";

import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AbstraxionContextProvider>
        <StytchProvider stytch={stytchClient}>
          <GrazProvider>
            <App />
          </GrazProvider>
        </StytchProvider>
      </AbstraxionContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
