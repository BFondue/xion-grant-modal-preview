import { SubqueryIndexerStrategy } from "../indexer-strategies/subquery-indexer-strategy";
import { useBaseSmartAccounts } from "./baseSmartAccount";
import { useContext, useEffect } from "react";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";
import { DEFAULT_INDEXER_URL } from "../config";

const subqueryIndexerStrategy = new SubqueryIndexerStrategy(DEFAULT_INDEXER_URL);

export const useSubquerySmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  const { chainInfo, isChainInfoLoading } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  // Update RPC URL when chainInfo changes
  useEffect(() => {
    if (chainInfo?.rpc) {
      subqueryIndexerStrategy.rpcUrl = chainInfo.rpc;
    }
  }, [chainInfo?.rpc]);

  // We should wait to fetch if:
  // 1. Original waitToFetch is true OR
  // 2. Chain info is still loading OR
  // 3. RPC URL is not available
  const shouldWaitToFetch =
    waitToFetch || isChainInfoLoading || !chainInfo?.rpc;

  return useBaseSmartAccounts(
    subqueryIndexerStrategy,
    shouldWaitToFetch,
    handleSuccess,
  );
};
