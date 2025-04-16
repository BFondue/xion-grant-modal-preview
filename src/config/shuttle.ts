import { Network } from "@delphi-labs/shuttle";

export type NetworkInfo = {
  mainnet: Network;
  testnet: Network;
};

// TODO: generate from chain info / keplr config
export const SHUTTLE_NETWORKS: NetworkInfo = {
  mainnet: {
    name: "XION",
    chainId: "xion-mainnet-1",
    chainPrefix: "xion",
    rpc: "https://rpc.xion-mainnet-1.burnt.com",
    rest: "https://api.xion-mainnet-1.burnt.com",
    defaultCurrency: {
      coinDenom: "XION",
      coinMinimalDenom: "uxion",
      coinDecimals: 6,
      coinGeckoId: "xion-2",
    },
    gasPrice: "0.0005uxion",
  },
  testnet: {
    name: "XION Testnet",
    chainId: "xion-testnet-2",
    chainPrefix: "xion",
    rpc: "https://rpc.xion-testnet-2.burnt.com/",
    rest: "https://api.xion-testnet-2.burnt.com/",
    defaultCurrency: {
      coinDenom: "XION",
      coinMinimalDenom: "uxion",
      coinDecimals: 6,
      coinGeckoId: "xion-2",
    },
    gasPrice: "0.0005uxion",
  },
};
