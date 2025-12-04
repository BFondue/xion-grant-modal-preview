import { useSubquerySmartAccounts } from "./useSubquerySmartAccounts";
import { useNumiaSmartAccounts } from "./useNumiaSmartAccounts";
import { useNoSmartAccounts } from "./useNoSmartAccounts";
import { INDEXER_STRATEGY } from "../config";

enum SmartAccountsStrategy {
  no = "no",
  numia = "numia",
  subquery = "subquery",
}

// This hook will return the strategy set in the env vars
export const useGetSmartAccountsStrategy = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  switch (INDEXER_STRATEGY) {
    case SmartAccountsStrategy.no:
      return useNoSmartAccounts(waitToFetch, handleSuccess);
    case SmartAccountsStrategy.subquery:
      return useSubquerySmartAccounts(waitToFetch, handleSuccess);
    case SmartAccountsStrategy.numia:
    default:
      return useNumiaSmartAccounts(waitToFetch, handleSuccess);
  }
};
