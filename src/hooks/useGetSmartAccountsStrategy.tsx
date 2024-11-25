import { getEnvStringOrThrow } from "../utils";
import { useSubquerySmartAccounts } from "./useSubquerySmartAccounts";
import { useNumiaSmartAccounts } from "./useNumiaSmartAccounts";

enum SmartAccountsStrategy {
  numia = "numia",
  subquery = "subquery",
}

const INDEXER_STRATEGY = getEnvStringOrThrow(
  "VITE_INDEXER_STRATEGY",
  import.meta.env.VITE_INDEXER_STRATEGY,
);

// This hook will return the strategy set in the env vars
export const useGetSmartAccountsStrategy = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  switch (INDEXER_STRATEGY) {
    case SmartAccountsStrategy.subquery:
      return useSubquerySmartAccounts(waitToFetch, handleSuccess);
    case SmartAccountsStrategy.numia:
    default:
      return useNumiaSmartAccounts(waitToFetch, handleSuccess);
  }
};
