import { usdcSearchDenom } from "../../hooks/useAccountBalance";
import { Coin } from "../../signers/types/generated/cosmos/base/v1beta1/coin";

export interface SelectedCurrency {
  type: "usdc" | "xion";
  balance?: Coin;
  denom: typeof usdcSearchDenom | "uxion";
}
