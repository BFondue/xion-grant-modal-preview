---
"abstraxion-dashboard": minor
---

Enable wallets as primary authenticators for account creation

**New Features:**

- MetaMask, Keplr, OKX, and Leap wallets can now create smart accounts directly (previously only available as backup authenticators)
- Auto-account creation flow for wallet-based connections with zero existing accounts
- Improved error messages for wallet connection failures

**Fixes:**

- Fixed session persistence for Keplr and EVM wallet connections (ENG-1334)
- Wallet sessions now properly restore on page reload

**Breaking Changes:**

- Migrated wallet account creation to V2 AA-API endpoints (`/api/v2/accounts/create/*`)
- Authenticator storage format changed: Cosmos wallets now store base64 pubkeys instead of addresses

**Internal Changes:**

- New wallet utility functions for signature handling and public key extraction
- Refactored wallet connection logic with better error handling
- Removed "Login Only" restriction from advanced authentication options
