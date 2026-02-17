export interface Permission {
  label: string;
  description?: string;
  expandable: boolean;
}

export type ModalState = "approve" | "loading" | "success" | "error" | "security-warning";

export interface SecurityWarningData {
  /** The URL the user is actually being redirected to */
  redirectUrl: string;
  /** The URL registered in the treasury contract */
  registeredUrl: string;
}

export interface GrantModalProps {
  appName: string;
  appIconUrl: string;
  appDomain: string;
  permissions: Permission[];
  expiresIn: string;
  walletAddress: string;
  state: ModalState;
  securityWarning?: SecurityWarningData;
  onAllow: () => void;
  onDeny: () => void;
}
