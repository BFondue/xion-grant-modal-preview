import {SubqueryIndexerStrategy} from "../indexer-strategies/subquery-indexer-strategy";
import {getEnvStringOrThrow} from "../utils";
import {useBaseSmartAccounts} from "./baseSmartAccount";
import {useContext} from "react";
import {AbstraxionContext, AbstraxionContextProps} from "../components/AbstraxionContext";

const subqueryIndexerStrategy = new SubqueryIndexerStrategy(
  getEnvStringOrThrow(
    "VITE_DEFAULT_INDEXER_URL",
    import.meta.env.VITE_DEFAULT_INDEXER_URL
  )
);

export const useSubquerySmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void
) => {

  const { chainInfo } = useContext(
      AbstraxionContext,
  ) as AbstraxionContextProps;

  // This will set on every invocation of this hook
  subqueryIndexerStrategy.rpcUrl = chainInfo.rpc;
  return useBaseSmartAccounts(subqueryIndexerStrategy, waitToFetch, handleSuccess);
};
