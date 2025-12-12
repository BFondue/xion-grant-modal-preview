import { IndexerStrategy, SmartAccountWithCodeId } from "./types";

interface SmartAccountAuthenticator {
  id: string;
  type: string;
  authenticator: string;
  authenticatorIndex: number;
  version: string;
  __typename: string;
}

interface SmartAccountAuthenticatorsConnection {
  nodes: SmartAccountAuthenticator[];
  __typename: string;
}

interface SmartAccount {
  id: string;
  authenticators: SmartAccountAuthenticatorsConnection;
  __typename: string;
}

interface SmartAccountsConnection {
  nodes: SmartAccount[];
  __typename: string;
}

export interface AllSmartWalletQueryResponse {
  smartAccounts: SmartAccountsConnection;
}

export class NoIndexerStrategy implements IndexerStrategy {
  constructor(private readonly baseURL: string) {}

  async fetchSmartAccounts(
    loginAuthenticator: string,
  ): Promise<SmartAccountWithCodeId[]> {
    try {
      // Validate authenticator format
      const authenticatorParts = loginAuthenticator.split(".");
      if (authenticatorParts.length < 2) {
        console.warn(
          "NoIndexerStrategy: Invalid authenticator format, expected 'aud.sub'",
        );
        return [];
      }

      const [aud, sub] = authenticatorParts;
      // NOTE: This endpoint remains on V1 as V2 doesn't have an equivalent aud/sub lookup
      // V2 requires the full JWT token for /api/v2/account/check/jwt/{jwt}
      // TODO: Consider adding a V2 endpoint for aud/sub lookup or restructure to use JWT token
      const response = await fetch(
        `${this.baseURL}/api/v1/jwt-accounts/${aud}/${sub}`,
        {},
      );

      if (!response.ok) {
        console.warn(
          `NoIndexerStrategy: Failed to fetch account, status: ${response.status}`,
        );
        return [];
      }

      const resultsJson = await response.json();

      // Validate the response has the expected structure
      if (!resultsJson || typeof resultsJson !== "object") {
        console.warn("NoIndexerStrategy: Invalid response format");
        return [];
      }

      // If the response is already an array, return it; otherwise wrap in array
      return Array.isArray(resultsJson) ? resultsJson : [resultsJson];
    } catch (error) {
      console.error("NoIndexerStrategy: Failed to fetch smart accounts", error);
      return [];
    }
  }
}
