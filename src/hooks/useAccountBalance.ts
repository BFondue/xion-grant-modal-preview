import { useContext, useEffect, useMemo, useState } from "react";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../hooks";
import { XION_TO_USDC_CONVERSION } from "../components/Overview";
import { getGasCalculation } from "../utils/gas-utils";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";

export const usdcSearchDenom =
  "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64";

export function useAccountBalance() {
  const { chainInfo } = useContext(AbstraxionContext) as AbstraxionContextProps;
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>({
    total: 0,
    balances: [],
  });

  async function fetchBalances() {
    try {
      if (!account) {
        throw new Error("No account");
      }

      if (!client) {
        throw new Error("No signing client");
      }
      // TODO: Can we optimize balance fetching
      const uxionBalance = await client.getBalance(account.id, "uxion");
      const usdcBalance = await client.getBalance(account.id, usdcSearchDenom);

      const uxionToUsd = Number(uxionBalance.amount) * XION_TO_USDC_CONVERSION;

      setBalanceInfo({
        total: uxionToUsd + Number(usdcBalance.amount),
        balances: [uxionBalance, usdcBalance],
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }

  useEffect(() => {
    if (account && client) {
      fetchBalances();
    }
  }, [account, client]);

  async function sendTokens(
    senderAddress: string,
    sendAmount: number,
    denom: string,
    memo: string
  ) {
    try {
      if (!account) {
        throw new Error("No account");
      }

      if (!client) {
        throw new Error("No signing client");
      }

      const convertedSendAmount = String(sendAmount * 1000000);

      const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.fromPartial({
          fromAddress: account.id,
          toAddress: senderAddress,
          amount: [{ denom, amount: convertedSendAmount }],
        }),
      };

      const simmedGas = await client.simulate(account.id, [msg], `xion-send`);

      const fee = getGasCalculation(simmedGas, chainInfo.chainId);

      const res = await client.signAndBroadcast(account.id, [msg], fee, memo);

      if (res.rawLog?.includes("failed")) {
        throw new Error(res.rawLog);
      }

      fetchBalances(); // Update balances after successful token send
      return res;
    } catch (error) {
      throw error;
    }
  }

  const memoizedBalanceInfo = useMemo(() => balanceInfo, [balanceInfo]);

  return { balanceInfo: memoizedBalanceInfo, sendTokens };
}
