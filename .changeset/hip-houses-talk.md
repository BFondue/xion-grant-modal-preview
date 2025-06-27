---
"abstraxion-dashboard": minor
---

Optimize login flow to skip account selection for users with 0 or 1 account

- Auto-navigate users with 0 or 1 account directly to permissions screen
- Auto-create account for users with no accounts (email/social auth only)
- Auto-select single account without showing selection screen
- Add loading state to mask background account operations
- Improve error handling for account creation failures

Users with 2+ accounts continue to see the account selection screen as before.
