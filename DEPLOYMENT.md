# Deployment Process

This project uses a two-environment deployment strategy with **testnet** as a staging/beta environment and **mainnet** as production. All deployments are tag-driven from the `main` branch.

## Branches

| Branch | Purpose                                                   |
| ------ | --------------------------------------------------------- |
| `main` | Single trunk branch — all PRs target main, tags come here |

## Versioning

- **Testnet (RC)**: Release candidate tags (e.g., `v1.2.0-rc.0`, `v1.2.0-rc.1`)
- **Mainnet (Stable)**: Stable version tags (e.g., `v1.2.0`)

## Workflow

```
Feature Branch
      │
      ▼
┌─────────────────┐
│   PR → main     │  ← Tests run, testnet preview deployed
└────────┬────────┘
         │ merge
         ▼
┌─────────────────┐
│      main       │
└────────┬────────┘
         │ push RC tag (e.g. v1.2.0-rc.0)
         ▼
┌─────────────────────┐
│  Deploy Testnet     │  ← Verify tag on main → tests → GitHub pre-release → deploy to testnet
└─────────┬───────────┘
          │ pre-release published
          ▼
┌─────────────────────┐
│  Preview Mainnet    │  ← Tests → mainnet preview build (version upload)
└─────────────────────┘
          │
          │ (validate on testnet + mainnet preview)
          │
┌─────────────────────┐
│ push stable tag     │  ← e.g. v1.2.0 (must be on main)
│ (e.g. v1.2.0)      │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Deploy Mainnet     │  ← Verify tag on main → tests → GitHub release → deploy to mainnet
└─────────────────────┘
```

## GitHub Actions Workflows

### Trigger Workflows

| Workflow              | Trigger                         | Action                                                     |
| --------------------- | ------------------------------- | ---------------------------------------------------------- |
| `preview-testnet.yml` | PR to `main`                    | Runs tests, creates testnet preview via `build-preview.yml` |
| `deploy-testnet.yml`  | RC tag push (`v*-rc*`)          | Verifies tag on main, tests, creates pre-release, deploys   |
| `preview-mainnet.yml` | Release published (pre-release) | Runs tests, creates mainnet preview via `build-preview.yml` |
| `deploy-mainnet.yml`  | Stable tag push (`v*`, not RC)  | Verifies tag on main, tests, creates release, deploys       |

### Reusable Workflows

| Workflow              | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `test.yml`            | Lint, type-check, and run tests with coverage      |
| `build-deploy.yml`    | Build and deploy to Cloudflare Workers             |
| `build-preview.yml`   | Build and upload a preview version, comment on PR  |

### Supporting Workflows

| Workflow                      | Trigger                    | Action                              |
| ----------------------------- | -------------------------- | ----------------------------------- |
| `dependency-validation.yml`   | PR to `main` (package.json) | Validates dependency changes        |

## Tag-Based Deploys

All deploys are triggered by pushing tags to the `main` branch. A `verify-branch` job ensures the tagged commit exists on `origin/main` before proceeding.

### Deploy to Testnet

```bash
# From main branch
git tag v1.2.0-rc.0
git push origin v1.2.0-rc.0
```

This triggers `deploy-testnet.yml` which:
1. Verifies the tag commit is on `main`
2. Runs the test suite
3. Creates a GitHub pre-release with auto-generated release notes
4. Builds and deploys to testnet via `build-deploy.yml`

The pre-release also triggers `preview-mainnet.yml`, which uploads a mainnet preview version so you can validate before promoting.

### Deploy to Mainnet

```bash
# From main branch
git tag v1.2.0
git push origin v1.2.0
```

This triggers `deploy-mainnet.yml` which:
1. Verifies the tag commit is on `main`
2. Runs the test suite
3. Creates a GitHub release with auto-generated release notes
4. Builds and deploys to mainnet via `build-deploy.yml`

## Manual Deployment

Both deploy workflows support `workflow_dispatch` for manual triggering via the GitHub Actions UI.

## Adding Changes

1. Create a feature branch from `main`
2. Make your changes
3. Open a PR to `main` — a testnet preview deploy is created automatically
4. After merge, push an RC tag (e.g., `v1.2.0-rc.0`) to deploy to testnet
5. Validate on testnet and the mainnet preview
6. Push a stable tag (e.g., `v1.2.0`) to deploy to mainnet

## Release Version

Each deployment includes the release version tag (e.g., `v1.2.0-rc.0` or `v1.2.0`):

1. **Cloudflare Dashboard**: The version is included as the deployment message, visible in the Workers deployments list.

2. **Built into the App**: `VITE_APP_VERSION` is available at build time. You can access it in your app:

```typescript
const version = import.meta.env.VITE_APP_VERSION;
```
