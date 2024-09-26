import { useQuery } from "@tanstack/react-query";
import { useAbstraxionAccount } from "./useAbstraxionAccount";

import { SmartAccount } from "../indexer-strategies/types";
import { SubqueryIndexerStrategy } from "../indexer-strategies/subquery-indexer-strategy";
import { getEnvStringOrThrow } from "../utils";
import { useContext, useState } from "react";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";
import { deepEqual } from "../utils/general";

const POLL_INTERVAL_DEFAULT = 3000; // 3 seconds

const subqueryIndexerStrategy = new SubqueryIndexerStrategy(
  getEnvStringOrThrow(
    "VITE_DEFAULT_INDEXER_URL",
    import.meta.env.VITE_DEFAULT_INDEXER_URL
  )
);

export const useSubquerySmartAccounts = (
  waitToFetch: boolean = false,
  handleSuccess?: () => void
): {
  loading: boolean;
  error: unknown;
  data: Array<SmartAccount> | undefined;
  startPolling: (customInterval: number) => void;
  forceStopPolling: () => void;
  isSuccess: boolean;
} => {
  const { loginAuthenticator } = useAbstraxionAccount();

  const [shouldFetch, setShouldFetch] = useState(!waitToFetch);
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_DEFAULT);
  const { abstractAccount, setAbstractAccount } = useContext(
    AbstraxionContext
  ) as AbstraxionContextProps;
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<SmartAccount[]>({
    queryKey: ["smartAccounts", loginAuthenticator],
    queryFn: () =>
      subqueryIndexerStrategy.fetchSmartAccounts(loginAuthenticator),
    enabled: shouldFetch,
    refetchInterval: pollInterval,
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
