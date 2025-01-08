/*
 * This component exists to dry up the two indexer hooks.
 *
 * I hate the name of this hook, should workshop a better one.
 *
 * */
import { QueryKey, useQuery } from "@tanstack/react-query";
import { useAbstraxionAccount } from "./useAbstraxionAccount";
import {
  IndexerStrategy,
  SmartAccountWithCodeId,
} from "../indexer-strategies/types";
import { useContext, useEffect, useState } from "react";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";

const POLL_INTERVAL_DEFAULT = 3000;

export const useBaseSmartAccounts = (
  indexerStrategy: IndexerStrategy,
  waitToFetch: boolean = false,
  handleSuccess?: () => void,
): {
  data: SmartAccountWithCodeId[];
  startPolling: (customInterval?: number) => void;
  loading: false | true;
  error: unknown;
  isSuccess: boolean;
} => {
  const { loginAuthenticator } = useAbstraxionAccount();
  const [shouldFetch, setShouldFetch] = useState(!waitToFetch);
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_DEFAULT);
  const { abstractAccount, setAbstractAccount } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;
  const [isSuccess, setIsSuccess] = useState(false);

  const queryKey: QueryKey = ["smartAccounts", loginAuthenticator];
  const query = useQuery<
    SmartAccountWithCodeId[],
    unknown,
    SmartAccountWithCodeId[]
  >({
    queryKey,
    queryFn: async () => {
      return await indexerStrategy.fetchSmartAccounts(loginAuthenticator);
    },
    refetchInterval: pollInterval,
    enabled: shouldFetch,
  });

  const startPolling = (customInterval?: number) => {
    if (customInterval) {
      setPollInterval(customInterval);
    }
    setShouldFetch(true);
  };

  useEffect(() => {
    if (query.error) {
      setShouldFetch(false);
    }
  }, [query.error]);

  useEffect(() => {
    const { data } = query;

    if (data?.length === 1 && !abstractAccount) {
      const node = data[0];
      setAbstractAccount({
        ...node,
        currentAuthenticatorIndex: node.authenticators.find(
          (authenticator) => authenticator.authenticator === loginAuthenticator,
        ).authenticatorIndex,
      });
    } else if (!abstractAccount && data?.length === 0) {
      return;
    } else if (!abstractAccount) {
      setShouldFetch(false);
      return;
    }

    setShouldFetch(false);
    setIsSuccess(true);
    handleSuccess?.();
  }, [query.data]);

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    startPolling,
    isSuccess,
  };
};
