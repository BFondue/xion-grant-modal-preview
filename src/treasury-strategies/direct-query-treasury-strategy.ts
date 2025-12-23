import type { AAClient } from "../signers";
import type { TreasuryConfig, TreasuryStrategy } from "./types";
import type {
  GrantConfigByTypeUrl,
  GrantConfigTypeUrlsResponse,
  TreasuryParams,
  TreasuryParamsChain,
} from "../types/treasury-types";
import { parseTreasuryParams } from "../types/treasury-types";
import { isUrlSafe } from "../utils/url";

/**
 * Direct Query Treasury Strategy
 * Fetches treasury configurations directly from the smart contract
 * This is the legacy/fallback approach
 */
export class DirectQueryTreasuryStrategy implements TreasuryStrategy {
  async fetchTreasuryConfig(
    treasuryAddress: string,
    client: AAClient,
  ): Promise<TreasuryConfig | null> {
    try {
      // Query all grant config type URLs
      const queryTreasuryContractMsg = {
        grant_config_type_urls: {},
      };

      const queryAllTypeUrlsResponse = (await client.queryContractSmart(
        treasuryAddress,
        queryTreasuryContractMsg,
      )) as GrantConfigTypeUrlsResponse;

      if (!queryAllTypeUrlsResponse || queryAllTypeUrlsResponse.length === 0) {
        console.debug("No grant configs found in treasury contract");
        return null;
      }

      // Query each grant config by type URL
      const grantConfigs: GrantConfigByTypeUrl[] = await Promise.all(
        queryAllTypeUrlsResponse.map(async (typeUrl) => {
          const queryByMsg = {
            grant_config_by_type_url: {
              msg_type_url: typeUrl,
            },
          };

          const grantConfig: GrantConfigByTypeUrl =
            await client.queryContractSmart(treasuryAddress, queryByMsg);

          if (!grantConfig || !grantConfig.description) {
            throw new Error(`Invalid grant config for type URL: ${typeUrl}`);
          }

          return grantConfig;
        }),
      );

      // Query params
      const params = await this.fetchTreasuryParams(client, treasuryAddress);

      return {
        grantConfigs,
        params,
      };
    } catch (error) {
      console.error("Direct query treasury strategy failed:", error);
      return null;
    }
  }

  /**
   * Fetch treasury params directly from contract
   */
  private async fetchTreasuryParams(
    client: AAClient,
    treasuryAddress: string,
  ): Promise<TreasuryParams> {
    try {
      const queryParams = { params: {} };
      const chainParams = (await client.queryContractSmart(
        treasuryAddress,
        queryParams,
      )) as TreasuryParamsChain;

      // Validate URLs for security
      const validatedChainParams: TreasuryParamsChain = {
        redirect_url: isUrlSafe(chainParams.redirect_url)
          ? chainParams.redirect_url
          : "",
        icon_url: isUrlSafe(chainParams.icon_url) ? chainParams.icon_url : "",
        metadata: chainParams.metadata || "{}",
      };
      return parseTreasuryParams(validatedChainParams);
    } catch (error) {
      console.warn("Error querying treasury params:", error);
      // Return safe defaults
      return {
        display_url: undefined,
        redirect_url: "",
        icon_url: "",
        metadata: {},
      };
    }
  }
}
