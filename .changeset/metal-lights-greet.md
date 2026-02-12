---
"abstraxion-dashboard": patch
---

Fix duplicate submission error when creating new testnet account. Removed redundant account creation call from LoginScreen's handlePostAuthentication, which raced with LoginWalletSelector's account creation and caused a false "creation failed" error on signup.
