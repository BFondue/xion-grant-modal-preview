// Import utilities from @burnt-labs/account-management
import {
  DENOM_DECIMALS,
  DENOM_DISPLAY_MAP,
  formatCoins,
  formatXionAmount,
  CosmosAuthzPermission,
  createCompositeTreasuryStrategy,
  queryTreasuryContractWithPermissions,
  type TreasuryContractResponse,
  type PermissionDescription,
} from "@burnt-labs/account-management";
import type { AAClient } from "@burnt-labs/signers";
import { DAODAO_TREASURY_INDEXER_URL, USDC_DENOM } from "../config";

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
export const treasuryStrategy = createCompositeTreasuryStrategy({
  daodao: {
    indexerUrl: DAODAO_TREASURY_INDEXER_URL,
  },
  includeDirectQuery: true, // Fallback to RPC if indexer fails
});

/**
 * Queries the DAPP treasury contract to parse and display requested permissions to end user
 * Now uses xion.js implementation directly for consistency across all consumers
 *
 * @param contractAddress - The address for the deployed treasury contract instance
 * @param client - Client to query RPC (AAClient implements ContractQueryClient interface)
 * @param account - Users account address
 * @returns The human-readable permission descriptions and treasury parameters
 */
export const queryTreasuryContract = async (
  contractAddress?: string,
  client?: AAClient,
  account?: string,
): Promise<TreasuryContractResponse> => {
  if (!contractAddress) {
    throw new Error("Missing contract address");
  }

  if (!client) {
    throw new Error("Missing client");
  }

  if (!account) {
    throw new Error("Missing account");
  }

  // Use xion.js queryTreasuryContractWithPermissions directly
  // AAClient implements ContractQueryClient interface required by xion.js
  // Returns TreasuryParams with metadata as JSON string (matching contract definition)
  return await queryTreasuryContractWithPermissions(
    contractAddress,
    client,
    account,
    treasuryStrategy,
    USDC_DENOM, // Pass network-specific USDC denom
  );
};
