import { useContext, useMemo } from "react";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../hooks";
import { getGasCalculation } from "../utils/gas-utils";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";
import { useBalances } from "./useBalances";
import { useAssetList } from "./useAssetList";
import type { Network } from "../types";

export function useAccountBalance(network: Network = "testnet") {
  const { chainInfo } = useContext(AbstraxionContext) as AbstraxionContextProps;
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { data: balances, refetch: refetchBalances } = useBalances(account?.id);
  const { data: assetList } = useAssetList(network);

  const { processedBalances, totalDollarValue } = useMemo(() => {
    if (!assetList || !balances)
      return { processedBalances: [], totalDollarValue: 0 };

    const processed = assetList.processBalances(balances);
    const total = processed.reduce(
      (sum, balance) => sum + (balance.dollarValue || 0),
      0,
    );
    return { processedBalances: processed, totalDollarValue: total };
  }, [assetList, balances]);

  async function getEstimatedSendFee(recipientAddress, sendAmount, denom) {
    const convertedSendAmount = assetList.convertToBaseAmount(
      sendAmount.toString(),
      denom,
    );

    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.fromPartial({
        fromAddress: account.id,
        toAddress: recipientAddress,
        amount: [{ denom, amount: convertedSendAmount }],
      }),
    };

    const simmedGas = await client.simulate(account.id, [msg], `xion-send`);

    const fee = getGasCalculation(simmedGas, chainInfo.chainId);
    return { fee, msg };
  }

  async function sendTokens(
    recipientAddress: string,
    sendAmount: number,
    denom: string,
    memo: string,
  ) {
    try {
      if (!account) {
        throw new Error("No account");
      }

      if (!client) {
        throw new Error("No signing client");
      }

      if (!assetList) {
        throw new Error("Asset list not available");
      }

      const asset = assetList.getAssetByDenom(denom);
      if (!asset) {
        throw new Error(`Asset not found for denom: ${denom}`);
      }

      const { fee, msg } = await getEstimatedSendFee(
        recipientAddress,
        sendAmount,
        denom,
      );

      const res = await client.signAndBroadcast(account.id, [msg], fee, memo);

      if (res.rawLog?.includes("failed")) {
        throw new Error(res.rawLog);
      }

      refetchBalances();
      return res;
    } catch (error) {
      console.error("Error sending tokens", error);
      throw error;
    }
  }

  const getBalanceByDenom = (denom: string) => {
    return processedBalances.find((balance) => balance.asset.base === denom);
  };

  return {
    balances: processedBalances,
    totalDollarValue,
    sendTokens,
    assetList,
    refetchBalances,
    getBalanceByDenom,
    getEstimatedSendFee,
  };
}
