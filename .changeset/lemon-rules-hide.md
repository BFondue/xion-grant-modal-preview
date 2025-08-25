---
"abstraxion-dashboard": patch
---

Fix dialog accessibility warnings and console errors

- Remove nested Dialog wrapper from AbstraxionSignin component to fix dialog-within-dialog issue
- Fix duplicate key warning in AbstraxionWallets by using unique keys
- Add React Router v7 future flags to prevent deprecation warnings
- Add util polyfill to Vite config to resolve Node.js module warnings
- Clean up unused Dialog-related imports
