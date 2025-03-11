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
    const [aud, sub] = loginAuthenticator.split(".");
    const results = await fetch(
      `${this.baseURL}/api/v1/jwt-accounts/${aud}/${sub}`,
      {},
    );
    const resultsJson = await results.json();
    return [resultsJson];
  }
}
