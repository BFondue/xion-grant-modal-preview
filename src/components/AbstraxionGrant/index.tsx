import React, { useCallback, useContext, useEffect, useState } from "react";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate/build/stargateclient";
import { EncodeObject } from "@cosmjs/proto-signing";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { BaseButton } from "../ui";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../../hooks";
import { generateBankGrant } from "./generateBankGrant";
import {
  ContractGrantDescription,
  generateContractGrant,
} from "./generateContractGrant";
import { generateStakeAndGovGrant } from "./generateStakeAndGovGrant";
import { FEE_GRANTER_ADDRESS } from "../../config";
import { useXionDisconnect } from "../../hooks/useXionDisconnect";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { PermissionsList } from "./PermissionsList";
import { LegacyPermissionsList } from "./LegacyPermissionsList";
import { Checkbox } from "../ui/checkbox";

import burntAvatar from "../../assets/burntAvatarCircle.png";
import { useQueryParams } from "../../hooks/useQueryParams";
import {
  PermissionDescription,
  TreasuryParams,
} from "../../types/treasury-types";
import { generateTreasuryGrants } from "../../utils/generate-treasury-grants";
import { isContractGrantConfigValid } from "../../utils/contract-grant-check";
import { validateFeeGrant } from "../../utils/validate-fee-grant";
import { queryTreasuryContract } from "../../utils/query-treasury-contract";
import { safeRedirectOrDisconnect } from "../../utils/redirect-utils";
import { CopyAddress } from "../CopyAddress";
import xionLogo from "../../assets/logo.png";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import AnimatedCheckmark from "../ui/icons/AnimatedCheck";
import FallbackImage from "../FallbackImage";
import { getDomainAndProtocol, isUrlSafe, urlsMatch } from "../../utils/url";
import { ChevronDownIcon, WarningIcon } from "../ui/icons";
import { isMainnet } from "../../config";

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

export const AbstraxionGrant = ({
  contracts,
  grantee,
  stake,
  bank,
  treasury,
  onApprove,
  onDeny: onDenyCallback,
  onError,
}: AbstraxionGrantProps) => {
  const { client, getGasCalculation } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const { redirect_uri, state } = useQueryParams(["redirect_uri", "state"]);
  const { xionDisconnect } = useXionDisconnect();
  const { chainInfo, abstraxionError, setAbstraxionError } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  // abstractAccount from context can be used as fallback when account from indexer is not yet available
  // This happens when the account is freshly created and indexer hasn't caught up

  const [inProgress, setInProgress] = useState(false);
  const [isTreasuryQueryLoading, setIsTreasuryQueryLoading] = useState(
    treasury ? true : false,
  );
  const [inCheckProgress, setInCheckProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [permissions, setPermissions] = useState<PermissionDescription[]>([]);
  const [treasuryParams, setTreasuryParams] = useState<TreasuryParams>({
    display_url: "",
    redirect_url: "",
    icon_url: "",
    is_oauth2_app: false,
  });
  const [urlMismatchConfirmed, setUrlMismatchConfirmed] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [securityRiskCollapsed, setSecurityRiskCollapsed] = useState(false);

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
      return true; // If no redirect_uri provided, consider it valid
    }

    // If it matches the configured redirect_url, it's valid
    if (urlsMatch(treasuryParams.redirect_url, redirect_uri)) {
      return true;
    }

    // If is_oauth2_app is true and redirect_uri is official OAuth2 address, it's valid
    if (
      treasuryParams.is_oauth2_app &&
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
        // If callback is provided (iframe mode), use it instead of redirect
        if (onApprove) {
          const timer = setTimeout(() => {
            onApprove();
          }, 500);
          return () => clearTimeout(timer);
        }

        // Otherwise, redirect (standalone mode)
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
      redirect_uri,
      account?.id,
      setAbstraxionError,
      xionDisconnect,
      state,
      onApprove,
    ],
  );

  const handleDeny = () => {
    // If callback is provided (iframe mode), use it instead of redirect
    if (onDenyCallback) {
      onDenyCallback();
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
    const grantMsgs = await generateTreasuryGrants(
      treasury || "",
      client,
      granter,
      grantee,
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
          sender: account?.id,
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
      feeGranter,
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
      feeGranter,
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
      // Extra check for security
      if (abstraxionError) {
        throw new Error("There's been an error. Cannot continue.");
      }

      if (!client) {
        throw new Error("no client");
      }

      if (!account) {
        throw new Error("no account");
      }

      const granter = account.id;
      const timestampThreeMonthsFromNow = BigInt(
        Math.floor(
          new Date(new Date().setMonth(new Date().getMonth() + 3)).getTime() /
            1000,
        ),
      );

      // Check if fee grant exists
      const isValidFeeGrant = await validateFeeGrant(
        chainInfo?.rest,
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

      const validFeeGranter = isValidFeeGrant ? FEE_GRANTER_ADDRESS : undefined;

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
      let errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Detect authenticator not found error and provide a more helpful message
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
      // Start 10 second cooldown
      setRetryCooldown(10);
      // Notify iframe mode about the error (but don't close, let user retry or deny)
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

  const query = useCallback(async () => {
    try {
      // Create a promise that resolves after minimum loading time (1000ms)
      const minimumLoadingTime = new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );

      const [{ permissionDescriptions, params }] = await Promise.all([
        queryTreasuryContract(treasury || "", client, account?.id),
        minimumLoadingTime,
      ]);

      setPermissions(permissionDescriptions);
      setTreasuryParams(params);
    } catch {
      setAbstraxionError(
        "Unable to load application details. Please check your connection and try again, or contact the application developer if the issue persists.",
      );
    } finally {
      setIsTreasuryQueryLoading(false);
    }
  }, [client, account?.id, treasury, setAbstraxionError]);

  useEffect(() => {
    if (client && treasury) {
      query();
    }
  }, [client, treasury, query]);

  useEffect(() => {
    const validateContracts = () => {
      setInCheckProgress(true);

      try {
        if (contracts.length > 0) {
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

  return (
    <div>
      {showSuccess ? (
        <>
          <DialogHeader>
            <DialogTitle>Login Successful!</DialogTitle>
            <DialogDescription className="ui-leading-[14px]">
              You will now be redirected to your application.
            </DialogDescription>
          </DialogHeader>
          <div className="ui-flex ui-items-center ui-justify-center ui-my-20">
            <AnimatedCheckmark />
          </div>
          <DialogFooter>
            <img
              src={xionLogo}
              alt="XION Logo"
              width="90"
              height="32"
              className="ui-mx-auto"
            />
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>3rd Party Requesting</DialogTitle>
            {isTreasuryQueryLoading ? (
              <div className="ui-mt-8 ui-flex ui-flex-col ui-items-center ui-justify-center ui-gap-4">
                <Skeleton className="ui-h-[70px] ui-w-[70px] ui-rounded-2xl" />
                <Skeleton className="ui-h-9 ui-w-32" />
              </div>
            ) : (
              <>
                {treasuryParams.icon_url || treasuryParams.redirect_url ? (
                  <div className="ui-mt-8 ui-flex ui-flex-col ui-items-center ui-justify-center ui-gap-4">
                    {treasuryParams.icon_url && (
                      <div className="ui-flex ui-items-center ui-justify-center ui-p-2.5 ui-bg-[rgba(255,255,255,0.05)] ui-w-fit ui-rounded-2xl ui-mx-auto">
                        <FallbackImage
                          src={treasuryParams.icon_url}
                          fallbackSrc={burntAvatar}
                          alt="App Icon"
                          width={70}
                          className="ui-object-cover ui-max-h-[100px]"
                        />
                      </div>
                    )}
                    {treasuryParams.redirect_url && (
                      <div className="ui-text-white ui-font-bold ui-text-base ui-leading-[16px] ui-px-3 ui-py-2.5 ui-bg-[rgba(255,255,255,0.05)] ui-rounded-lg">
                        {treasuryParams.redirect_url}
                      </div>
                    )}
                    {isOfficialOAuth2Redirect(redirect_uri) && (
                      <div className="ui-px-4 ui-py-2 ui-bg-blue-500/20 ui-border ui-border-blue-500/50 ui-rounded-lg ui-shadow-lg">
                        <span className="ui-text-blue-300 ui-font-bold ui-text-sm ui-uppercase ui-tracking-wide">
                          OAuth2 App
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ui-mb-8 ui-mt-6 ui-flex ui-flex-col ui-items-center ui-justify-center ui-gap-4">
                    <div className="ui-flex ui-items-center ui-justify-center ui-p-2.5 ui-bg-[rgba(255,255,255,0.05)] ui-w-fit ui-rounded-2xl ui-mx-auto">
                      <FallbackImage
                        src={burntAvatar}
                        fallbackSrc={burntAvatar}
                        alt="App Icon"
                        width={70}
                        className="ui-object-cover"
                      />
                    </div>
                    {isOfficialOAuth2Redirect(redirect_uri) && (
                      <div className="ui-px-4 ui-py-2 ui-bg-blue-500/20 ui-border ui-border-blue-500/50 ui-rounded-lg ui-shadow-lg">
                        <span className="ui-text-blue-300 ui-font-bold ui-text-sm ui-uppercase ui-tracking-wide">
                          OAuth2 App
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </DialogHeader>

          {account?.id && (
            <div className="ui-mt-4 ui-mb-2 ui-text-center">
              <div className="ui-text-sm ui-text-secondary-text ui-mb-2">
                Granting permissions for:
              </div>
              <div className="ui-flex ui-justify-center">
                <CopyAddress xionAddress={account.id} fullAddress={true} />
              </div>
            </div>
          )}

          {treasury ? (
            <div className="ui-py-8">
              <PermissionsList
                permissions={permissions}
                isLoading={isTreasuryQueryLoading}
              />
            </div>
          ) : (
            <>
              <h1 className="ui-text-base ui-font-bold ui-leading-[16px] ui-mb-3">
                A 3rd party would like:
              </h1>
              <div className="ui-mb-12">
                <LegacyPermissionsList
                  contracts={contracts}
                  bank={bank}
                  stake={stake}
                />
              </div>
            </>
          )}

          <DialogFooter>
            {hasUrlMismatch && !isTreasuryQueryLoading ? (
              <>
                <div className="ui-w-full ui-mb-1">
                  <div className="ui-p-4 ui-bg-[#2d1600] ui-border ui-border-[#ff9800] ui-rounded-xl ui-shadow-lg">
                    <button
                      className="ui-w-full ui-flex ui-items-center ui-justify-between ui-text-left"
                      onClick={() =>
                        setSecurityRiskCollapsed(!securityRiskCollapsed)
                      }
                    >
                      <div className="ui-flex ui-items-center ui-gap-2">
                        <WarningIcon className="ui-text-[#ff9800] ui-w-5 ui-h-5" />
                        <span className="ui-text-[#ff9800] ui-font-semibold ui-text-base">
                          Potential Security Risk
                        </span>
                      </div>
                      <span
                        className={`ui-text-[#ff9800] ui-text-lg ui-transition-transform ui-duration-200 ${
                          securityRiskCollapsed ? "ui-rotate-180" : ""
                        }`}
                      >
                        <ChevronDownIcon
                          isUp={!securityRiskCollapsed}
                          className="ui-h-5 ui-w-5"
                        />
                      </span>
                    </button>
                    {!securityRiskCollapsed && (
                      <div className="ui-mt-3">
                        <div className="ui-text-[#ffb74d] ui-text-sm ui-mb-2">
                          The URL you are connecting to:
                        </div>
                        <div className="ui-block ui-font-mono ui-text-white ui-text-base ui-font-bold ui-mb-3 ui-bg-[#3a2200] ui-px-2 ui-py-1 ui-rounded">
                          {getDomainAndProtocol(redirect_uri)}
                        </div>
                        <div className="ui-text-[#ffb74d] ui-text-sm ui-mb-2">
                          does not match the URL provided by the app developer:
                        </div>
                        <div className="ui-block ui-font-mono ui-text-white ui-text-base ui-font-bold ui-mb-3 ui-bg-[#3a2200] ui-px-2 ui-py-1 ui-rounded">
                          {getDomainAndProtocol(treasuryParams.redirect_url)}
                        </div>
                        <div className="ui-text-[#ff9800] ui-text-xs">
                          Proceed with caution, this could be a malicious link.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ui-mb-4 ui-pl-1">
                  <Checkbox
                    variant="warning"
                    checked={urlMismatchConfirmed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      // Only allow changing if not in progress or if there's an error
                      if (!inProgress || grantError) {
                        setUrlMismatchConfirmed(e.target.checked);
                        // Collapse the security risk card when confirmed
                        if (e.target.checked) {
                          setSecurityRiskCollapsed(true);
                        }
                      }
                    }}
                    disabled={inProgress && !grantError}
                    label="Confirm you want to continue"
                  />
                </div>
                {grantError && (
                  <div className="ui-w-full ui-mb-4 ui-p-4 ui-bg-red-500/10 ui-border ui-border-red-500/20 ui-rounded-xl">
                    <div className="ui-flex ui-items-center ui-gap-2 ui-mb-2">
                      <WarningIcon className="ui-text-red-500 ui-w-4 ui-h-4" />
                      <span className="ui-text-red-500 ui-font-semibold ui-text-sm">
                        Grant Failed
                      </span>
                    </div>
                    <div className="ui-text-red-400 ui-text-sm">
                      {grantError}
                    </div>
                  </div>
                )}
                <BaseButton
                  className="ui-w-full"
                  disabled={
                    inProgress ||
                    !client ||
                    isTreasuryQueryLoading ||
                    inCheckProgress ||
                    !urlMismatchConfirmed ||
                    retryCooldown > 0
                  }
                  onClick={() => {
                    setGrantError(null);
                    setRetryCooldown(0);
                    grant();
                  }}
                >
                  {inProgress ? (
                    <SpinnerV2 size="sm" color="black" />
                  ) : retryCooldown > 0 ? (
                    `RETRY IN ${retryCooldown}s`
                  ) : grantError ? (
                    "RETRY"
                  ) : (
                    "ACCEPT AND CONTINUE"
                  )}
                </BaseButton>
              </>
            ) : (
              <>
                {grantError && (
                  <div className="ui-w-full ui-mb-4 ui-p-4 ui-bg-red-500/10 ui-border ui-border-red-500/20 ui-rounded-xl">
                    <div className="ui-flex ui-items-center ui-gap-2 ui-mb-2">
                      <WarningIcon className="ui-text-red-500 ui-w-4 ui-h-4" />
                      <span className="ui-text-red-500 ui-font-semibold ui-text-sm">
                        Grant Failed
                      </span>
                    </div>
                    <div className="ui-text-red-400 ui-text-sm">
                      {grantError}
                    </div>
                  </div>
                )}
                <BaseButton
                  className="ui-w-full"
                  disabled={
                    inProgress ||
                    !client ||
                    isTreasuryQueryLoading ||
                    inCheckProgress ||
                    retryCooldown > 0
                  }
                  onClick={() => {
                    setGrantError(null);
                    setRetryCooldown(0);
                    grant();
                  }}
                >
                  {inProgress ? (
                    <SpinnerV2 size="sm" color="black" />
                  ) : retryCooldown > 0 ? (
                    `RETRY IN ${retryCooldown}s`
                  ) : grantError ? (
                    "RETRY"
                  ) : (
                    "ACCEPT AND CONTINUE"
                  )}
                </BaseButton>
              </>
            )}
            <BaseButton variant="destructive" onClick={handleDeny}>
              DENY ACCESS
            </BaseButton>
            <BaseButton variant="text" size="text" onClick={xionDisconnect}>
              SWITCH ACCOUNT
            </BaseButton>
          </DialogFooter>
        </>
      )}
    </div>
  );
};
