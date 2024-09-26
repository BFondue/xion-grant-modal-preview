export type authenticatorTypes = "SECP256K1" | "ETHWALLET" | "JWT";

export interface AuthenticatorNodes {
  __typename: string;
  id: string;
  type: string;
  authenticator: string;
  authenticatorIndex: number;
  version: string;
}

export interface AccountAuthenticators {
  __typename: string;
  nodes: AuthenticatorNodes[];
}

export interface AbstraxionAccount {
  __typename: string;
  id: string; // bech32Address
  node: {
    authenticators: AuthenticatorNodes[];
    smart_account: string;
  };
  currentAuthenticatorIndex: number;
}

export interface useAbstraxionAccountProps {
  data?: AbstraxionAccount;
  isConnected: boolean;
  isConnecting?: boolean;
  isReconnecting?: boolean;
}
