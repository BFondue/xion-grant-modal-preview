import { NoIndexerStrategy } from "../indexer-strategies/no-indexer-strategy";
import { useBaseSmartAccounts } from "./baseSmartAccount";
import { DEFAULT_INDEXER_URL } from "../config";

const noIndexerStrategy = new NoIndexerStrategy(DEFAULT_INDEXER_URL);

export const useNoSmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  return useBaseSmartAccounts(noIndexerStrategy, waitToFetch, handleSuccess);
};
