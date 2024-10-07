import { usdcSearchDenom } from "../../hooks/useAccountBalance";

export interface SelectedCurrency {
  type: "usdc" | "xion";
  balance?: Coin;
  denom: typeof usdcSearchDenom | "uxion";
}
