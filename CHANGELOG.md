# abstraxion-dashboard

## 0.16.0-rc.1

### Minor Changes

- [#312](https://github.com/burnt-labs/xion-dashboard-app/pull/312) [`24c6a21`](https://github.com/burnt-labs/xion-dashboard-app/commit/24c6a215aa9a4ff8c93cbcf06faacdbeaa7c64cd) Thanks [@2xburnt](https://github.com/2xburnt)! - Test Coverage
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

## 0.16.0-rc.0

### Minor Changes

- [#285](https://github.com/burnt-labs/xion-dashboard-app/pull/285) [`1dc3ac7`](https://github.com/burnt-labs/xion-dashboard-app/commit/1dc3ac72f3f7653c4d54c6e55212cdcb1bcd96ba) Thanks [@2xburnt](https://github.com/2xburnt)! - Add iframe option

- [#287](https://github.com/burnt-labs/xion-dashboard-app/pull/287) [`70b7fe5`](https://github.com/burnt-labs/xion-dashboard-app/commit/70b7fe5afe284cc8d78d013db448af469d2b4963) Thanks [@BurntVal](https://github.com/BurntVal)! - add mint and burn token grant query support

- [#289](https://github.com/burnt-labs/xion-dashboard-app/pull/289) [`8249ea4`](https://github.com/burnt-labs/xion-dashboard-app/commit/8249ea4f4e9800dd8232388a96025ad19c6c1b8d) Thanks [@btspoony](https://github.com/btspoony)! - Implement OAuth2 redirect URI validation in AbstraxionGrant component and "OAuth2 App" tag
  - Added OAuth2 redirect URI validation in AbstraxionGrant component
  - Implemented "OAuth2 App" tag display for OAuth2 applications
  - Updated treasury types to support OAuth2 app identification
  - Enhanced grant component UI to show OAuth2 app status

- [#278](https://github.com/burnt-labs/xion-dashboard-app/pull/278) [`38fc492`](https://github.com/burnt-labs/xion-dashboard-app/commit/38fc49233a9b33972a772c647da3160f0c65f082) Thanks [@ertemann](https://github.com/ertemann)! - Enable wallets as primary authenticators for account creation

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

### Patch Changes

- [#291](https://github.com/burnt-labs/xion-dashboard-app/pull/291) [`02e39a8`](https://github.com/burnt-labs/xion-dashboard-app/commit/02e39a88eb885eb01ad4bbc053fd4b45390f6bab) Thanks [@ertemann](https://github.com/ertemann)! - feat: replace utils with @burnt-labs/signers and rename components

- [#301](https://github.com/burnt-labs/xion-dashboard-app/pull/301) [`24a9228`](https://github.com/burnt-labs/xion-dashboard-app/commit/24a9228fbf816f309a9668d095086c461f687b2b) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix duplicate submission error when creating new testnet account. Removed redundant account creation call from LoginScreen's handlePostAuthentication, which raced with LoginWalletSelector's account creation and caused a false "creation failed" error on signup.

- [#299](https://github.com/burnt-labs/xion-dashboard-app/pull/299) [`894adfc`](https://github.com/burnt-labs/xion-dashboard-app/commit/894adfc1e6afb03ac08887b89b2881d6fa483cf9) Thanks [@ertemann](https://github.com/ertemann)! - refactor: Move Off shuttle

## 0.15.0

### Minor Changes

- [#269](https://github.com/burnt-labs/xion-dashboard-app/pull/269) [`3f120ee`](https://github.com/burnt-labs/xion-dashboard-app/commit/3f120ee885e388c5e40a2fe98d8964cbe34db4de) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Removed the disabled "Disconnect" button when in the loading state of Creating An Account.
  Fixed the weird showing of "No accounts" when loading accounts. Created a new component for the Account Dialog on the dashboard because of the complexity of the Accounts component used in the login.
  Replaced the "Disconnect" button here with a primary button that says "Back to Login"

## 0.14.0

### Minor Changes

- [#237](https://github.com/burnt-labs/xion-dashboard-app/pull/237) [`87b4f4f`](https://github.com/burnt-labs/xion-dashboard-app/commit/87b4f4f6dd914f3bd51d673e1f71da8c91680e38) Thanks [@justinbarry](https://github.com/justinbarry)! - Fixed URL spoofing vulnerability by detecting and rejecting URLs with @ character that could be used for phishing attacks

### Patch Changes

- [#273](https://github.com/burnt-labs/xion-dashboard-app/pull/273) [`fd9c0fa`](https://github.com/burnt-labs/xion-dashboard-app/commit/fd9c0fa0c063669ec659ee281f238af7a2ba33fb) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Fixes ENG-1273 (Dialog shifting issue)
  Addresses mobile responsiveness concerns
  Improves overall dialog UX

- [#248](https://github.com/burnt-labs/xion-dashboard-app/pull/248) [`b0a60f6`](https://github.com/burnt-labs/xion-dashboard-app/commit/b0a60f618dcb8369a0beec126f3dfc0c00ec977c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps): bump pbkdf2 from 3.1.2 to 3.1.3

## 0.13.0

### Minor Changes

- [#276](https://github.com/burnt-labs/xion-dashboard-app/pull/276) [`9d1944d`](https://github.com/burnt-labs/xion-dashboard-app/commit/9d1944d494db944fe714b06168473935e770e2f8) Thanks [@btspoony](https://github.com/btspoony)! - feat(auth): add state field support for authentication

- [#271](https://github.com/burnt-labs/xion-dashboard-app/pull/271) [`ee7bd05`](https://github.com/burnt-labs/xion-dashboard-app/commit/ee7bd052125dc1f4ee8b59ce3f1362f83032a470) Thanks [@burnt-sun](https://github.com/burnt-sun)! - feat(auth): enhance Apple auth error messaging and authenticator removal labeling

## 0.12.0

### Minor Changes

- [#260](https://github.com/burnt-labs/xion-dashboard-app/pull/260) [`22abce1`](https://github.com/burnt-labs/xion-dashboard-app/commit/22abce1638dc435c63ab59310619875b1007a3a5) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix duplicate account selection and prevent duplicate authenticators
  - Prevent adding duplicate email/OAuth authenticators to accounts
  - Deduplicate accounts in wallet selection view to show each account only once
  - Add duplicate validation for all authenticator types (Keplr, MetaMask, OKX, Passkey)
  - Improve error UX with dedicated screen when duplicate email detected
  - Handle existing duplicate authenticators gracefully by selecting lowest index
  - Extract authenticator logic into testable utility functions with full test coverage

- [#255](https://github.com/burnt-labs/xion-dashboard-app/pull/255) [`c798215`](https://github.com/burnt-labs/xion-dashboard-app/commit/c798215f3d6aac3fb963e899132153a10a52e72c) Thanks [@burnt-sun](https://github.com/burnt-sun)! - Add oAuth support. Apple login.

### Patch Changes

- [#270](https://github.com/burnt-labs/xion-dashboard-app/pull/270) [`c2763ad`](https://github.com/burnt-labs/xion-dashboard-app/commit/c2763ad318600de2e625808eb7cf786a4422cd50) Thanks [@justinbarry](https://github.com/justinbarry)! - Enable mainnet "Sign in with Apple" deploy

- [#267](https://github.com/burnt-labs/xion-dashboard-app/pull/267) [`c860953`](https://github.com/burnt-labs/xion-dashboard-app/commit/c860953a3956136f96c8824ff5d8e87e283137e9) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - url will no longer be unsafe just by not having a trailing '/'

- [#259](https://github.com/burnt-labs/xion-dashboard-app/pull/259) [`f1aa949`](https://github.com/burnt-labs/xion-dashboard-app/commit/f1aa94956849f37bdfc5417684d00c211c25695d) Thanks [@burnt-sun](https://github.com/burnt-sun)! - Fix env variable toggling apple login

- [#261](https://github.com/burnt-labs/xion-dashboard-app/pull/261) [`4d91b0c`](https://github.com/burnt-labs/xion-dashboard-app/commit/4d91b0c39b78bee98787f96781e901d40595d611) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix dialog accessibility warnings and console errors
  - Remove nested Dialog wrapper from AbstraxionSignin component to fix dialog-within-dialog issue
  - Fix duplicate key warning in AbstraxionWallets by using unique keys
  - Add React Router v7 future flags to prevent deprecation warnings
  - Add util polyfill to Vite config to resolve Node.js module warnings
  - Clean up unused Dialog-related imports

- [#266](https://github.com/burnt-labs/xion-dashboard-app/pull/266) [`556fada`](https://github.com/burnt-labs/xion-dashboard-app/commit/556fadae4d3bf7e915d17e5e7800717e5398b6c5) Thanks [@ertemann](https://github.com/ertemann)! - add warning when sending usdc - exchanges might not support xion usdc

- [#262](https://github.com/burnt-labs/xion-dashboard-app/pull/262) [`c0da68d`](https://github.com/burnt-labs/xion-dashboard-app/commit/c0da68dc8f27f17111579b4490618bcda98e9cff) Thanks [@burnt-sun](https://github.com/burnt-sun)! - Fix display of Apple IDs using "Hide my email"

- [#263](https://github.com/burnt-labs/xion-dashboard-app/pull/263) [`472e5ee`](https://github.com/burnt-labs/xion-dashboard-app/commit/472e5ee4fe10c95875790a099023b0f53451c8b1) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - - Treasury Strategy Pattern: Implemented configurable strategy pattern for loading
  treasury configurations with three strategies:
  - DaoDao Strategy: Fetches from DaoDao indexer API with 10-minute TTL caching
  - Direct Query Strategy: Legacy approach querying blockchain directly
  - Composite Strategy (default): DaoDao with automatic fallback to Direct Query
  - Performance Improvements: Treasury config loading now ~48% faster (615ms vs
    1196ms) through:
    - Optimized single API call to /all endpoint (previously 2 separate calls)
    - In-memory caching with 10-minute TTL reducing redundant API calls
    - 30-second timeout protection preventing hanging requests
  - Configuration: New VITE_TREASURY_STRATEGY environment variable to control strategy
    selection
  - Comprehensive Testing: Added 22 tests covering all strategies and edge cases

- [#264](https://github.com/burnt-labs/xion-dashboard-app/pull/264) [`5a6c55f`](https://github.com/burnt-labs/xion-dashboard-app/commit/5a6c55f91c7e70529839f065e6cc7c483c42df54) Thanks [@burnt-sun](https://github.com/burnt-sun)! - refactor to use stytch type in authenticator list

## 0.11.0

### Minor Changes

- [#254](https://github.com/burnt-labs/xion-dashboard-app/pull/254) [`26e2763`](https://github.com/burnt-labs/xion-dashboard-app/commit/26e2763e35433965fd7e37228ee214f06251a30c) Thanks [@justinbarry](https://github.com/justinbarry)! - Restore the ability to grant MsgSend to unblock Blazeswap

  This change temporarily comments out the code that was preventing the use of generic MsgSend authorization in the treasury contract query function. Previously, the code was throwing an error when encountering "/cosmos.bank.v1beta1.MsgSend" message types, which was blocking Blazeswap functionality. This is a temporary solution.

### Patch Changes

- [#251](https://github.com/burnt-labs/xion-dashboard-app/pull/251) [`662c158`](https://github.com/burnt-labs/xion-dashboard-app/commit/662c158883e77ca227a628a3535dba4c23cb170d) Thanks [@BurntVal](https://github.com/BurntVal)! - refactor error message to appropriately reflect query issue

- [#253](https://github.com/burnt-labs/xion-dashboard-app/pull/253) [`5eb821e`](https://github.com/burnt-labs/xion-dashboard-app/commit/5eb821e8da94c0dcc59bd6b5212f87306f07de82) Thanks [@BurntVal](https://github.com/BurntVal)! - feat: enhance AbstraxionGrant error handling and UI improvements

## 0.10.0

### Minor Changes

- [#249](https://github.com/burnt-labs/xion-dashboard-app/pull/249) [`a40a87e`](https://github.com/burnt-labs/xion-dashboard-app/commit/a40a87e49d6d330baa3f4261634992310fc4092d) Thanks [@justinbarry](https://github.com/justinbarry)! - Add Xion address display to grant permissions page
  - Display user's Xion address on the permissions grant page so users know which address is granting permissions
  - Address is responsive: shows full address on desktop, truncated on mobile

- [#247](https://github.com/burnt-labs/xion-dashboard-app/pull/247) [`f6014d1`](https://github.com/burnt-labs/xion-dashboard-app/commit/f6014d1f7e10488a816f0f79ade632fbed01eb9b) Thanks [@justinbarry](https://github.com/justinbarry)! - Optimize login flow to skip account selection for users with 0 or 1 account
  - Auto-navigate users with 0 or 1 account directly to permissions screen
  - Auto-create account for users with no accounts (email/social auth only)
  - Auto-select single account without showing selection screen
  - Add loading state to mask background account operations
  - Improve error handling for account creation failures

  Users with 2+ accounts continue to see the account selection screen as before.

- [#239](https://github.com/burnt-labs/xion-dashboard-app/pull/239) [`7219161`](https://github.com/burnt-labs/xion-dashboard-app/commit/7219161e95b2dd8be874cba5e50a5905cbf72318) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - session time updated

- [#245](https://github.com/burnt-labs/xion-dashboard-app/pull/245) [`0d4b78d`](https://github.com/burnt-labs/xion-dashboard-app/commit/0d4b78dd58c9646f04ee9f883252b89798e64b8a) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Checks IBCs in permissions and displays their name

- [#246](https://github.com/burnt-labs/xion-dashboard-app/pull/246) [`f135cfd`](https://github.com/burnt-labs/xion-dashboard-app/commit/f135cfd8a83339042476c03c43ef4685750b685e) Thanks [@BurntVal](https://github.com/BurntVal)! - add ibc transfer authorization logic and views

- [#238](https://github.com/burnt-labs/xion-dashboard-app/pull/238) [`07c9eab`](https://github.com/burnt-labs/xion-dashboard-app/commit/07c9eab2027fe924a9469a322e510b26ac779dc5) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - upgraded DialogContent component to be much more responsive

- [#241](https://github.com/burnt-labs/xion-dashboard-app/pull/241) [`2d61aca`](https://github.com/burnt-labs/xion-dashboard-app/commit/2d61aca7f0367b3420ebae20dd5a8af263c530cd) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Fixed display after adding passkey

### Patch Changes

- [#226](https://github.com/burnt-labs/xion-dashboard-app/pull/226) [`5683f4b`](https://github.com/burnt-labs/xion-dashboard-app/commit/5683f4b9446b1a29266ff4c6dfc6dfce1e921659) Thanks [@BurntVal](https://github.com/BurntVal)! - Implement core grant utility decode function

- [#250](https://github.com/burnt-labs/xion-dashboard-app/pull/250) [`a05aea2`](https://github.com/burnt-labs/xion-dashboard-app/commit/a05aea20397850b6a9f4a057e4980ebc3687bb54) Thanks [@justinbarry](https://github.com/justinbarry)! - Dashboard showing the migrate button when no migrate is needed. Numia Api is returning strings instead of numbers.

## 0.9.0

### Minor Changes

- [#232](https://github.com/burnt-labs/xion-dashboard-app/pull/232) [`1a03d3a`](https://github.com/burnt-labs/xion-dashboard-app/commit/1a03d3ab7bac30c347a1df9ce7624be5ece1258f) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - added the footer to all login modal screens

- [#236](https://github.com/burnt-labs/xion-dashboard-app/pull/236) [`45f6441`](https://github.com/burnt-labs/xion-dashboard-app/commit/45f64416da907b51b6b01535a38e0af77c9d9cd0) Thanks [@justinbarry](https://github.com/justinbarry)! - The removed checks for `account?.id`, `client`, `redirect_uri`, and `chainInfo` were unnecessary as their presence is guaranteed elsewhere in the code or application flow. This improves code readability and eliminates redundant error handling.

- [#243](https://github.com/burnt-labs/xion-dashboard-app/pull/243) [`992bdf9`](https://github.com/burnt-labs/xion-dashboard-app/commit/992bdf916bb4c3d545692b0b4e715235375fcf0a) Thanks [@justinbarry](https://github.com/justinbarry)! - Switch to using the v3 version of the Numia indexer endpoint

- [#235](https://github.com/burnt-labs/xion-dashboard-app/pull/235) [`b790014`](https://github.com/burnt-labs/xion-dashboard-app/commit/b790014d7a46d1fd50d53fe537d0814008a28604) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Added tooltip to addresses on the Send Review and Success Dialogs

### Patch Changes

- [#221](https://github.com/burnt-labs/xion-dashboard-app/pull/221) [`f97722c`](https://github.com/burnt-labs/xion-dashboard-app/commit/f97722ccf863cb88d0c20f7ce73f566ac536c68d) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Fixed tokens table number formatting

- [#242](https://github.com/burnt-labs/xion-dashboard-app/pull/242) [`ae5e598`](https://github.com/burnt-labs/xion-dashboard-app/commit/ae5e598883e8ddcfa5137f456e1c755de5f2d788) Thanks [@justinbarry](https://github.com/justinbarry)! - Add testnet-2 code_id 1 to the account features feature flags and code_id 95.

- [#233](https://github.com/burnt-labs/xion-dashboard-app/pull/233) [`5aa4f98`](https://github.com/burnt-labs/xion-dashboard-app/commit/5aa4f98b493b867f7934206e12c048bbfe2843c3) Thanks [@justinbarry](https://github.com/justinbarry)! - Avoid formatting generated CF worker file

## 0.8.0

### Minor Changes

- [#230](https://github.com/burnt-labs/xion-dashboard-app/pull/230) [`ec90baa`](https://github.com/burnt-labs/xion-dashboard-app/commit/ec90baa5bd3f765653ea12ba735d67af0854f25c) Thanks [@justinbarry](https://github.com/justinbarry)! - Modified the URL validation to support native app URIs

  The `isUrlSafe` function has been updated to allow custom protocol schemes like `myapp://` or `xion://` that are commonly used in mobile and desktop applications. This enables deep linking to native applications from the web interface.

  Instead of strictly allowing only HTTP and HTTPS protocols, the function now blocks a specific list of known dangerous protocols (javascript:, data:, vbscript:, file:) while allowing all other protocols to pass through.

  Tests have been updated to verify that native app URIs are properly validated as safe, while maintaining security against potentially malicious URLs.

## 0.7.0

### Minor Changes

- [#227](https://github.com/burnt-labs/xion-dashboard-app/pull/227) [`49784dd`](https://github.com/burnt-labs/xion-dashboard-app/commit/49784dd9d18f0794736e9e57978815c08181c0d3) Thanks [@justinbarry](https://github.com/justinbarry)! - Sanitize and validate URLs to enhance security.

## 0.6.0

### Minor Changes

- [#204](https://github.com/burnt-labs/xion-dashboard-app/pull/204) [`9184b17`](https://github.com/burnt-labs/xion-dashboard-app/commit/9184b17943002da5a96bb24473087222519f766a) Thanks [@2xburnt](https://github.com/2xburnt)! - Convert to worker

## 0.5.0

### Minor Changes

- [#217](https://github.com/burnt-labs/xion-dashboard-app/pull/217) [`b3f5aa8`](https://github.com/burnt-labs/xion-dashboard-app/commit/b3f5aa8d81bd275f9118b065b85c87c95929c8b7) Thanks [@justinbarry](https://github.com/justinbarry)! - Prevent environment-specific builds from running with a `.env` file present. Vite will fall back to the .env file for undefined env vars causing unexpected behavior.

- [#223](https://github.com/burnt-labs/xion-dashboard-app/pull/223) [`f8b893e`](https://github.com/burnt-labs/xion-dashboard-app/commit/f8b893e5c2e0246e55e37b20f5662b78def956af) Thanks [@justinbarry](https://github.com/justinbarry)! - Only compare redirect_url on domain

- [#223](https://github.com/burnt-labs/xion-dashboard-app/pull/223) [`f8b893e`](https://github.com/burnt-labs/xion-dashboard-app/commit/f8b893e5c2e0246e55e37b20f5662b78def956af) Thanks [@justinbarry](https://github.com/justinbarry)! - Update the warning sign on app permissions screen

## 0.4.0

### Minor Changes

- [#215](https://github.com/burnt-labs/xion-dashboard-app/pull/215) [`bda807a`](https://github.com/burnt-labs/xion-dashboard-app/commit/bda807ae9b36aa80000403fcf0aceb5007e7e00e) Thanks [@justinbarry](https://github.com/justinbarry)! - Remove the "Please make sure the url is correct before accepting."

## 0.3.0

### Minor Changes

- [#182](https://github.com/burnt-labs/xion-dashboard-app/pull/182) [`5016ecf`](https://github.com/burnt-labs/xion-dashboard-app/commit/5016ecf68307cbbc319fa5ca8d5797dbba0130b0) Thanks [@BurntVal](https://github.com/BurntVal)! - Introduce algorithms in passkey pubkey credential config

- [#180](https://github.com/burnt-labs/xion-dashboard-app/pull/180) [`7dd7ab6`](https://github.com/burnt-labs/xion-dashboard-app/commit/7dd7ab66b3014d7198bf0da07a17178c31b7949a) Thanks [@OjiCode](https://github.com/OjiCode)! - Added configurable banner component.

- [#208](https://github.com/burnt-labs/xion-dashboard-app/pull/208) [`1bed980`](https://github.com/burnt-labs/xion-dashboard-app/commit/1bed9808d39fe9336301af1319d15e1f69c5f95d) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Updated token rows with a table to ensure column uniformity

- [#207](https://github.com/burnt-labs/xion-dashboard-app/pull/207) [`301cf9e`](https://github.com/burnt-labs/xion-dashboard-app/commit/301cf9e133491c817d8c12cd41f2ca93a7fb0bcb) Thanks [@justinbarry](https://github.com/justinbarry)! - Reduce redirect delay in AbstraxionGrant component

- [#198](https://github.com/burnt-labs/xion-dashboard-app/pull/198) [`a3ee16b`](https://github.com/burnt-labs/xion-dashboard-app/commit/a3ee16b176fbdb9edbb1e0250db218523222d582) Thanks [@justinbarry](https://github.com/justinbarry)! - Remove unused methods

- [#194](https://github.com/burnt-labs/xion-dashboard-app/pull/194) [`d1ad141`](https://github.com/burnt-labs/xion-dashboard-app/commit/d1ad1417eba5c093efe214165625ec92de0b45bf) Thanks [@OjiCode](https://github.com/OjiCode)! - Updated migration flow.

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Added new navigationa and layout structure

- [#147](https://github.com/burnt-labs/xion-dashboard-app/pull/147) [`e8b613f`](https://github.com/burnt-labs/xion-dashboard-app/commit/e8b613f4a8b7e6a59b96647dea45877a54e95443) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Light UI and UX changes

- [#210](https://github.com/burnt-labs/xion-dashboard-app/pull/210) [`95d6551`](https://github.com/burnt-labs/xion-dashboard-app/commit/95d6551143e566d90165f8bbe752dfb94163b1e2) Thanks [@burnt-sun](https://github.com/burnt-sun)! - Replace Graz with Shuttle

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Added new buttons

- [#212](https://github.com/burnt-labs/xion-dashboard-app/pull/212) [`c52b0bc`](https://github.com/burnt-labs/xion-dashboard-app/commit/c52b0bc978dcfde34d84a7c22458119923a25035) Thanks [@burnt-sun](https://github.com/burnt-sun)! - Update React Query to v5

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Updated Login UI

- [#214](https://github.com/burnt-labs/xion-dashboard-app/pull/214) [`7cdb227`](https://github.com/burnt-labs/xion-dashboard-app/commit/7cdb2277bbd868f96f6130b9aac86fde3fda9ed9) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix Changeset Action

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Added a new animated loading spinner

- [#173](https://github.com/burnt-labs/xion-dashboard-app/pull/173) [`4afc4ee`](https://github.com/burnt-labs/xion-dashboard-app/commit/4afc4ee279720dac7d3d8d7273f6f24981eb6d6b) Thanks [@justinbarry](https://github.com/justinbarry)! - Use chain-id to select network and load config at startup

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Added new components and streamlined permissions list

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Updated granting flow

- [#197](https://github.com/burnt-labs/xion-dashboard-app/pull/197) [`5cb5078`](https://github.com/burnt-labs/xion-dashboard-app/commit/5cb50781ed42903112165a85aee7a0cf61d51b40) Thanks [@justinbarry](https://github.com/justinbarry)! - Show error dialog when send tx fails

- [#206](https://github.com/burnt-labs/xion-dashboard-app/pull/206) [`4244bc1`](https://github.com/burnt-labs/xion-dashboard-app/commit/4244bc1ab1f2b592eea915cd9cd4c96d636d160e) Thanks [@justinbarry](https://github.com/justinbarry)! - Hide warning when empty screen

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Update Send flow

- [#201](https://github.com/burnt-labs/xion-dashboard-app/pull/201) [`605799e`](https://github.com/burnt-labs/xion-dashboard-app/commit/605799e092eed23384597e877fd19a432eff9d6b) Thanks [@justinbarry](https://github.com/justinbarry)! - Redirect to redirect_uri, not treasury url

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Added new Wallet Action Button

- [#141](https://github.com/burnt-labs/xion-dashboard-app/pull/141) [`43703d4`](https://github.com/burnt-labs/xion-dashboard-app/commit/43703d49848943f64b27116f3fe7cd8224e9e70e) Thanks [@burnt-sun](https://github.com/burnt-sun)! - add permissions for msgsubmitproposal

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - updated the current Dialog component to align with the new Figma designs and added a dialog.md file with examples of the components in use. Also updated the Input component and added some other icons.

- [#196](https://github.com/burnt-labs/xion-dashboard-app/pull/196) [`6fbc2ba`](https://github.com/burnt-labs/xion-dashboard-app/commit/6fbc2baae097ee8017f1311e48ef6ed2a035ec68) Thanks [@justinbarry](https://github.com/justinbarry)! - Replaces polling for new accounts with the data returned by the create AA api endpoint.

- [#202](https://github.com/burnt-labs/xion-dashboard-app/pull/202) [`d390ed7`](https://github.com/burnt-labs/xion-dashboard-app/commit/d390ed734055e6561b1831f355b0d7afa27c796f) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix isMainnet usage in USDC_DENOM assignment

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Refreshed login modals

- [#200](https://github.com/burnt-labs/xion-dashboard-app/pull/200) [`19e6e5e`](https://github.com/burnt-labs/xion-dashboard-app/commit/19e6e5e68ac6bf9c5f4d13442d7e9575284a73e1) Thanks [@justinbarry](https://github.com/justinbarry)! - Replace `VITE_DEPLOYMENT_ENV` with `isMainnet`

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - updated the disclaimer footer

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Updated Settings Dashboard with new UI

### Patch Changes

- [#149](https://github.com/burnt-labs/xion-dashboard-app/pull/149) [`8b5118d`](https://github.com/burnt-labs/xion-dashboard-app/commit/8b5118d63bc0526a27e4c0293b71d22c2e0dcabd) Thanks [@burnt-sun](https://github.com/burnt-sun)! - fix usdc fallback

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Fix Abstraxion error state resetting logic

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Added new token display rows

- [#193](https://github.com/burnt-labs/xion-dashboard-app/pull/193) [`83d8be5`](https://github.com/burnt-labs/xion-dashboard-app/commit/83d8be5f006152687cf1176099256aeab910dbb0) Thanks [@justinbarry](https://github.com/justinbarry)! - Remove VITE_DEFAULT_CHAIN_INFO from environment files

- [#205](https://github.com/burnt-labs/xion-dashboard-app/pull/205) [`cf5aaa2`](https://github.com/burnt-labs/xion-dashboard-app/commit/cf5aaa2266ae57c9f0eea94adf2133e16e7494b2) Thanks [@BurntVal](https://github.com/BurntVal)! - Add instantiate2 description message

- [#195](https://github.com/burnt-labs/xion-dashboard-app/pull/195) [`4d9a877`](https://github.com/burnt-labs/xion-dashboard-app/commit/4d9a8773fed8fc94d558978e4fffdb94c420009f) Thanks [@justinbarry](https://github.com/justinbarry)! - - Add popover tooltips for URL mismatch warnings
  - Display the provided and expected uri's inline

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Updated main used colors

- [#178](https://github.com/burnt-labs/xion-dashboard-app/pull/178) [`d1004c7`](https://github.com/burnt-labs/xion-dashboard-app/commit/d1004c73f92efc41f0b9b9fda0457c583d789640) Thanks [@OjiCode](https://github.com/OjiCode)! - Added unit tests to components

- [#142](https://github.com/burnt-labs/xion-dashboard-app/pull/142) [`f72339b`](https://github.com/burnt-labs/xion-dashboard-app/commit/f72339bc43a0c4aeea116a04f1f9720fe11aa550) Thanks [@burnt-sun](https://github.com/burnt-sun)! - use v1 gov for prop submission instead of v1beta1

- [#192](https://github.com/burnt-labs/xion-dashboard-app/pull/192) [`3e811a0`](https://github.com/burnt-labs/xion-dashboard-app/commit/3e811a062acce5fa3c579bea0e9f99e5a8a5b0ee) Thanks [@justinbarry](https://github.com/justinbarry)! - Update API URL in testnet environment file

- [#189](https://github.com/burnt-labs/xion-dashboard-app/pull/189) [`a609e78`](https://github.com/burnt-labs/xion-dashboard-app/commit/a609e7844537e6d898710fa027742f3183df1620) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Fixed a UI z-index bug

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - fixed mobile row skeleton and no Dialog close in dashboard Accounts Dialog

- [#184](https://github.com/burnt-labs/xion-dashboard-app/pull/184) [`45da61c`](https://github.com/burnt-labs/xion-dashboard-app/commit/45da61c7d8eb20b4e5987fd9ab448bb3dfc4d7fd) Thanks [@2xburnt](https://github.com/2xburnt)! - Update build commands for wrangler, Add polyfills for pages deployment.

- [#148](https://github.com/burnt-labs/xion-dashboard-app/pull/148) [`8e98bf3`](https://github.com/burnt-labs/xion-dashboard-app/commit/8e98bf3dc26fe2e94da5d62147198c0cd29770d4) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Added color #ffffff to the entire app

- [#170](https://github.com/burnt-labs/xion-dashboard-app/pull/170) [`f681f64`](https://github.com/burnt-labs/xion-dashboard-app/commit/f681f64c270b0df18b06ebc41332168517edc75d) Thanks [@OjiCode](https://github.com/OjiCode)! - Updated AccountInfo card styling

- [#181](https://github.com/burnt-labs/xion-dashboard-app/pull/181) [`1f05f4e`](https://github.com/burnt-labs/xion-dashboard-app/commit/1f05f4e1c7f2b87d43b2d8d18509a48ee9072413) Thanks [@justinbarry](https://github.com/justinbarry)! - Update readme with localhost dns setup

- [#173](https://github.com/burnt-labs/xion-dashboard-app/pull/173) [`4afc4ee`](https://github.com/burnt-labs/xion-dashboard-app/commit/4afc4ee279720dac7d3d8d7273f6f24981eb6d6b) Thanks [@justinbarry](https://github.com/justinbarry)! - environment changes for testnet2

- [#211](https://github.com/burnt-labs/xion-dashboard-app/pull/211) [`77230da`](https://github.com/burnt-labs/xion-dashboard-app/commit/77230daeb034b5672f356bb1042c41d1b72059d8) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - Updated 'History' link to go to account

- [#190](https://github.com/burnt-labs/xion-dashboard-app/pull/190) [`9ddfa39`](https://github.com/burnt-labs/xion-dashboard-app/commit/9ddfa3901a2565e0e58b03f7e88409e2d8f95556) Thanks [@justinbarry](https://github.com/justinbarry)! - Limit the number of decimals in the send form to match the number of decimals for that asset

- [#139](https://github.com/burnt-labs/xion-dashboard-app/pull/139) [`43f59fb`](https://github.com/burnt-labs/xion-dashboard-app/commit/43f59fb5238e454a1adb8f1e7bbfa67037834717) Thanks [@justinbarry](https://github.com/justinbarry)! - No longer force Gmail addresses to use oauth on mainnet

- [#179](https://github.com/burnt-labs/xion-dashboard-app/pull/179) [`0c39a45`](https://github.com/burnt-labs/xion-dashboard-app/commit/0c39a4595ffdfb0b849405b6949d68416ba4f4d2) Thanks [@justinbarry](https://github.com/justinbarry)! - Improved permission display with human-readable format for better user understanding

- [#209](https://github.com/burnt-labs/xion-dashboard-app/pull/209) [`b5c6116`](https://github.com/burnt-labs/xion-dashboard-app/commit/b5c611669da40b57ee529487799d2f860ac9748b) Thanks [@BurntSpooky](https://github.com/BurntSpooky)! - updated 3rd party image display

- [#188](https://github.com/burnt-labs/xion-dashboard-app/pull/188) [`21431d2`](https://github.com/burnt-labs/xion-dashboard-app/commit/21431d2a4fc1c85a9412b2f1112a053ee3040a88) Thanks [@justinbarry](https://github.com/justinbarry)! - Update fee granter address and gas adjustment values for testnet-2

- [#177](https://github.com/burnt-labs/xion-dashboard-app/pull/177) [`153b5a2`](https://github.com/burnt-labs/xion-dashboard-app/commit/153b5a20f835baba5d01dcb1992374bf070d8fec) Thanks [@OjiCode](https://github.com/OjiCode)! - Added url normalization when comparing redirect urls during the grant process.

- [#191](https://github.com/burnt-labs/xion-dashboard-app/pull/191) [`af18357`](https://github.com/burnt-labs/xion-dashboard-app/commit/af1835798bc3bcf756abcd98bc591f13e238ce4c) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix chain registry path

## 0.2.1

### Patch Changes

- 6896393: Upated changeset github workflow

## 0.2.0

### Minor Changes

- 73e21cf: Added error handling modal for indexer failure

### Patch Changes

- 90ef1b2: Updated release changeset job to utilize official action.
- 1e7089b: Removed node setup step in changeset release job.
- 808c57e: Added changeset tooling
- a3cda95: Fixed changeset config

## 0.2.0-alpha.27

### Minor Changes

- [#183](https://github.com/burnt-labs/xion.js/pull/183) [`750803b`](https://github.com/burnt-labs/xion.js/commit/750803b1a4235334322262d1e932f81d3ea13060) Thanks [@BurntVal](https://github.com/BurntVal)! - General cleanup and build optimization

- [#185](https://github.com/burnt-labs/xion.js/pull/185) [`b1a90e9`](https://github.com/burnt-labs/xion.js/commit/b1a90e956180d3262c69122dacd3cdfee55d5afb) Thanks [@BurntVal](https://github.com/BurntVal)! - revert to explicit flow for creating initial meta account

- [#189](https://github.com/burnt-labs/xion.js/pull/189) [`7556cda`](https://github.com/burnt-labs/xion.js/commit/7556cda956eddf2e37d154ffb10c4ec6165c79ed) Thanks [@justinbarry](https://github.com/justinbarry)! - Disable sentry replays and performance tracing for dashboard

- [#181](https://github.com/burnt-labs/xion.js/pull/181) [`b618cc8`](https://github.com/burnt-labs/xion.js/commit/b618cc8edc57463925e3e8945dd2c5ee55d87879) Thanks [@BurntVal](https://github.com/BurntVal)! - usdc iteration for sending tokens

- [#178](https://github.com/burnt-labs/xion.js/pull/178) [`a0b5031`](https://github.com/burnt-labs/xion.js/commit/a0b5031f8766369b00562387b692450f396a9d7f) Thanks [@BurntVal](https://github.com/BurntVal)! - Implement ability to remove authenticators

### Patch Changes

- Updated dependencies [[`bcc35c9`](https://github.com/burnt-labs/xion.js/commit/bcc35c9ed8faf2edb6f1e19f06e8b8ced9530067), [`750803b`](https://github.com/burnt-labs/xion.js/commit/750803b1a4235334322262d1e932f81d3ea13060), [`33493c5`](https://github.com/burnt-labs/xion.js/commit/33493c5a33224d59e517ddd84aec3e35d1f5c291), [`b618cc8`](https://github.com/burnt-labs/xion.js/commit/b618cc8edc57463925e3e8945dd2c5ee55d87879), [`a0b5031`](https://github.com/burnt-labs/xion.js/commit/a0b5031f8766369b00562387b692450f396a9d7f)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.46
  - @burnt-labs/constants@0.1.0-alpha.9
  - @burnt-labs/signers@0.1.0-alpha.11
  - @burnt-labs/ui@0.1.0-alpha.13

## 0.2.0-alpha.26

### Minor Changes

- [#176](https://github.com/burnt-labs/xion.js/pull/176) [`a80ed9c`](https://github.com/burnt-labs/xion.js/commit/a80ed9c32f0c5c91a8ec7aacfba5bddddfc43f84) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added UI Fixes and new button style

### Patch Changes

- Updated dependencies [[`a80ed9c`](https://github.com/burnt-labs/xion.js/commit/a80ed9c32f0c5c91a8ec7aacfba5bddddfc43f84), [`b3ecf24`](https://github.com/burnt-labs/xion.js/commit/b3ecf24cf8c240c2b0c721ed803decca9f6a91a4)]:
  - @burnt-labs/ui@0.1.0-alpha.12
  - @burnt-labs/abstraxion@1.0.0-alpha.45

## 0.2.0-alpha.25

### Minor Changes

- [#165](https://github.com/burnt-labs/xion.js/pull/165) [`e53a5bd`](https://github.com/burnt-labs/xion.js/commit/e53a5bd382481001f1968d3314c858de0fe2b5ea) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added prop for more direct access to input styles

- [#167](https://github.com/burnt-labs/xion.js/pull/167) [`1cddf5b`](https://github.com/burnt-labs/xion.js/commit/1cddf5bd9c91393b93e177d8f625ab00d3d284c5) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added mobile UI fixes for dashboard

### Patch Changes

- Updated dependencies [[`2edf674`](https://github.com/burnt-labs/xion.js/commit/2edf674428695388127a24c93cd28e815db43425), [`210bac1`](https://github.com/burnt-labs/xion.js/commit/210bac17b576cba3b470084aed6b07c991a91453), [`e53a5bd`](https://github.com/burnt-labs/xion.js/commit/e53a5bd382481001f1968d3314c858de0fe2b5ea), [`1cddf5b`](https://github.com/burnt-labs/xion.js/commit/1cddf5bd9c91393b93e177d8f625ab00d3d284c5), [`f018dc1`](https://github.com/burnt-labs/xion.js/commit/f018dc124615bbf467abbea35cb656852233593d)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.44
  - @burnt-labs/ui@0.1.0-alpha.11

## 0.2.0-alpha.24

### Patch Changes

- Updated dependencies [[`aa57bfd`](https://github.com/burnt-labs/xion.js/commit/aa57bfdd0ed1651b652b2a9a39a2eeb54ab25d11)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.43

## 0.2.0-alpha.23

### Minor Changes

- [#147](https://github.com/burnt-labs/xion.js/pull/147) [`bed091d`](https://github.com/burnt-labs/xion.js/commit/bed091d74557457efb681734a27b46d97cdefbbe) Thanks [@BurntVal](https://github.com/BurntVal)! - Implementation of OKX wallet (cosmos provider)

- [#161](https://github.com/burnt-labs/xion.js/pull/161) [`deb1a8d`](https://github.com/burnt-labs/xion.js/commit/deb1a8dae04fe878a56e9e17d090b94c56069f44) Thanks [@justinbarry](https://github.com/justinbarry)! - Update the url used to check for grants to include the granter to avoid the rest node having to do a table scan.

### Patch Changes

- Updated dependencies [[`bed091d`](https://github.com/burnt-labs/xion.js/commit/bed091d74557457efb681734a27b46d97cdefbbe), [`deb1a8d`](https://github.com/burnt-labs/xion.js/commit/deb1a8dae04fe878a56e9e17d090b94c56069f44)]:
  - @burnt-labs/signers@0.1.0-alpha.10
  - @burnt-labs/ui@0.1.0-alpha.10
  - @burnt-labs/abstraxion@1.0.0-alpha.42

## 0.2.0-alpha.22

### Minor Changes

- [#151](https://github.com/burnt-labs/xion.js/pull/151) [`958f66a`](https://github.com/burnt-labs/xion.js/commit/958f66ab7b82bdbb8a591d16b2cc399859e8508b) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Broke out grant flow to unique app.

- [#134](https://github.com/burnt-labs/xion.js/pull/134) [`4c230d8`](https://github.com/burnt-labs/xion.js/commit/4c230d82f20b934acd77ea102e45a29ad3e148ae) Thanks [@BurntVal](https://github.com/BurntVal)! - Add Authenticator Modal & Fresh User Dashboard Flow

- [#139](https://github.com/burnt-labs/xion.js/pull/139) [`f09cc0b`](https://github.com/burnt-labs/xion.js/commit/f09cc0b7167e41673f7aeb0ce317896e2e4b5582) Thanks [@BurntVal](https://github.com/BurntVal)! - Extend abstraxion-core to allow for framework agnostic implementations

- [#148](https://github.com/burnt-labs/xion.js/pull/148) [`e46656b`](https://github.com/burnt-labs/xion.js/commit/e46656ba2880e7fe80e8425f4f49047d54b665e5) Thanks [@justinbarry](https://github.com/justinbarry)! - No longer auto select first account after first login

### Patch Changes

- [#140](https://github.com/burnt-labs/xion.js/pull/140) [`e21e824`](https://github.com/burnt-labs/xion.js/commit/e21e8244923a764acada81197da821949aaa2ff2) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added unit test for dashboard send and receive functionality

- Updated dependencies [[`958f66a`](https://github.com/burnt-labs/xion.js/commit/958f66ab7b82bdbb8a591d16b2cc399859e8508b), [`c1ed608`](https://github.com/burnt-labs/xion.js/commit/c1ed60803731b13b831169ed675049e7a257aeeb), [`4c230d8`](https://github.com/burnt-labs/xion.js/commit/4c230d82f20b934acd77ea102e45a29ad3e148ae), [`f09cc0b`](https://github.com/burnt-labs/xion.js/commit/f09cc0b7167e41673f7aeb0ce317896e2e4b5582), [`8ec1c5b`](https://github.com/burnt-labs/xion.js/commit/8ec1c5b752f8136c9e6ba7fcfec16e85542d7c21)]:
  - @burnt-labs/constants@0.1.0-alpha.8
  - @burnt-labs/ui@0.1.0-alpha.9
  - @burnt-labs/abstraxion@1.0.0-alpha.41

## 0.2.0-alpha.21

### Minor Changes

- [#131](https://github.com/burnt-labs/xion.js/pull/131) [`d6673bf`](https://github.com/burnt-labs/xion.js/commit/d6673bfa9d9a72472f4336758976aa3dd3a78785) Thanks [@BurntVal](https://github.com/BurntVal)! - Implement wallet send functionality

- [#127](https://github.com/burnt-labs/xion.js/pull/127) [`00167f0`](https://github.com/burnt-labs/xion.js/commit/00167f0304a065d1d244c73b5ba02edc88f85460) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Updated UI for mainnet release

- [#138](https://github.com/burnt-labs/xion.js/pull/138) [`1f006dd`](https://github.com/burnt-labs/xion.js/commit/1f006dd5ea7bfa67eb46d01057838b0d5287d466) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Adapted dashboard for better mobile UI

- [#135](https://github.com/burnt-labs/xion.js/pull/135) [`6ea54fc`](https://github.com/burnt-labs/xion.js/commit/6ea54fc6fbca0de8434e09cb43b563e26643d7fc) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added receive functionality to dashboard

### Patch Changes

- [#137](https://github.com/burnt-labs/xion.js/pull/137) [`8de24aa`](https://github.com/burnt-labs/xion.js/commit/8de24aa187e9316c9cf9a1f431f08e4ae629842e) Thanks [@justinbarry](https://github.com/justinbarry)! - Update casing of "XION" from across multiple components

- Updated dependencies [[`d6673bf`](https://github.com/burnt-labs/xion.js/commit/d6673bfa9d9a72472f4336758976aa3dd3a78785), [`1f006dd`](https://github.com/burnt-labs/xion.js/commit/1f006dd5ea7bfa67eb46d01057838b0d5287d466), [`8de24aa`](https://github.com/burnt-labs/xion.js/commit/8de24aa187e9316c9cf9a1f431f08e4ae629842e), [`12b995f`](https://github.com/burnt-labs/xion.js/commit/12b995f5c3216bad7537d4232ea2bbd2340ced32)]:
  - @burnt-labs/ui@0.1.0-alpha.8
  - @burnt-labs/constants@0.1.0-alpha.7
  - @burnt-labs/abstraxion@1.0.0-alpha.40

## 0.2.0-alpha.20

### Minor Changes

- [#122](https://github.com/burnt-labs/xion.js/pull/122) [`f15f5a8`](https://github.com/burnt-labs/xion.js/commit/f15f5a837511d03dae21f16c5a229ddb17f0e565) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added visual differences for net type to sign in modal

- [#120](https://github.com/burnt-labs/xion.js/pull/120) [`0831c9a`](https://github.com/burnt-labs/xion.js/commit/0831c9a9a5685c1b591f96a46a98371711a00e3d) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added visual elements to dashboard to distinguish between net type.

### Patch Changes

- [#123](https://github.com/burnt-labs/xion.js/pull/123) [`e4aa3f0`](https://github.com/burnt-labs/xion.js/commit/e4aa3f096cff27e6672393300532622040b0f781) Thanks [@icfor](https://github.com/icfor)! - Add staking grant for cancelling unbondings (MsgCancelUnbondingDelegation)

- [#117](https://github.com/burnt-labs/xion.js/pull/117) [`6978612`](https://github.com/burnt-labs/xion.js/commit/697861259eff1199d143f79c7d8c0666eec4760b) Thanks [@BurntVal](https://github.com/BurntVal)! - Add configurability to allow for mainnet/testnet deployments

  For devs utilizing the `buildAddJWTAuthenticatorMsg` found in the @burnt-labs/signers package, please note that you will now need to pass in an aud string. Contact the team for details.

- [#69](https://github.com/burnt-labs/xion.js/pull/69) [`989dab6`](https://github.com/burnt-labs/xion.js/commit/989dab66608481b47a745cb2a84d80903b5c93ec) Thanks [@lastly001](https://github.com/lastly001)! - chore: remove unused line

- Updated dependencies [[`6978612`](https://github.com/burnt-labs/xion.js/commit/697861259eff1199d143f79c7d8c0666eec4760b)]:
  - @burnt-labs/signers@0.1.0-alpha.9
  - @burnt-labs/abstraxion@1.0.0-alpha.39

## 0.2.0-alpha.19

### Patch Changes

- Updated dependencies []:
  - @burnt-labs/abstraxion@1.0.0-alpha.38

## 0.2.0-alpha.18

### Minor Changes

- [#116](https://github.com/burnt-labs/xion.js/pull/116) [`774562b`](https://github.com/burnt-labs/xion.js/commit/774562b9b02fe82ab98d694d6a3b10c30f89c33e) Thanks [@justinbarry](https://github.com/justinbarry)! - Disable "Allow and Continue" on grant screen until the client is ready

### Patch Changes

- Updated dependencies [[`d7abb7a`](https://github.com/burnt-labs/xion.js/commit/d7abb7ab9f8f09dca90496f5cf42e97d6635304c)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.37

## 0.2.0-alpha.17

### Minor Changes

- [#112](https://github.com/burnt-labs/xion.js/pull/112) [`04f02b1`](https://github.com/burnt-labs/xion.js/commit/04f02b1dc2f689b318c642628f32bb22f536ec4e) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix window.keplr error on startup when keplr is not installed

- [#111](https://github.com/burnt-labs/xion.js/pull/111) [`97685ba`](https://github.com/burnt-labs/xion.js/commit/97685bab1c531937a817c53bc314b079fe60cde8) Thanks [@icfor](https://github.com/icfor)! - Allow extra messages in the fee grant

- [#109](https://github.com/burnt-labs/xion.js/pull/109) [`4594b46`](https://github.com/burnt-labs/xion.js/commit/4594b46fa3c668e02c5ccade8d3b7aae2e7c0d77) Thanks [@BurntVal](https://github.com/BurntVal)! - Impl Ethereum authenticator and signer

### Patch Changes

- [#109](https://github.com/burnt-labs/xion.js/pull/109) [`4594b46`](https://github.com/burnt-labs/xion.js/commit/4594b46fa3c668e02c5ccade8d3b7aae2e7c0d77) Thanks [@BurntVal](https://github.com/BurntVal)! - Move Keplr/Metamask signin buttons into an "advanced" dropdown panel.

- Updated dependencies [[`4594b46`](https://github.com/burnt-labs/xion.js/commit/4594b46fa3c668e02c5ccade8d3b7aae2e7c0d77), [`6ea5c28`](https://github.com/burnt-labs/xion.js/commit/6ea5c282a9cd4ca15068052a4b615cd902f6113d)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.36
  - @burnt-labs/signers@0.1.0-alpha.8
  - @burnt-labs/ui@0.1.0-alpha.7

## 0.2.0-alpha.16

### Minor Changes

- [#78](https://github.com/burnt-labs/xion.js/pull/78) [`6de3996`](https://github.com/burnt-labs/xion.js/commit/6de39966e4a308c740ab8e66eb00a4c1f2d479b4) Thanks [@BurntVal](https://github.com/BurntVal)! - introduce the ability to add a secp256k1 authenticator (via Keplr) and use it as a signer for transactions

- # [#107](https://github.com/burnt-labs/xion.js/pull/107) [`2c33c31`](https://github.com/burnt-labs/xion.js/commit/2c33c3136280558ec505b401911244310432ebd3) Thanks [@justinbarry](https://github.com/justinbarry)! -

# Staking Grants

Add the ability for dapps to request staking grants be give via the dashboard. To request a grant, the dapp will need to set the `stake` prop to `true` in the config of the `abstraxion` provider.

```jsx
<AbstraxionProvider
  config={{
    stake: true,
  }}
>
  {children}
</AbstraxionProvider>
```

This will grant `StakeAuthorization` to delegate, undelegate, redelegate and a GenericAuthorization to exec a MsgWithdrawDelegatorReward msg along with a feegrant for these message to cover the fees.

# Bank Send Grants

Add the ability for dapps to request bank send grants be give via the dashboard. To request a grant, the dapp will need to set pass the requested `denom` and `amount` to the config of the `abstraxion` provider.

```jsx
<AbstraxionProvider
  config={{
    bank: [
      {
        denom: "uxion",
        amount: "1000000",
      },
    ],
  }}
>
  {children}
</AbstraxionProvider>
```

### Patch Changes

- Updated dependencies [[`6de3996`](https://github.com/burnt-labs/xion.js/commit/6de39966e4a308c740ab8e66eb00a4c1f2d479b4), [`2c33c31`](https://github.com/burnt-labs/xion.js/commit/2c33c3136280558ec505b401911244310432ebd3)]:
  - @burnt-labs/signers@0.1.0-alpha.7
  - @burnt-labs/ui@0.1.0-alpha.6
  - @burnt-labs/abstraxion@1.0.0-alpha.35

## 0.2.0-alpha.15

### Patch Changes

- Updated dependencies [[`0236eea`](https://github.com/burnt-labs/xion.js/commit/0236eea22a4c5a9b0b9b413cac4a8b62038a4456)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.34

## 0.2.0-alpha.14

### Minor Changes

- [#94](https://github.com/burnt-labs/xion.js/pull/94) [`c695fbf`](https://github.com/burnt-labs/xion.js/commit/c695fbfa636dd149a2f7305cd87298c6cc84d67e) Thanks [@justinbarry](https://github.com/justinbarry)! - Update the following packages to the latest version:

  | Package                   | Version |
  | ------------------------- | ------- |
  | @cosmjs/cosmwasm-stargate | ^0.32.2 |
  | @cosmjs/proto-signing     | ^0.32.2 |
  | @cosmjs/stargate          | ^0.32.2 |
  | @cosmjs/tendermint-rpc    | ^0.32.2 |
  | cosmjs-types              | ^0.9.0  |

### Patch Changes

- Updated dependencies [[`c695fbf`](https://github.com/burnt-labs/xion.js/commit/c695fbfa636dd149a2f7305cd87298c6cc84d67e)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.33
  - @burnt-labs/signers@0.1.0-alpha.6

## 0.2.0-alpha.13

### Minor Changes

- [#97](https://github.com/burnt-labs/xion.js/pull/97) [`9ff23cb`](https://github.com/burnt-labs/xion.js/commit/9ff23cb244c271fb7438f2caef2b18ce4fa0afb8) Thanks [@justinbarry](https://github.com/justinbarry)! - Update default RPC/Rest Urls and allow for dapps to pass in rest url via the AbstraxionProvider.

  ```typescript
          <AbstraxionProvider
            config={{
              restUrl: "https://api.example.com",
            }}
          >
            {children}
          </AbstraxionProvider>

  ```

### Patch Changes

- Updated dependencies [[`9ff23cb`](https://github.com/burnt-labs/xion.js/commit/9ff23cb244c271fb7438f2caef2b18ce4fa0afb8)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.32
  - @burnt-labs/constants@0.1.0-alpha.6

## 0.2.0-alpha.12

### Minor Changes

- [#95](https://github.com/burnt-labs/xion.js/pull/95) [`e6f0696`](https://github.com/burnt-labs/xion.js/commit/e6f06961f7368447a18fbd76bf3500cab8a686a2) Thanks [@justinbarry](https://github.com/justinbarry)! - Allow setting of the dashboard RPC via NEXT_PUBLIC_RPC_URL env var

### Patch Changes

- Updated dependencies [[`415f15a`](https://github.com/burnt-labs/xion.js/commit/415f15a50a85b55271e8ecf220801f67c4b3f7d1)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.31

## 0.2.0-alpha.11

### Patch Changes

- Updated dependencies [[`a9a882a`](https://github.com/burnt-labs/xion.js/commit/a9a882a23ff3227591287e7dc28438f7644a7bfa)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.30

## 0.2.0-alpha.10

### Patch Changes

- Updated dependencies [[`874ef2b`](https://github.com/burnt-labs/xion.js/commit/874ef2b6e0096285beff6752c7e2dc1e1c276ba4)]:
  - @burnt-labs/constants@0.1.0-alpha.5
  - @burnt-labs/abstraxion@1.0.0-alpha.29

## 0.2.0-alpha.9

### Patch Changes

- Updated dependencies [[`e60fb47`](https://github.com/burnt-labs/xion.js/commit/e60fb4714b8cdf90ad2cfbba5c77b8b78a11542b), [`f46fa86`](https://github.com/burnt-labs/xion.js/commit/f46fa8672ccf38d66b9bde244eecef573ee86ded)]:
  - @burnt-labs/constants@0.1.0-alpha.4
  - @burnt-labs/abstraxion@1.0.0-alpha.28

## 0.2.0-alpha.8

### Minor Changes

- [#80](https://github.com/burnt-labs/xion.js/pull/80) [`00dbb89`](https://github.com/burnt-labs/xion.js/commit/00dbb89f13028ec5251c744b1130e82b86afb8d6) Thanks [@justinbarry](https://github.com/justinbarry)! - Add sentry.io error tracking

- [#83](https://github.com/burnt-labs/xion.js/pull/83) [`7dd82fe`](https://github.com/burnt-labs/xion.js/commit/7dd82fe902ca1d0f64f91a1dd185be965beb6331) Thanks [@justinbarry](https://github.com/justinbarry)! - Add ability for a DAPP to request a token budget alongside contract exec privileges

### Patch Changes

- [#77](https://github.com/burnt-labs/xion.js/pull/77) [`cc24142`](https://github.com/burnt-labs/xion.js/commit/cc24142ce8ea3f62c83f35b528c5739427208d25) Thanks [@justinbarry](https://github.com/justinbarry)! - Enable vercel analytics on dashboard

- [#81](https://github.com/burnt-labs/xion.js/pull/81) [`6afb4dd`](https://github.com/burnt-labs/xion.js/commit/6afb4dd96af14bae2bd0a06632b37613e69faafb) Thanks [@justinbarry](https://github.com/justinbarry)! - Add error tracking for chain errors

- [#75](https://github.com/burnt-labs/xion.js/pull/75) [`2da222b`](https://github.com/burnt-labs/xion.js/commit/2da222bd97540a0eb5aefb3efd2c93e1fafe3ce7) Thanks [@justinbarry](https://github.com/justinbarry)! - Remove passkey biometrics button, remove white avatar and update copy

- Updated dependencies [[`7dd82fe`](https://github.com/burnt-labs/xion.js/commit/7dd82fe902ca1d0f64f91a1dd185be965beb6331)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.27

## 0.2.0-alpha.7

### Patch Changes

- Updated dependencies [[`4a281fc`](https://github.com/burnt-labs/xion.js/commit/4a281fcfa7ead6cb91f935e853b0a1bf7b98dcc9)]:
  - @burnt-labs/constants@0.0.1-alpha.3
  - @burnt-labs/signers@0.1.0-alpha.5
  - @burnt-labs/abstraxion@1.0.0-alpha.26

## 0.2.0-alpha.6

### Minor Changes

- [#57](https://github.com/burnt-labs/xion.js/pull/57) [`5e0d06f`](https://github.com/burnt-labs/xion.js/commit/5e0d06fd329422c7e0c7bcf63cc5929a8617502c) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Moved display logic to internal "useModal" hook. Consumers will need to change their strategy from a custom piece of state within their app to utilizing this new hook. The login flow will now be a single tab experience.

- [#57](https://github.com/burnt-labs/xion.js/pull/57) [`5e0d06f`](https://github.com/burnt-labs/xion.js/commit/5e0d06fd329422c7e0c7bcf63cc5929a8617502c) Thanks [@BurntNerve](https://github.com/BurntNerve)! - Added font files and small ui tweaks

### Patch Changes

- Updated dependencies [[`5e0d06f`](https://github.com/burnt-labs/xion.js/commit/5e0d06fd329422c7e0c7bcf63cc5929a8617502c), [`5e0d06f`](https://github.com/burnt-labs/xion.js/commit/5e0d06fd329422c7e0c7bcf63cc5929a8617502c), [`39fabfe`](https://github.com/burnt-labs/xion.js/commit/39fabfe78b029e55aa417ec9751696d861a905b0)]:
  - @burnt-labs/abstraxion@1.0.0-alpha.25
  - @burnt-labs/ui@0.1.0-alpha.5

## 0.2.0-alpha.5

### Minor Changes

- [#61](https://github.com/burnt-labs/xion.js/pull/61) [`105279a`](https://github.com/burnt-labs/xion.js/commit/105279afb824940e744a4366be25b83fb8fb74e0) Thanks [@justinbarry](https://github.com/justinbarry)! - Fix vite issue with graz package deep imports

### Patch Changes

- Updated dependencies [[`105279a`](https://github.com/burnt-labs/xion.js/commit/105279afb824940e744a4366be25b83fb8fb74e0)]:
  - @burnt-labs/abstraxion@0.1.0-alpha.24

## 0.2.0-alpha.4

### Patch Changes

- Updated dependencies [[`2257a1f`](https://github.com/burnt-labs/xion.js/commit/2257a1f5249a1efaa6f7d15522ee330981ae8952)]:
  - @burnt-labs/abstraxion@0.1.0-alpha.23
  - @burnt-labs/signers@0.1.0-alpha.4

## 0.2.0-alpha.3

### Patch Changes

- Updated dependencies [[`6a6fdd2`](https://github.com/burnt-labs/xion.js/commit/6a6fdd253a1dc81873d271d2ac5e87100ef18ff1), [`dd8680f`](https://github.com/burnt-labs/xion.js/commit/dd8680f6bc18e15a531993be048e9db83d79b488)]:
  - @burnt-labs/abstraxion@0.1.0-alpha.22
  - @burnt-labs/ui@0.1.0-alpha.4

## 0.2.0-alpha.2

### Minor Changes

- [#41](https://github.com/burnt-labs/xion.js/pull/41) [`a269cdf`](https://github.com/burnt-labs/xion.js/commit/a269cdf88722408e91b643d12ce4181ce26296f3) Thanks [@BurntVal](https://github.com/BurntVal)! - abstraxion dynamic url for grant creation on dashboard

- [#33](https://github.com/burnt-labs/xion.js/pull/33) [`e7e582b`](https://github.com/burnt-labs/xion.js/commit/e7e582be198bca6b3bd0cf42ad68d8f7428132cb) Thanks [@BurntVal](https://github.com/BurntVal)! - Wrap contract grant message inside a `ContractExecutionAuthorization` message

### Patch Changes

- Updated dependencies [[`a269cdf`](https://github.com/burnt-labs/xion.js/commit/a269cdf88722408e91b643d12ce4181ce26296f3), [`e7e582b`](https://github.com/burnt-labs/xion.js/commit/e7e582be198bca6b3bd0cf42ad68d8f7428132cb), [`56b9f87`](https://github.com/burnt-labs/xion.js/commit/56b9f87482a7210072eaa279960d1ff01ad5b4e0)]:
  - @burnt-labs/abstraxion@0.1.0-alpha.21
  - @burnt-labs/tailwind-config@0.0.1-alpha.2
  - @burnt-labs/ui@0.0.1-alpha.3

## 0.2.0-alpha.1

### Minor Changes

- [#37](https://github.com/burnt-labs/xion.js/pull/37) [`30b8913`](https://github.com/burnt-labs/xion.js/commit/30b891389890bb85486d2e5d1d49ca2c9a16f8b8) Thanks [@justinbarry](https://github.com/justinbarry)! - Change API endpoints to the 'live' infrastructure and the live stytch project id

### Patch Changes

- Updated dependencies [[`30b8913`](https://github.com/burnt-labs/xion.js/commit/30b891389890bb85486d2e5d1d49ca2c9a16f8b8)]:
  - @burnt-labs/abstraxion@0.1.0-alpha.20
  - @burnt-labs/signers@0.1.0-alpha.3

## 0.1.1-alpha.0

### Patch Changes

- [#32](https://github.com/burnt-labs/xion.js/pull/32) [`f6e5618`](https://github.com/burnt-labs/xion.js/commit/f6e5618f36ff15e6f642efad209f88151b395b7a) Thanks [@justinbarry](https://github.com/justinbarry)! - Initial commit of dashbaord

- Updated dependencies [[`7f498ee`](https://github.com/burnt-labs/xion.js/commit/7f498ee6c58a897f0a6cda76ecb60b52dd495846), [`5a17b99`](https://github.com/burnt-labs/xion.js/commit/5a17b99b56e62535297bd2b5a1086df68ee82ee1)]:
  - @burnt-labs/abstraxion@0.1.0-alpha.19
