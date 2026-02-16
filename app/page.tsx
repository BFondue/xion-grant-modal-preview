"use client";

import { useState } from "react";
import { ModalState } from "@/lib/types";
import { MOCK_APP, MOCK_PERMISSIONS } from "@/lib/mock-data";
import { GrantModal } from "@/components/GrantModal";
import { StateTabs } from "@/components/StateTabs";

export default function Home() {
  const [state, setState] = useState<ModalState>("approve");

  return (
    <main className="flex min-h-screen flex-col items-center bg-surface-page px-phi-md py-phi-xl sm:px-phi-lg sm:py-phi-3xl">
      <StateTabs current={state} onChange={setState} />
      <GrantModal
        appName={MOCK_APP.name}
        appIconUrl={MOCK_APP.iconUrl}
        appDomain={MOCK_APP.domain}
        permissions={MOCK_PERMISSIONS}
        expiresIn={MOCK_APP.expiresIn}
        walletAddress={MOCK_APP.walletAddress}
        state={state}
        onAllow={() => setState("loading")}
        onDeny={() => setState("approve")}
      />
    </main>
  );
}
