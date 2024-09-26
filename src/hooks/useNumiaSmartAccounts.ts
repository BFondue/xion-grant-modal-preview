import { useQuery } from "@tanstack/react-query";
import { useAbstraxionAccount } from "./useAbstraxionAccount";
import { getEnvStringOrThrow } from "../utils";
import { NumiaIndexerStrategy } from "../indexer-strategies/numia-indexer-strategy";
import { SmartAccount } from "../indexer-strategies/types";
import { useContext, useState } from "react";
import { AbstraxionContext, AbstraxionContextProps } from "../components/AbstraxionContext";
import { deepEqual } from "../utils/general";

const BASE_URL = getEnvStringOrThrow(
  "VITE_NUMIA_URL",
  import.meta.env.VITE_NUMIA_URL
);
const AUTH_TOKEN = getEnvStringOrThrow(
  "VITE_NUMIA_TOKEN",
  import.meta.env.VITE_NUMIA_TOKEN
);

const POLL_INTERVAL_DEFAULT = 3000;

const numiaIndexerStrategy = new NumiaIndexerStrategy(BASE_URL, AUTH_TOKEN);

export const useNumiaSmartAccounts = (waitToFetch: boolean = false, handleSuccess?: () => void): {
  data: Array<SmartAccount>;
  loading: boolean;
  error: unknown;
  startPolling: (pollInterval: number) => void;
  forceStopPolling: () => void;
  isSuccess: boolean;
} => {
  const { loginAuthenticator } = useAbstraxionAccount();
  const [shouldFetch, setShouldFetch] = useState(!waitToFetch);
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_DEFAULT);
  const { abstractAccount, setAbstractAccount } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<SmartAccount[]>({
    queryKey: ["smartAccounts", loginAuthenticator],
    queryFn: () => numiaIndexerStrategy.fetchSmartAccounts(loginAuthenticator),
    refetchInterval: pollInterval,
    enabled: shouldFetch,
    onSuccess: (newData) => {
      if (newData?.length === 1 && !abstractAccount) {
        const node = newData[0];
        setAbstractAccount({
          ...node,
          currentAuthenticatorIndex: node.authenticators.find(
              (authenticator) => authenticator.authenticator === loginAuthenticator,
          ).authenticatorIndex,
        });
      } else if (!abstractAccount && newData?.length === 0) {
        return;
      } else if (!abstractAccount) {
        setShouldFetch(false);
        return;
      }

      setShouldFetch(false);
      setIsSuccess(true);
      handleSuccess?.();
    },
    onError: () => setShouldFetch(false),
  });

  const startPolling = (customInterval?: number) => {
    if (customInterval) {
      setPollInterval(customInterval);
    }
    setShouldFetch(true);
  };

  const forceStopPolling = () => {
    setShouldFetch(false);
  };

  return {
    data,
    loading,
    error,
    startPolling,
    forceStopPolling,
    isSuccess,
  };
};
