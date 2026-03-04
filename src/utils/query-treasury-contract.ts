// Import utilities from @burnt-labs/account-management
import {
  DENOM_DECIMALS,
  DENOM_DISPLAY_MAP,
  formatCoins,
  formatXionAmount,
  CosmosAuthzPermission,
  createCompositeTreasuryStrategy,
  type TreasuryContractResponse,
  type PermissionDescription,
} from "@burnt-labs/account-management";
import { DAODAO_TREASURY_INDEXER_URL, TREASURY_API_URL } from "../config";

// Re-export for backward compatibility
export {
  DENOM_DECIMALS,
  DENOM_DISPLAY_MAP,
  formatCoins,
  formatXionAmount,
  CosmosAuthzPermission,
};

// Re-export xion.js types directly
export type { TreasuryContractResponse, PermissionDescription };

// Create treasury strategy once at module level (singleton pattern)
// This uses xion.js implementation with DaoDao indexer + direct query fallback
// Used by LoginGrantApproval for grant generation
export const treasuryStrategy = createCompositeTreasuryStrategy({
  daodao: {
    indexerUrl: DAODAO_TREASURY_INDEXER_URL,
  },
  includeDirectQuery: true, // Fallback to RPC if indexer fails
});

/**
 * Queries the treasury worker API to get treasury permissions and parameters
 *
 * @param contractAddress - The address for the deployed treasury contract instance
 * @returns The human-readable permission descriptions and treasury parameters
 */
export const queryTreasuryContract = async (
  contractAddress?: string,
): Promise<TreasuryContractResponse> => {
  if (!contractAddress) {
    throw new Error("Missing contract address");
  }

  const response = await fetch(
    `${TREASURY_API_URL}/treasury/${contractAddress}`,
  );

  if (!response.ok) {
    throw new Error(
      `Treasury query failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};
