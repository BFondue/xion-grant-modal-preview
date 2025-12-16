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
  retry: () => void;
} => {
  const { loginAuthenticator } = useAbstraxionAccount();
  const [shouldFetch, setShouldFetch] = useState(!waitToFetch);
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_DEFAULT);
  const { abstractAccount } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset shouldFetch when loginAuthenticator changes (e.g., after login)
  // This ensures we start fetching when a new authenticator is set
  useEffect(() => {
    if (loginAuthenticator && !waitToFetch) {
      console.log(
        "[baseSmartAccount] loginAuthenticator changed, enabling fetch",
      );
      setShouldFetch(true);
    }
  }, [loginAuthenticator, waitToFetch]);

  // Update shouldFetch when waitToFetch changes
  useEffect(() => {
    setShouldFetch(!waitToFetch);
  }, [waitToFetch]);

  // Debug logging
  console.log("[baseSmartAccount] Hook state:", {
    loginAuthenticator: loginAuthenticator
      ? loginAuthenticator.substring(0, 20) + "..."
      : null,
    shouldFetch,
    waitToFetch,
    hasAbstractAccount: !!abstractAccount,
  });

  const queryKey: QueryKey = ["smartAccounts", loginAuthenticator];
  const query = useQuery<
    SmartAccountWithCodeId[],
    unknown,
    SmartAccountWithCodeId[]
  >({
    queryKey,
    queryFn: async () => {
      console.log(
        "[baseSmartAccount] Fetching smart accounts for:",
        loginAuthenticator,
      );
      const result =
        await indexerStrategy.fetchSmartAccounts(loginAuthenticator);
      console.log(
        "[baseSmartAccount] Fetched smart accounts:",
        result?.length || 0,
        "accounts",
      );
      return result;
    },
    refetchInterval: pollInterval,
    enabled: shouldFetch && Boolean(loginAuthenticator),
    // Add retry configuration with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const startPolling = (customInterval?: number) => {
    if (customInterval) {
      setPollInterval(customInterval);
    }
    setShouldFetch(true);
  };

  // Don't automatically stop fetching on error - let retry logic handle it
  // Users can manually retry if needed

  useEffect(() => {
    const { data } = query;
    console.log(
      "[baseSmartAccount] Effect triggered - data:",
      data?.length || 0,
      "accounts, abstractAccount:",
      !!abstractAccount,
      "shouldFetch:",
      shouldFetch,
    );

    // Only stop fetching when:
    // 1. We have an abstractAccount selected (success case), OR
    // 2. We got empty data (no accounts found)
    if (abstractAccount) {
      // Account is selected, stop polling
      console.log("[baseSmartAccount] AbstractAccount set, stopping fetch");
      setShouldFetch(false);
      setIsSuccess(true);
      handleSuccess?.();
    } else if (data?.length === 0) {
      // No accounts found, keep shouldFetch as is (will continue polling)
      console.log("[baseSmartAccount] No accounts found, continuing to poll");
      return;
    } else if (data && data.length > 0) {
      console.log(
        "[baseSmartAccount] Accounts fetched but no abstractAccount yet, waiting for selection",
      );
    }
    // If data exists but no abstractAccount yet, keep fetching so IframeApp can pick up the accounts
  }, [query.data, abstractAccount]);

  return {
    data: query.data || [],
    loading: query.isLoading,
    error: query.error,
    startPolling,
    isSuccess,
    retry: query.refetch,
  };
};
