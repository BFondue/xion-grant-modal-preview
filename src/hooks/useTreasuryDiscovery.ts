/**
 * Treasury discovery hook using React Query
 * Wraps queryTreasuryContract utility for consistent pattern with useAccountDiscovery
 */

import { useQuery } from "@tanstack/react-query";
import { queryTreasuryContract } from "../utils/query-treasury-contract";
import type { TreasuryContractResponse } from "@burnt-labs/account-management";
import type { AAClient } from "@burnt-labs/signers";

export const useTreasuryDiscovery = (
  treasuryAddress?: string,
  client?: AAClient,
  account?: string,
) => {
  return useQuery<TreasuryContractResponse>({
    queryKey: ["treasury", treasuryAddress, account],
    queryFn: async () => {
      if (!treasuryAddress || !client || !account) {
        throw new Error("Missing required parameters for treasury query");
      }
      return await queryTreasuryContract(treasuryAddress, client, account);
    },
    enabled: Boolean(treasuryAddress && client && account),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Treasury data doesn't change frequently, cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};
