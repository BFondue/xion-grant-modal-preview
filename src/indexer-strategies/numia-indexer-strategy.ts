import axios from "axios";
import { IndexerStrategy, SmartAccount } from "./types";

interface NumiaAuthenticatorResp {
  type: string;
  authenticator: string;
  authenticator_index: number;
}

interface NumiaSmartAccountResp {
  smart_account: string;
  authenticators: NumiaAuthenticatorResp[];
}

export class NumiaIndexerStrategy implements IndexerStrategy {
  constructor(
    private readonly baseURL: string,
    private readonly authToken,
  ) {}

  async fetchSmartAccounts(
    loginAuthenticator: string,
  ): Promise<SmartAccount[]> {
    const encodedAuthenticator = encodeURIComponent(loginAuthenticator);
    const url = `${this.baseURL}authenticators/${encodedAuthenticator}/smartAccounts/details`;
    const { data } = await axios.get<NumiaSmartAccountResp[]>(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    return data?.map(({ smart_account, authenticators }) => ({
      id: smart_account,
      authenticators: authenticators.map(
        ({ authenticator, authenticator_index, type }) => ({
          id: `${smart_account}-${authenticator_index}`,
          authenticator,
          authenticatorIndex: authenticator_index,
          type,
        }),
      ),
    }));
  }
}
