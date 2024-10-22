import axios from "axios";
import { IndexerStrategy, SmartAccount } from "./types";
import { AllSmartWalletQueryResponse } from "../utils/queries";

export class SubqueryIndexerStrategy implements IndexerStrategy {
  constructor(private readonly indexerUrl: string) {}

  async fetchSmartAccounts(
    loginAuthenticator: string,
  ): Promise<SmartAccount[]> {
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

    return data.data.smartAccounts.nodes.map((node) => {
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
  }
}
