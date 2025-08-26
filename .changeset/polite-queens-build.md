---
"abstraxion-dashboard": minor
---

Fix duplicate account selection and prevent duplicate authenticators

- Prevent adding duplicate email/OAuth authenticators to accounts
- Deduplicate accounts in wallet selection view to show each account only once
- Add duplicate validation for all authenticator types (Keplr, MetaMask, OKX, Passkey)
- Improve error UX with dedicated screen when duplicate email detected
- Handle existing duplicate authenticators gracefully by selecting lowest index
- Extract authenticator logic into testable utility functions with full test coverage
