# Deployment Process

This project uses a two-environment deployment strategy with **testnet** as a staging/beta environment and **mainnet** as production.

## Branches

| Branch    | Environment | Purpose                                          |
| --------- | ----------- | ------------------------------------------------ |
| `testnet` | Testnet     | Beta/staging - code bakes here before production |
| `main`    | Mainnet     | Production - stable releases only                |

## Versioning

We use [Changesets](https://github.com/changesets/changesets) for version management:

- **Testnet**: Release candidates (e.g., `v1.2.0-rc.0`, `v1.2.0-rc.1`)
- **Mainnet**: Stable releases (e.g., `v1.2.0`)

## Workflow

```
Feature Branch
      │
      ▼
┌─────────────────┐
│  PR → testnet   │  ← Preview deployment created
└────────┬────────┘
         │ merge
         ▼
┌─────────────────┐
│    testnet      │  ← Changesets creates "Version Packages (RC)" PR
└────────┬────────┘
         │ merge version PR
         ▼
┌─────────────────┐
│  Pre-release    │  ← v1.2.0-rc.0 published
│  (GitHub)       │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐
│ Deploy Testnet  │  ← Deployed to testnet environment
└────────┬────────┘
         │
         │ (validate on testnet)
         │
         ▼
┌─────────────────┐
│ PR → main       │  ← From testnet branch
└────────┬────────┘
         │ merge
         ▼
┌─────────────────┐
│     main        │  ← Changesets exits prerelease, creates "Version Packages" PR
└────────┬────────┘
         │ merge version PR
         ▼
┌─────────────────┐
│    Release      │  ← v1.2.0 published
│    (GitHub)     │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐
│ Deploy Mainnet  │  ← Deployed to mainnet environment
└─────────────────┘
```

## GitHub Actions Workflows

| Workflow              | Trigger               | Action                     |
| --------------------- | --------------------- | -------------------------- |
| `preview-testnet.yml` | PR to `testnet`       | Creates preview deployment |
| `release-testnet.yml` | Push to `testnet`     | Creates RC version PR      |
| `deploy-testnet.yml`  | Pre-release published | Deploys to testnet         |
| `release-mainnet.yml` | Push to `main`        | Creates stable version PR  |
| `deploy-mainnet.yml`  | Release published     | Deploys to mainnet         |

## Manual Deployment

All deploy workflows support `workflow_dispatch` for manual triggering via GitHub Actions UI.

## Branch Protection

PRs to `main` are automatically redirected to target `testnet` instead. This ensures all changes go through testnet validation before production. Only PRs from the `testnet` branch itself (or changeset release PRs from the bot) can target `main`.

### Security Model

| Branch Pattern        | Protection                                          |
| --------------------- | --------------------------------------------------- |
| `main`                | PR required, 1 approval, tests pass, signed commits |
| `testnet`             | PR required, 1 approval, tests pass, signed commits |
| `changeset-release/*` | Ruleset prevents user pushes, only bot can modify   |

### Safeguards

- **Required approvals**: All PRs require human approval before merge
- **PR redirect**: PRs to `main` from non-`testnet` branches are auto-redirected to `testnet`
- **Unsigned commits rejected**: PRs with unsigned commits are automatically closed

## Adding Changes

1. Create a feature branch from `testnet`
2. Make your changes
3. Run `pnpm changeset` to create a changeset describing your changes
4. Open a PR to `testnet`
5. After merge, the release workflow will create a version PR
6. Merge the version PR to publish an RC and deploy to testnet
7. Once validated, open a PR from `testnet` to `main` to promote to production

## Release Version

Each deployment includes the release version tag (e.g., `v1.2.0-rc.0` or `v1.2.0`):

1. **Cloudflare Dashboard**: The version is included as the deployment message, visible in the Workers deployments list.

2. **Built into the App**: `VITE_APP_VERSION` is available at build time. You can access it in your app:

```typescript
const version = import.meta.env.VITE_APP_VERSION;
```
