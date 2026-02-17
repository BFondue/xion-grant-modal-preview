"use client";

import { useState } from "react";
import { ModalState } from "@/lib/types";
import { MOCK_APP, MOCK_PERMISSIONS, MOCK_SECURITY_WARNING } from "@/lib/mock-data";
import { GrantModal } from "@/components/GrantModal";
import { StateTabs } from "@/components/StateTabs";

const sharedProps = {
  appName: MOCK_APP.name,
  appIconUrl: MOCK_APP.iconUrl,
  appDomain: MOCK_APP.domain,
  permissions: MOCK_PERMISSIONS,
  expiresIn: MOCK_APP.expiresIn,
  walletAddress: MOCK_APP.walletAddress,
  securityWarning: MOCK_SECURITY_WARNING,
};

export default function Home() {
  const [state, setState] = useState<ModalState>("approve");

  const isWarning = state === "security-warning";

  return (
    <main className="flex min-h-screen flex-col items-center bg-surface-page px-phi-md py-phi-xl sm:px-phi-lg sm:py-phi-3xl">
      <StateTabs current={state} onChange={setState} />

      {isWarning ? (
        <div className="flex w-full flex-col items-center gap-phi-xl lg:flex-row lg:items-start lg:justify-center">
          <div className="flex flex-col items-center gap-phi-sm">
            <span className="rounded-full bg-surface-border px-phi-lg py-phi-xs text-caption font-medium text-text-secondary">
              Closed
            </span>
            <GrantModal
              {...sharedProps}
              state={state}
              onAllow={() => setState("loading")}
              onDeny={() => setState("approve")}
            />
          </div>
          <div className="flex flex-col items-center gap-phi-sm">
            <span className="rounded-full bg-surface-border px-phi-lg py-phi-xs text-caption font-medium text-text-secondary">
              Opened
            </span>
            <GrantModal
              {...sharedProps}
              state={state}
              defaultPillOpen
              onAllow={() => setState("loading")}
              onDeny={() => setState("approve")}
            />
          </div>
        </div>
      ) : (
        <GrantModal
          {...sharedProps}
          state={state}
          onAllow={() => setState("loading")}
          onDeny={() => setState("approve")}
        />
      )}
    </main>
  );
}
