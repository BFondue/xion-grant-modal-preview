import type {
  GrantConfigByTypeUrl,
  TreasuryParams,
} from "../types/treasury-types";
import type { AAClient } from "../signers";

/**
 * Represents the complete treasury configuration including grant configs and parameters
 */
export interface TreasuryConfig {
  grantConfigs: GrantConfigByTypeUrl[];
  params: TreasuryParams;
}

/**
 * Strategy interface for fetching treasury configurations
 * Different strategies can fetch from different sources (indexer, direct query, etc.)
 */
export interface TreasuryStrategy {
  /**
   * Fetch treasury configuration for a given contract address
   * @param treasuryAddress The treasury contract address
   * @param client The Cosmos client for querying chain data
   * @returns Treasury configuration or null if not found/failed
   */
  fetchTreasuryConfig(
    treasuryAddress: string,
    client: AAClient,
  ): Promise<TreasuryConfig | null>;
}
