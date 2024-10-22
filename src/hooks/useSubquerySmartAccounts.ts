import { SubqueryIndexerStrategy } from "../indexer-strategies/subquery-indexer-strategy";
import { getEnvStringOrThrow } from "../utils";
import { useBaseSmartAccounts } from "./baseSmartAccount";

const POLL_INTERVAL_DEFAULT = 3000; // 3 seconds

const subqueryIndexerStrategy = new SubqueryIndexerStrategy(
  getEnvStringOrThrow(
    "VITE_DEFAULT_INDEXER_URL",
    import.meta.env.VITE_DEFAULT_INDEXER_URL,
  ),
);

export const useSubquerySmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  return useBaseSmartAccounts(
    subqueryIndexerStrategy,
    waitToFetch,
    handleSuccess,
  );
};
