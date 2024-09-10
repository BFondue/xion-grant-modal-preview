"use client";

import { AbstraxionProvider } from "../components/Abstraxion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <AbstraxionProvider>{children}</AbstraxionProvider>
  );
}
