import axios from "axios";
import { IndexerStrategy, SmartAccountWithCodeId } from "./types";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

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

export class SubqueryIndexerStrategy implements IndexerStrategy {
  constructor(private readonly indexerUrl: string) {}

  private _rpcUrl: string;

  set rpcUrl(url: string) {
    if (url && url.length > 0) {
      this._rpcUrl = url;
    } else {
      throw new Error("rpcUrl must be a non-empty string.");
    }
  }

  async fetchSmartAccounts(
    loginAuthenticator: string,
  ): Promise<SmartAccountWithCodeId[]> {
    if (!this._rpcUrl || this._rpcUrl.length === 0) {
      throw new Error("rpcUrl must be a non-empty string.");
    }

    const client = await CosmWasmClient.connect(this._rpcUrl);

    console.log("fetching smart accounts from subquery indexer");
    const { data } = await axios.post<{ data: AllSmartWalletQueryResponse }>(
      this.indexerUrl,
      {
        query: `fragment SmartAccountFragment on SmartAccountAuthenticator {
                    id
                    type
                    authenticator
                    authenticatorIndex
                    version
                  }
                  query ($authenticator: String!) {
                    smartAccounts(
                      filter: {
                        authenticators: { some: { authenticator: { equalTo: $authenticator } } }
                      }
                    ) {
                      nodes {
                        id
                        authenticators {
                          nodes {
                            ...SmartAccountFragment
                          }
                        }
                      }
                    }
                  }`,
        variables: {
          authenticator: loginAuthenticator,
        },
      },
    );

    const smartAccounts = data.data.smartAccounts.nodes.map((node) => {
      return {
        id: node.id,
        authenticators: node.authenticators.nodes.map((node) => {
          return {
            id: node.id,
            type: node.type,
            authenticator: node.authenticator,
            authenticatorIndex: node.authenticatorIndex,
          };
        }),
      };
    });

    const results: Array<SmartAccountWithCodeId> = [];
    // Doing this in serial as some might have a large number of accounts and want to avoid request limits
    for (const smartAccount of smartAccounts) {
      const { codeId } = await client.getContract(smartAccount.id);
      results.push({
        ...smartAccount,
        codeId,
      });
    }

    return results;
  }
}
