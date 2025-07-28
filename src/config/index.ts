import { isMainnet } from "../utils/chain-utils";

interface FeeToken {
  denom: string;
  fixed_min_gas_price: number;
  low_gas_price: number;
  average_gas_price: number;
  high_gas_price: number;
}

export interface ChainConfig {
  chain_name: string;
  chain_id: string;
  fees: {
    fee_tokens: FeeToken[];
  };
}

const CHAIN_ASSET_PATHS = {
  "xion-mainnet-1": "xion",
  "xion-testnet-1": "testnets/xiontestnet",
  "xion-testnet-2": "testnets/xiontestnet2",
} as const;

export const getAssetEndpoint = (chainId: string) => {
  const baseUrl = "https://assets.xion.burnt.com/chain-registry";
  const path = CHAIN_ASSET_PATHS[chainId as keyof typeof CHAIN_ASSET_PATHS];
  if (!path) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/${path}/assetlist.json`;
};

export const getChainRegistryUrl = (chainId: string) => {
  const baseUrl = "https://assets.xion.burnt.com/chain-registry";
  const path = CHAIN_ASSET_PATHS[chainId as keyof typeof CHAIN_ASSET_PATHS];
  if (!path) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/${path}/chain.json`;
};

export const getGasPrice = (chainConfig: ChainConfig) => {
  // TODO: Can we make this dynamic?
  return chainConfig.fees.fee_tokens[0];
};

// Get the default gas price for VITE_GAS_PRICE
export const getDefaultGasPrice = (chainConfig: ChainConfig) => {
  const feeToken = chainConfig.fees.fee_tokens[0];
  return feeToken.fixed_min_gas_price || feeToken.average_gas_price;
};

export const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price";

export const getRestApiUrl = (chainInfo: { rest: string }) => {
  return chainInfo.rest;
};

export const REST_ENDPOINTS = {
  balances: "/cosmos/bank/v1beta1/balances",
} as const;

// used to filter assets in the overview
export const FEATURED_ASSETS = ["USDC", "XION"] as const;

const MAINNET_USDC_DENOM =
  "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349";
const TESTNET_USDC_DENOM =
  "ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4";

export const USDC_DENOM = isMainnet() ? MAINNET_USDC_DENOM : TESTNET_USDC_DENOM;
