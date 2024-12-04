import { isMainnet } from "../utils";

export const ASSET_ENDPOINTS = {
  mainnet: "https://assets.xion.burnt.com/chain-registry/xion/assetlist.json",
  testnet:
    "https://assets.xion.burnt.com/chain-registry/testnets/xiontestnet/assetlist.json",
} as const;

export const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price";

export const REST_API_URL = isMainnet
  ? "https://api.xion-mainnet-1.burnt.com"
  : "https://api.xion-testnet-1.burnt.com";

export const REST_ENDPOINTS = {
  balances: "/cosmos/bank/v1beta1/balances",
} as const;

// used to filter assets in the overview
export const FEATURED_ASSETS = ["USDC", "XION"] as const;

export const USDC_DENOM = isMainnet
  ? "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64" // todo - make this the real mainnet denom
  : "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64";
