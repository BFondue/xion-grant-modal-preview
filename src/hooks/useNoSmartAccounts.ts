import { NoIndexerStrategy } from "../indexer-strategies/no-indexer-strategy";
import { useBaseSmartAccounts } from "./baseSmartAccount";
import { getEnvStringOrThrow } from "../utils";

const baseUrl = getEnvStringOrThrow(
  "VITE_DEFAULT_INDEXER_URL",
  import.meta.env.VITE_DEFAULT_INDEXER_URL,
);

const noIndexerStrategy = new NoIndexerStrategy(baseUrl);

export const useNoSmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  return useBaseSmartAccounts(noIndexerStrategy, waitToFetch, handleSuccess);
};
