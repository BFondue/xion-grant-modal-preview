## Getting Started

First, run the development server:

```bash
npm run dev
```

To develop against **mainnet-1** or **testnet-1** use the following url as `http://localhost:3000` is not allowed:

```
http://d09cc484f8.test.burnt.localhost:3000
```

## To deploy Mainnet

To deploy mainnet, run the following commands

```bash
npm run build:mainnet
npm run deploy:mainnet
```

## Environment Files

The build scripts (`build:mainnet`, `build:testnet`, `build:testnet2`) will fail if a `.env` file is present in the directory. This is by design to ensure that environment-specific builds use the correct environment configuration files (`.env.mainnet`, `.env.testnet`, `.env.testnet2`) and are not affected by a local development `.env` file.

If you encounter an error during the build process, make sure to remove any `.env` file before running the build commands.
