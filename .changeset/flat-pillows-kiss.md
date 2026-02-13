---
"abstraxion-dashboard": minor
---

Test Coverage
Added/expanded 12 test files (+1,606 lines) covering ZK-Email authentication, signing, verification flow, adapters, and UI components
New test files: ZKEmailLogin.branch-edges.test.tsx, AddZKEmail.branch-edges.test.tsx, useZKEmailVerificationFlow.test.ts, useZKEmailSigningStatus.test.ts
Extended existing tests for AuthStateManager, zk-email-signer, zk-email-signing-status, ZKEmailAdapter, dialog-observers, and zk-email utils
Coverage thresholds raised to 99% in vitest.config.ts
Source Changes
dialog.tsx: Refactored height-check logic — simplified checkHeight/measureNaturalContentSize to accept element as parameter, removed previousWindowWidth tracking, added null guard to fix TS2345 errors
pinInput.tsx: Minor adjustments
useZKEmailVerificationFlow.ts: Small fixes (4 lines)
CI / Infra
dependency-validation.yml: Reworked workflow configuration
Removed format.yml workflow
Removed a line each from deploy-mainnet and deploy-testnet workflows
pnpm-lock.yaml: Regenerated to fix duplicate mapping keys (removed ~105 packages)
