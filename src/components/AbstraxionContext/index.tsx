import { ReactNode, createContext, useState } from "react";
import { getEnvStringOrThrow } from "../../utils";
import { ChainInfo } from "@burnt-labs/constants";
import {SelectedSmartAccount } from "../../indexer-strategies/types";

type ConnectionType = "stytch" | "graz" | "metamask" | "okx" | "none";

export interface AbstraxionContextProps {
  connectionType: ConnectionType;
  setConnectionType: React.Dispatch<React.SetStateAction<ConnectionType>>;
  abstractAccount: SelectedSmartAccount | undefined;
  setAbstractAccount: React.Dispatch<SelectedSmartAccount>;
  abstraxionError: string;
  setAbstraxionError: React.Dispatch<React.SetStateAction<string>>;
  apiUrl: string;
  chainInfo: ChainInfo;
  isMainnet: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AbstraxionContext = createContext<AbstraxionContextProps>(
  {} as AbstraxionContextProps,
);

export const AbstraxionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>("none");
  const [abstractAccount, setAbstractAccount] = useState<any | undefined>(
    undefined,
  );
  const [abstraxionError, setAbstraxionError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const serializedChainInfo = getEnvStringOrThrow(
    "VITE_DEFAULT_CHAIN_INFO",
    import.meta.env.VITE_DEFAULT_CHAIN_INFO,
  );
  const chainInfo = JSON.parse(serializedChainInfo);
  const apiUrl = getEnvStringOrThrow(
    "VITE_DEFAULT_API_URL",
    import.meta.env.VITE_DEFAULT_API_URL,
  );
  const isMainnet =
    getEnvStringOrThrow(
      "VITE_DEPLOYMENT_ENV",
      import.meta.env.VITE_DEPLOYMENT_ENV,
    ) === "mainnet"
      ? true
      : false;

  return (
    <AbstraxionContext.Provider
      value={{
        connectionType,
        setConnectionType,
        abstractAccount,
        setAbstractAccount,
        abstraxionError,
        setAbstraxionError,
        apiUrl,
        chainInfo,
        isMainnet,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </AbstraxionContext.Provider>
  );
};
