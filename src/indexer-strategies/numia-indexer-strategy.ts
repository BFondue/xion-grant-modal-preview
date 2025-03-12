import axios from "axios";
import { IndexerStrategy, SmartAccountWithCodeId } from "./types";

interface NumiaAuthenticatorResp {
  type: string;
  authenticator: string;
  authenticator_index: number;
}

interface NumiaSmartAccountResp {
  smart_account: string;
  code_id: number;
  authenticators: NumiaAuthenticatorResp[];
}

export class NumiaIndexerStrategy implements IndexerStrategy {
  constructor(
    private readonly baseURL: string,
    private readonly authToken,
  ) {
    if (!baseURL.endsWith("/")) {
      this.baseURL = baseURL + "/";
    }

    if (!(this.baseURL.endsWith("/v2/") || this.baseURL.endsWith("/v3/"))) {
      this.baseURL = this.baseURL + "v2/";
    }
  }

  async fetchSmartAccounts(
    loginAuthenticator: string,
  ): Promise<SmartAccountWithCodeId[]> {
    // Code id is only available with version 2 of the api
    const encodedAuthenticator = encodeURIComponent(loginAuthenticator);
    const url = `${this.baseURL}authenticators/${encodedAuthenticator}/smartAccounts/details`;
    const { data } = await axios.get<NumiaSmartAccountResp[]>(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    return data?.map(({ smart_account, code_id, authenticators }) => ({
      id: smart_account,
      codeId: code_id,
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
