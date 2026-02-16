export interface Permission {
  label: string;
  description?: string;
  expandable: boolean;
}

export type ModalState = "approve" | "loading" | "success" | "error";

export interface GrantModalProps {
  appName: string;
  appIconUrl: string;
  appDomain: string;
  permissions: Permission[];
  expiresIn: string;
  walletAddress: string;
  state: ModalState;
  onAllow: () => void;
  onDeny: () => void;
}
