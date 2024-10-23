import { getEnvStringOrThrow } from "../utils";
import { NumiaIndexerStrategy } from "../indexer-strategies/numia-indexer-strategy";
import { useBaseSmartAccounts } from "./baseSmartAccount";

const BASE_URL = getEnvStringOrThrow(
  "VITE_NUMIA_URL",
  import.meta.env.VITE_NUMIA_URL,
);
const AUTH_TOKEN = getEnvStringOrThrow(
  "VITE_NUMIA_TOKEN",
  import.meta.env.VITE_NUMIA_TOKEN,
);

const numiaIndexerStrategy = new NumiaIndexerStrategy(BASE_URL, AUTH_TOKEN);

export const useNumiaSmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
) => {
  return useBaseSmartAccounts(numiaIndexerStrategy, waitToFetch, handleSuccess);
};
