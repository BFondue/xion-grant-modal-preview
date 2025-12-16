import { NumiaIndexerStrategy } from "../indexer-strategies/numia-indexer-strategy";
import { useBaseSmartAccounts } from "./baseSmartAccount";
import { NUMIA_URL, NUMIA_TOKEN } from "../config";

const numiaIndexerStrategy = new NumiaIndexerStrategy(NUMIA_URL, NUMIA_TOKEN);

export const useNumiaSmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  return useBaseSmartAccounts(numiaIndexerStrategy, waitToFetch, handleSuccess);
};
