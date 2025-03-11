import React, { createContext, ReactNode, useState, useEffect } from "react";
import { getEnvStringOrThrow, chainId, isMainnet } from "../../utils";
import { ChainInfo } from "@burnt-labs/constants";
import { SelectedSmartAccount } from "../../indexer-strategies/types";
import axios from "axios";
import { getChainRegistryUrl } from "../../config";
import { useQueryParams } from "../../hooks/useQueryParams";

export type ConnectionType =
  | "stytch"
  | "graz"
  | "metamask"
  | "okx"
  | "passkey"
  | "none";

export interface AbstraxionContextProps {
  connectionType: ConnectionType;
  setConnectionType: React.Dispatch<React.SetStateAction<ConnectionType>>;
  abstractAccount: SelectedSmartAccount | undefined;
  setAbstractAccount: React.Dispatch<SelectedSmartAccount>;
  abstraxionError: string;
  setAbstraxionError: React.Dispatch<React.SetStateAction<string>>;
  apiUrl: string;
  chainInfo: ChainInfo | null;
  isChainInfoLoading: boolean;
  isMainnet: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isInGrantFlow: boolean;
}

// Create a default context value to avoid undefined errors
const defaultContextValue: AbstraxionContextProps = {
  connectionType: "none",
  setConnectionType: () => {},
  abstractAccount: undefined,
  setAbstractAccount: () => {},
  abstraxionError: "",
  setAbstraxionError: () => {},
  apiUrl: "",
  chainInfo: null,
  isChainInfoLoading: true,
  isMainnet: false,
  isOpen: false,
  setIsOpen: () => {},
  isInGrantFlow: false,
};

export const AbstraxionContext =
  createContext<AbstraxionContextProps>(defaultContextValue);

export const AbstraxionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>("none");
  const [abstractAccount, setAbstractAccount] = useState<
    SelectedSmartAccount | undefined
  >(undefined);
  const [abstraxionError, setAbstraxionError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [isChainInfoLoading, setIsChainInfoLoading] = useState(true);

  const { contracts, stake, bank, grantee, treasury } = useQueryParams([
    "contracts",
    "stake",
    "bank",
    "grantee",
    "treasury",
  ]);

  const isInGrantFlow = Boolean(
    grantee && (contracts || stake || bank || treasury),
  );

  const apiUrl = getEnvStringOrThrow(
    "VITE_NEW_CONTRACT_API_URL",
    import.meta.env.VITE_NEW_CONTRACT_API_URL,
  );

  useEffect(() => {
    const fetchChainInfo = async () => {
      try {
        if (!chainId) {
          throw new Error("Chain ID is not defined");
        }
        const chainRegistryUrl = getChainRegistryUrl(chainId);

        const response = await axios.get(chainRegistryUrl);

        if (response.status === 200) {
          const chainData = response.data;
          if (typeof chainData !== "object" || chainData === null) {
            throw new Error("Invalid chain registry data");
          }

          const gasPriceStep = {
            low: Number(chainData.fees.fee_tokens[0].low_gas_price),
            average: Number(chainData.fees.fee_tokens[0].average_gas_price),
            high: Number(chainData.fees.fee_tokens[0].high_gas_price),
          };

          // Transform chain registry format to ChainInfo format
          const chainInfo: ChainInfo = {
            chainId: chainData.chain_id,
            chainName: chainData.chain_name,
            rpc: chainData.apis.rpc[0].address,
            rest: chainData.apis.rest[0].address,
            stakeCurrency: {
              coinDenom: "XION",
              coinMinimalDenom: chainData.staking.staking_tokens[0].denom,
              coinDecimals: 6,
              gasPriceStep,
            },
            bech32Config: chainData.bech32_config,
            currencies: [
              {
                coinDenom: "XION",
                coinMinimalDenom: chainData.fees.fee_tokens[0].denom,
                coinDecimals: 6,
                gasPriceStep,
              },
            ],
            feeCurrencies: [
              {
                coinDenom: "XION",
                coinMinimalDenom: chainData.fees.fee_tokens[0].denom,
                coinDecimals: 6,
                gasPriceStep,
              },
            ],
            bip44: {
              coinType: chainData.slip44,
            },
            features: ["ibc-transfer", "ibc-go", "cosmwasm"],
          };

          setChainInfo(chainInfo);
        }
      } catch (error) {
        console.error("Failed to fetch chain info", error);
        setAbstraxionError("Failed to load chain information");
      } finally {
        setIsChainInfoLoading(false);
      }
    };

    fetchChainInfo();
  }, []);

  const contextValue = {
    connectionType,
    setConnectionType,
    abstractAccount,
    setAbstractAccount,
    abstraxionError,
    setAbstraxionError,
    apiUrl,
    chainInfo,
    isChainInfoLoading,
    isMainnet: isMainnet(),
    isOpen,
    setIsOpen,
    isInGrantFlow,
  };

  return (
    <AbstraxionContext.Provider value={contextValue}>
      {children}
    </AbstraxionContext.Provider>
  );
};
