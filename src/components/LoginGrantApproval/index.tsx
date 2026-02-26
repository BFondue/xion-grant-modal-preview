import React, { useContext, useEffect, useMemo, useState } from "react";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate/build/stargateclient";
import { EncodeObject } from "@cosmjs/proto-signing";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { Button } from "../ui";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { useSmartAccount, useSigningClient } from "../../hooks";
import {
  generateBankGrant,
  generateContractGrant,
  generateStakeAndGovGrant,
  generateTreasuryGrants,
  type ContractGrantDescription,
} from "@burnt-labs/account-management";
import { FEE_GRANTER_ADDRESS, XION_API_URL } from "../../config";
import { treasuryStrategy } from "../../utils/query-treasury-contract";
import { useXionDisconnect } from "../../hooks/useXionDisconnect";
import { AuthContext, AuthContextProps } from "../AuthContext";
import { PermissionsList } from "./PermissionsList";
import { LegacyPermissionsList } from "./LegacyPermissionsList";
import { Checkbox } from "../ui/checkbox";

import burntAvatar from "../../assets/burntAvatarCircle.png";
import { useQueryParams } from "../../hooks/useQueryParams";
import { isContractGrantConfigValid } from "@burnt-labs/account-management";
import { validateFeeGrant } from "@burnt-labs/account-management";
import { useTreasuryDiscovery } from "../../hooks/useTreasuryDiscovery";
import { safeRedirectOrDisconnect } from "../../utils/redirect-utils";
import xionLogo from "../../assets/logo.png";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import AnimatedCheckmark from "../ui/icons/AnimatedCheck";
import AnimatedX from "../ui/icons/AnimatedX";
import FallbackImage from "../FallbackImage";
import {
  getDomainAndProtocol,
  isUrlSafe,
  urlsMatch,
} from "@burnt-labs/account-management";
import { ChevronDownIcon, WarningIcon, CopyIcon, CheckIcon } from "../ui/icons";
import { isMainnet } from "../../config";
import { parseTreasuryMetadata } from "../../types/treasury-types";
import { truncateAddress } from "../../utils";
import { cn } from "../../utils/classname-util";

// Inline SVG icons used only in this component
const LockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
);

interface AbstraxionGrantProps {
  contracts: ContractGrantDescription[];
  grantee: string;
  stake: boolean;
  bank: { denom: string; amount: string }[];
  treasury?: string;
  /** Optional callback when grant is approved (for iframe mode) */
  onApprove?: () => void;
  /** Optional callback when grant is denied (for iframe mode) */
  onDeny?: () => void;
  /** Optional callback when grant fails with error (for iframe mode) */
  onError?: (error: string) => void;
}

export const LoginGrantApproval = ({
  contracts,
  grantee,
  stake,
  bank,
  treasury,
  onApprove,
  onDeny: onDenyCallback,
  onError,
}: AbstraxionGrantProps) => {
  const { client, getGasCalculation } = useSigningClient();
  const { data: account } = useSmartAccount();
  const { redirect_uri, state, mode } = useQueryParams([
    "redirect_uri",
    "state",
    "mode",
  ]);
  const { xionDisconnect } = useXionDisconnect();
  const { chainInfo, abstraxionError, setAbstraxionError } = useContext(
    AuthContext,
  ) as AuthContextProps;

  const [inProgress, setInProgress] = useState(false);
  const [inCheckProgress, setInCheckProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [urlMismatchConfirmed, setUrlMismatchConfirmed] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [securityRiskCollapsed, setSecurityRiskCollapsed] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use React Query hook for treasury discovery
  const {
    data: treasuryData,
    isLoading: isTreasuryQueryLoading,
    error: treasuryError,
  } = useTreasuryDiscovery(treasury, client, account?.id);

  // Extract permissions and params from query result
  const permissions = treasuryData?.permissionDescriptions || [];
  const treasuryParams = treasuryData?.params || {
    redirect_url: "",
    icon_url: "",
    metadata: "",
  };

  // Parse metadata JSON string to object
  const parsedMetadata = useMemo(() => {
    return parseTreasuryMetadata(treasuryParams.metadata);
  }, [treasuryParams.metadata]);

  // Derive app display name and domain from redirect_url
  const appDomain = useMemo(() => {
    if (treasuryParams.redirect_url) {
      return getDomainAndProtocol(treasuryParams.redirect_url);
    }
    return undefined;
  }, [treasuryParams.redirect_url]);

  // Display name: use domain if available, fallback to "A 3rd party" for legacy flows
  const appDisplayName = appDomain || "A 3rd party";

  // Check if redirect_uri is the official OAuth2 address
  const isOfficialOAuth2Redirect = (
    uri: string | null | undefined,
  ): boolean => {
    if (!uri) return false;
    try {
      const url = new URL(uri);
      const officialOAuth2Domain = isMainnet()
        ? "oauth2.burnt.com"
        : "oauth2.testnet.burnt.com";
      return url.hostname === officialOAuth2Domain;
    } catch {
      return false;
    }
  };

  // Check if redirect_uri matches treasury params or is official OAuth2 when isOAuth2App is true
  const isRedirectUriValid = (): boolean => {
    if (!treasury || !redirect_uri || !treasuryParams.redirect_url) {
      return true;
    }

    if (urlsMatch(treasuryParams.redirect_url, redirect_uri)) {
      return true;
    }

    if (
      parsedMetadata.is_oauth2_app &&
      isOfficialOAuth2Redirect(redirect_uri)
    ) {
      return true;
    }

    return false;
  };

  const hasUrlMismatch =
    treasury &&
    !!treasuryParams.redirect_url &&
    redirect_uri &&
    !isRedirectUriValid();

  useEffect(
    function handleSuccessCallback() {
      if (showSuccess) {
        if (onApprove) {
          const timer = setTimeout(() => {
            onApprove();
          }, 500);
          return () => clearTimeout(timer);
        }

        // Popup mode: mode=popup is set by PopupController and means we must
        // close this window when done — never redirect, even if opener is lost.
        if (mode === "popup") {
          const timer = setTimeout(() => {
            if (window.opener && redirect_uri) {
              const targetOrigin = new URL(redirect_uri).origin;
              try {
                window.opener.postMessage(
                  { type: "CONNECT_SUCCESS", address: account?.id },
                  targetOrigin,
                );
              } catch {
                // opener gone — close anyway
              }
            }
            setTimeout(() => window.close(), 150);
          }, 500);
          return () => clearTimeout(timer);
        }

        if (redirect_uri) {
          const redirectTimer = setTimeout(() => {
            safeRedirectOrDisconnect(
              redirect_uri,
              setAbstraxionError,
              xionDisconnect,
              account?.id,
              true,
              state || undefined,
            );
          }, 500);

          return () => clearTimeout(redirectTimer);
        }
      }
    },
    [
      showSuccess,
      mode,
      redirect_uri,
      account?.id,
      setAbstraxionError,
      xionDisconnect,
      state,
      onApprove,
    ],
  );

  const handleDeny = () => {
    if (onDenyCallback) {
      onDenyCallback();
      return;
    }

    // Popup mode: close window (with CONNECT_REJECTED if opener is reachable)
    if (mode === "popup") {
      if (window.opener && redirect_uri) {
        const targetOrigin = new URL(redirect_uri).origin;
        try {
          window.opener.postMessage({ type: "CONNECT_REJECTED" }, targetOrigin);
        } catch {
          // opener gone
        }
      }
      setTimeout(() => window.close(), 150);
      return;
    }

    safeRedirectOrDisconnect(
      redirect_uri,
      setAbstraxionError,
      xionDisconnect,
      undefined,
      true,
      state || undefined,
    );
  };

  const grantTreasuryPermissions = async (
    granter: string,
    expiration: bigint,
    feeGranter?: string,
  ) => {
    if (!client) {
      throw new Error("Client not available");
    }

    if (!account) {
      throw new Error("Account not available");
    }

    const grantMsgs = await generateTreasuryGrants(
      treasury || "",
      client,
      granter,
      grantee,
      treasuryStrategy,
      expiration,
    );

    const deployFeeGrantMsg = {
      deploy_fee_grant: {
        authz_granter: granter,
        authz_grantee: grantee,
      },
    };

    const batchedMsgs = [
      ...grantMsgs,
      {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: account.id,
          contract: treasury,
          msg: new Uint8Array(Buffer.from(JSON.stringify(deployFeeGrantMsg))),
          funds: [],
        }),
      },
    ];

    const simmedGas = await client.simulate(
      account.id,
      batchedMsgs,
      "treasury-grant-" + expiration,
    );

    const fee = getGasCalculation(simmedGas);

    const deliverTxResponse = await client.signAndBroadcast(
      account.id,
      batchedMsgs,
      feeGranter && fee
        ? {
            ...fee,
            granter: feeGranter,
          }
        : fee || "auto",
    );

    assertIsDeliverTxSuccess({
      ...deliverTxResponse,
      gasUsed: BigInt(deliverTxResponse.gasUsed),
      gasWanted: BigInt(deliverTxResponse.gasWanted),
    });

    return;
  };

  const grantLegacyPermisssions = async (
    granter: string,
    expiration: bigint,
    feeGranter?: string,
  ) => {
    if (!client) {
      throw new Error("Client not available");
    }

    if (!account) {
      throw new Error("Account not available");
    }

    const msgs: EncodeObject[] = [];

    if (contracts.length > 0) {
      msgs.push(generateContractGrant(expiration, grantee, granter, contracts));
    }

    if (stake) {
      msgs.push(...generateStakeAndGovGrant(expiration, grantee, granter));
    }

    if (bank.length > 0) {
      msgs.push(generateBankGrant(expiration, grantee, granter, bank));
    }

    if (msgs.length === 0) {
      throw new Error("No grants to send");
    }

    const simmedGas = await client.simulate(
      account.id,
      msgs,
      "grant-" + expiration,
    );

    const fee = getGasCalculation(simmedGas);

    const deliverTxResponse = await client.signAndBroadcast(
      account.id,
      msgs,
      feeGranter && fee
        ? {
            ...fee,
            granter: feeGranter,
          }
        : fee || "auto",
    );

    assertIsDeliverTxSuccess(deliverTxResponse);
    return;
  };

  const grant = async () => {
    try {
      setInProgress(true);
      if (abstraxionError) {
        throw new Error("There's been an error. Cannot continue.");
      }

      if (!client) {
        throw new Error("no client");
      }

      if (!account) {
        throw new Error("no account");
      }

      const restUrl = chainInfo?.rest || XION_API_URL;

      const granter = account.id;
      const timestampThreeMonthsFromNow = BigInt(
        Math.floor(
          new Date(new Date().setMonth(new Date().getMonth() + 3)).getTime() /
            1000,
        ),
      );

      const feeGrantResult = await validateFeeGrant(
        restUrl,
        FEE_GRANTER_ADDRESS,
        granter,
        [
          "/cosmos.authz.v1beta1.MsgGrant",
          "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
          "/cosmwasm.wasm.v1.MsgExecuteContract",
          "/cosmwasm.wasm.v1.MsgMigrateContract",
        ],
        account.id,
      );

      console.log("[Grant] Fee grant result", feeGrantResult);

      const validFeeGranter = feeGrantResult.valid
        ? FEE_GRANTER_ADDRESS
        : undefined;

      if (treasury) {
        await grantTreasuryPermissions(
          granter,
          timestampThreeMonthsFromNow,
          validFeeGranter,
        );
      } else {
        await grantLegacyPermisssions(
          granter,
          timestampThreeMonthsFromNow,
          validFeeGranter,
        );
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("[Grant] Grant failed", {
        error,
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        // FeeGrantValidationError has a code and statusCode
        code: (error as any)?.code,
        statusCode: (error as any)?.statusCode,
      });

      let errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      if (
        errorMessage.includes("Authenticator") &&
        errorMessage.includes("not found")
      ) {
        console.error(
          "[AbstraxionGrant] Authenticator not found error - account may need to be re-created",
        );
        errorMessage =
          "Account setup incomplete. Please disconnect and try logging in again.";
      }

      setGrantError(errorMessage);
      setRetryCooldown(10);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setInProgress(false);
    }
  };

  // Handle retry cooldown countdown
  useEffect(() => {
    if (retryCooldown > 0) {
      const timer = setTimeout(() => {
        setRetryCooldown(retryCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCooldown]);

  // Handle treasury query errors
  useEffect(() => {
    if (treasuryError) {
      setAbstraxionError(
        "Unable to load application details. Please check your connection and try again, or contact the application developer if the issue persists.",
      );
    }
  }, [treasuryError, setAbstraxionError]);

  useEffect(() => {
    const validateContracts = () => {
      setInCheckProgress(true);

      try {
        if (contracts.length > 0 && account) {
          const isValid = isContractGrantConfigValid(contracts, account);

          if (!isValid) {
            setAbstraxionError(
              "Invalid app settings detected. Please reach out to the DAPP team to resolve this issue.",
            );
          }
        }
      } finally {
        setInCheckProgress(false);
      }
    };

    validateContracts();
  }, [contracts, account]);

  // Check if redirect_uri is safe when it changes
  useEffect(() => {
    if (redirect_uri) {
      if (!isUrlSafe(redirect_uri)) {
        setAbstraxionError(
          "Unsafe redirect URL detected. This URL may contain malicious content. Please contact the application developer.",
        );
      }
    }
  }, [redirect_uri, setAbstraxionError]);

  const handleCopyAddress = () => {
    if (account?.id) {
      navigator.clipboard.writeText(account.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const renderContent = () => {
    // --- Success state ---
    if (showSuccess) {
      return (
        <div className="ui-flex ui-flex-col ui-items-center ui-py-28 ui-text-center">
          <AnimatedCheckmark />
          <h2 className="ui-mt-6 ui-text-title ui-text-text-primary">
            Access granted
          </h2>
          <p className="ui-mt-1.5 ui-text-body ui-text-text-muted">
            {mode === "popup"
              ? "This window will close automatically."
              : "You will now be redirected to your application."}
          </p>
          <img
            src={xionLogo}
            alt="XION Logo"
            width="90"
            height="32"
            className="ui-mx-auto ui-mt-10 ui-brightness-0"
          />
        </div>
      );
    }

    // --- Loading state (grant in progress) ---
    if (inProgress) {
      return (
        <div className="ui-flex ui-flex-col ui-items-center ui-py-28 ui-text-center">
          <SpinnerV2 size="lg" color="black" />
          <h2 className="ui-mt-6 ui-text-title ui-text-text-primary">
            Granting access...
          </h2>
          <p className="ui-mt-1.5 ui-text-body ui-text-text-muted">
            Confirming permissions for {appDisplayName}
          </p>
        </div>
      );
    }

    // --- Error state ---
    if (grantError) {
      return (
        <div className="ui-flex ui-flex-col ui-items-center ui-py-28 ui-text-center">
          <AnimatedX />
          <h2 className="ui-mt-6 ui-text-title ui-text-text-primary">
            Something went wrong
          </h2>
          <p className="ui-mt-1.5 ui-text-body ui-text-text-muted ui-max-w-[360px]">
            {grantError}
          </p>
          <div className="ui-mt-6 ui-flex ui-flex-col ui-items-center ui-gap-2.5 ui-w-full">
            <Button
              className="ui-w-full"
              disabled={retryCooldown > 0}
              onClick={() => {
                setGrantError(null);
                setRetryCooldown(0);
                grant();
              }}
            >
              {retryCooldown > 0
                ? `RETRY IN ${retryCooldown}s`
                : "TRY AGAIN"}
            </Button>
            <Button variant="text" size="text" onClick={handleDeny}>
              Deny
            </Button>
          </div>
        </div>
      );
    }

    // --- Approve state ---
    return (
      <>
        {/* App Identity */}
        <div className="ui-flex ui-flex-col ui-items-center ui-text-center">
          {isTreasuryQueryLoading ? (
            <div className="ui-flex ui-flex-col ui-items-center ui-gap-2.5">
              <Skeleton className="ui-h-10 ui-w-10 ui-rounded-button" />
              <Skeleton className="ui-h-7 ui-w-32" />
              <Skeleton className="ui-h-5 ui-w-40" />
            </div>
          ) : (
            <>
              {isOfficialOAuth2Redirect(redirect_uri) && (
                <div className="ui-mb-1.5 ui-px-2.5 ui-py-1 ui-bg-blue-50 ui-border ui-border-blue-200 ui-rounded-lg">
                  <span className="ui-text-blue-600 ui-font-bold ui-text-caption ui-uppercase ui-tracking-wide">
                    OAuth2 App
                  </span>
                </div>
              )}
              <FallbackImage
                src={treasuryParams.icon_url || burntAvatar}
                fallbackSrc={burntAvatar}
                alt="App Icon"
                width={42}
                height={42}
                className="ui-rounded-button ui-object-cover"
              />
              <h2 className="ui-mt-1.5 ui-text-title ui-text-text-primary">
                {appDisplayName}
              </h2>
              {appDomain && (
                <div className="ui-mt-1.5 ui-inline-flex ui-items-center ui-gap-1 ui-rounded-full ui-border ui-border-surface-border ui-bg-surface-page ui-px-2.5 ui-py-0.5">
                  <LockIcon className="ui-text-accent-trust" />
                  <span className="ui-text-caption ui-text-text-muted">
                    {appDomain}
                  </span>
                </div>
              )}
              <p className="ui-mt-1.5 ui-text-body ui-text-text-muted">
                is requesting permissions
              </p>
            </>
          )}
        </div>

        <Separator className="ui-my-2.5" />

        {/* Permissions */}
        {treasury ? (
          <PermissionsList
            permissions={permissions}
            isLoading={isTreasuryQueryLoading}
            appName={appDisplayName}
          />
        ) : (
          <LegacyPermissionsList
            contracts={contracts}
            bank={bank}
            stake={stake}
            appName={appDisplayName}
          />
        )}

        <Separator className="ui-my-2.5" />

        {/* URL Mismatch Warning */}
        {hasUrlMismatch && !isTreasuryQueryLoading && (
          <>
            <div className="ui-mb-2.5">
              <div className="ui-p-4 ui-bg-amber-50 ui-border ui-border-amber-400 ui-rounded-xl ui-shadow-lg">
                <button
                  className="ui-w-full ui-flex ui-items-center ui-justify-between ui-text-left"
                  onClick={() =>
                    setSecurityRiskCollapsed(!securityRiskCollapsed)
                  }
                >
                  <div className="ui-flex ui-items-center ui-gap-1.5">
                    <WarningIcon className="ui-text-amber-600 ui-w-5 ui-h-5" />
                    <span className="ui-text-amber-600 ui-font-semibold ui-text-body-lg">
                      Potential Security Risk
                    </span>
                  </div>
                  <ChevronDownIcon
                    isUp={!securityRiskCollapsed}
                    className="ui-h-5 ui-w-5 ui-text-amber-600"
                  />
                </button>
                {!securityRiskCollapsed && (
                  <div className="ui-mt-2.5">
                    <div className="ui-text-amber-700 ui-text-body ui-mb-1.5">
                      The URL you are connecting to:
                    </div>
                    <div className="ui-block ui-font-mono ui-text-text-primary ui-text-body ui-font-bold ui-mb-2.5 ui-bg-amber-100 ui-px-1.5 ui-py-1 ui-rounded">
                      {getDomainAndProtocol(redirect_uri)}
                    </div>
                    <div className="ui-text-amber-700 ui-text-body ui-mb-1.5">
                      does not match the URL provided by the app developer:
                    </div>
                    <div className="ui-block ui-font-mono ui-text-text-primary ui-text-body ui-font-bold ui-mb-2.5 ui-bg-amber-100 ui-px-1.5 ui-py-1 ui-rounded">
                      {getDomainAndProtocol(treasuryParams.redirect_url)}
                    </div>
                    <div className="ui-text-amber-600 ui-text-caption">
                      Proceed with caution, this could be a malicious link.
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ui-mb-2.5 ui-pl-1">
              <Checkbox
                variant="warning"
                checked={urlMismatchConfirmed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!inProgress || grantError) {
                    setUrlMismatchConfirmed(e.target.checked);
                    if (e.target.checked) {
                      setSecurityRiskCollapsed(true);
                    }
                  }
                }}
                disabled={inProgress && !grantError}
                label="Confirm you want to continue"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="ui-mt-2.5 ui-flex ui-flex-col ui-items-center ui-gap-2.5">
          <Button
            className="ui-w-full"
            disabled={
              isTreasuryQueryLoading ||
              !client ||
              inCheckProgress ||
              (hasUrlMismatch ? !urlMismatchConfirmed : false)
            }
            onClick={() => {
              grant();
            }}
          >
            Allow
          </Button>
          <Button variant="text" size="text" onClick={handleDeny}>
            Deny
          </Button>
          <Button
            variant="text"
            size="text"
            className="ui-text-caption ui-text-text-muted"
            onClick={xionDisconnect}
          >
            Use a different account
          </Button>
        </div>

        {/* Footer — Secured by XION + wallet address */}
        <div className="ui-mt-4 ui-flex ui-flex-col ui-items-center ui-gap-1">
          <button
            type="button"
            onClick={() => setShowAddress((v) => !v)}
            className="ui-flex ui-items-center ui-gap-1 ui-transition-opacity ui-duration-fast hover:ui-opacity-70"
          >
            <ShieldIcon className="ui-text-amber-700" />
            <span className="ui-text-caption ui-text-amber-700 ui-font-medium">
              Secured by XION
            </span>
          </button>
          {showAddress && account?.id && (
            <button
              type="button"
              onClick={handleCopyAddress}
              className="ui-flex ui-items-center ui-gap-1 ui-animate-fade-in ui-transition-opacity ui-duration-fast hover:ui-opacity-70"
            >
              <span
                className={cn(
                  "ui-text-caption",
                  copied ? "ui-text-accent-trust" : "ui-text-text-muted",
                )}
              >
                {copied ? "Copied!" : truncateAddress(account.id)}
              </span>
              {copied ? (
                <CheckIcon color="#0D9488" />
              ) : (
                <CopyIcon color="#71717A" width={10} height={12} />
              )}
            </button>
          )}
        </div>
      </>
    );
  };

  return <div className="ui-animate-scale-in">{renderContent()}</div>;
};
