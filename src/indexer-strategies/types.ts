export interface Authenticator {
  id: string;
  type: string;
  authenticator: string;
  authenticatorIndex: number;
}

export interface SmartAccount {
  id: string;
  authenticators: Authenticator[];
}

export interface SelectedSmartAccount extends SmartAccount {
  currentAuthenticatorIndex: number;
}

export interface IndexerStrategy {
  fetchSmartAccounts(loginAuthenticator: string): Promise<SmartAccount[]>;
}
