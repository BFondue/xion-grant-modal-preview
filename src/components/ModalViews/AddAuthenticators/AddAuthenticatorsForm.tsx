import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import { useAccount, useSuggestChainAndConnect, WalletType } from "graz";
import { create } from "@github/webauthn-json/browser-ponyfill";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import {
  Button,
  EmailIcon,
  KeplrLogo,
  MetamaskLogo,
  PasskeyIcon,
} from "../../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../../AbstraxionContext";
import { useAbstraxionSigningClient } from "../../../hooks";
import { findLowestMissingOrNextIndex } from "../../../utils/authenticator-util";
import { AAAlgo, AbstractAccountJWTSigner } from "../../../signers";
import {
  registeredCredentials,
  saveRegistration,
} from "../../../utils/webauthn-utils";
import { Loading } from "../../Loading";
import {
  AddAuthenticator,
  AddJwtAuthenticator,
} from "../../../signers/interfaces";
import { getGasCalculation } from "../../../utils/gas-utils";
import { getEnvStringOrThrow } from "../../../utils";
import { validateFeeGrant } from "../../../utils/validate-fee-grant";
import { AddEmail } from "./AddEmail/AddEmail";
import { useStytch } from "@stytch/react";

const okxFlag = import.meta.env.VITE_OKX_FLAG === "true";
const metamaskFlag = import.meta.env.VITE_METAMASK_FLAG === "true";
const shouldEnablePasskey = import.meta.env.VITE_PASSKEY_FLAG === "true";
const keplrFlag = import.meta.env.VITE_KEPLR_FLAG === "true";
const deploymentEnv = import.meta.env.VITE_DEPLOYMENT_ENV;

// Variable to be true if deploymentEnv is "testnet", otherwise check okxFlag for "mainnet"
const shouldEnableOkx =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && okxFlag);

const shouldEnableMetamask =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && metamaskFlag);

const shouldEnableKeplr =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && keplrFlag);

type AuthenticatorStates =
  | "none"
  | "keplr"
  | "metamask"
  | "okx"
  | "passkey"
  | "jwt";

interface AuthenticatorStateData {
  id: string;
  type: string;
  authenticator: string;
  authenticatorIndex: number;
}

export function AddAuthenticatorsForm({
  setIsOpen,
}: {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  // Component specific state
  const [selectedAuthenticator, setSelectedAuthenticator] =
    useState<AuthenticatorStates>("none");

  // General UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Context state
  const { abstractAccount, setAbstractAccount, chainInfo, apiUrl } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  // Hooks
  const { client } = useAbstraxionSigningClient();
  const stytch = useStytch();
  const { data: grazAccount } = useAccount();
  const { suggestAndConnect } = useSuggestChainAndConnect({
    onSuccess: async () => await addKeplrAuthenticator(),
    onError: () => setIsLoading(false),
    onLoading: () => setIsLoading(true),
  });

  // Functions
  function handleSwitch(authenticator: AuthenticatorStates) {
    setErrorMessage("");
    setSelectedAuthenticator(authenticator);
  }

  async function handleSelection() {
    setErrorMessage("");
    switch (selectedAuthenticator) {
      case "none":
        break;
      case "keplr":
        suggestAndConnect({
          chainInfo: chainInfo,
          walletType: WalletType.KEPLR,
        });
        break;
      case "metamask":
        await addEthAuthenticator();
        break;
      case "okx":
        await addOkxAuthenticator();
        break;
      case "passkey":
        await addPasskeyAuthenticator();
        break;
      case "jwt":
        setIsAddingEmail(true);
        break;
      default:
        break;
    }
  }

  function postAddFunction() {
    setIsSuccess(true);
    setIsLoading(false);
  }

  async function handleAddAuthenticator(
    msg: AddAuthenticator,
    authenticatorStateData: AuthenticatorStateData,
  ): Promise<void> {
    if (!client) {
      throw new Error("No client");
    }

    const addMsg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: abstractAccount.id,
        contract: abstractAccount.id,
        msg: new Uint8Array(Buffer.from(JSON.stringify(msg))),
        funds: [],
      }),
    };

    // Check if fee grant exists
    const feeGranterAddress = getEnvStringOrThrow(
      "VITE_FEE_GRANTER_ADDRESS",
      import.meta.env.VITE_FEE_GRANTER_ADDRESS,
    );
    const isValidFeeGrant = await validateFeeGrant(
      chainInfo.rest,
      feeGranterAddress,
      abstractAccount.id,
      [
        "/cosmos.authz.v1beta1.MsgGrant",
        "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
        "/cosmwasm.wasm.v1.MsgExecuteContract",
        "/cosmwasm.wasm.v1.MsgMigrateContract",
      ],
      abstractAccount.id,
    );

    const validFeeGranter = isValidFeeGrant ? feeGranterAddress : null;

    const simmedGas = await client.simulate(
      abstractAccount.id,
      [addMsg],
      "add-authenticator",
      validFeeGranter,
    );
    const fee = getGasCalculation(simmedGas);

    const deliverTxResponse = await client.signAndBroadcast(
      abstractAccount.id,
      [addMsg],
      validFeeGranter ? { ...fee, granter: validFeeGranter } : fee,
    );

    assertIsDeliverTxSuccess(deliverTxResponse);

    setAbstractAccount({
      ...abstractAccount,
      authenticators: [
        ...abstractAccount.authenticators,
        authenticatorStateData,
      ],
    });

    postAddFunction();
    return;
  }

  async function addJwtAuthenticator(otp: string, methodId: string) {
    try {
      const accountIndex = findLowestMissingOrNextIndex(
        abstractAccount?.authenticators,
      );
      const { session_token } = await stytch.session.getTokens();

      // Need to pass session_token to
      const authResponse = await fetch(
        `${apiUrl}/api/v1/sessions/authenticate-no-session`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            otp,
            methodId,
          }),
        },
      );
      const authResponseData = await authResponse.json();
      if (!authResponse.ok) {
        setOtpError("Error Verifying OTP Code");
        return;
      }

      const { user_id: sub, project_id: aud } = authResponseData.data;
      console.log({ sub, aud, session_token });

      const { signature } = await (
        client.abstractSigner as AbstractAccountJWTSigner
      ).signDirectArb(abstractAccount.id, session_token);

      const msg: AddJwtAuthenticator = {
        add_auth_method: {
          add_authenticator: {
            Jwt: {
              id: accountIndex,
              aud,
              sub,
              token: signature,
            },
          },
        },
      };

      const authenticatorStateData = {
        id: `${abstractAccount.id}-${accountIndex}`,
        type: "Jwt",
        authenticator: `${aud}.${sub}`,
        authenticatorIndex: accountIndex,
      };
      await handleAddAuthenticator(msg, authenticatorStateData);
      setIsAddingEmail(true);
    } catch (error) {
      console.warn(error);
      setErrorMessage("Something went wrong trying to add authenticator");
    } finally {
      setIsLoading(false);
    }
  }

  async function addKeplrAuthenticator() {
    try {
      setIsLoading(true);

      if (!window.keplr) {
        return alert("Please install Keplr extension and try again");
      }

      const encoder = new TextEncoder();
      const signArbMessage = Buffer.from(encoder.encode(abstractAccount?.id));

      const signArbRes = await window.keplr.signArbitrary(
        chainInfo.chainId,
        grazAccount?.bech32Address,
        new Uint8Array(signArbMessage),
      );

      const accountIndex = findLowestMissingOrNextIndex(
        abstractAccount?.authenticators,
      );

      const msg = {
        add_auth_method: {
          add_authenticator: {
            Secp256K1: {
              id: accountIndex,
              pubkey: signArbRes.pub_key.value,
              signature: signArbRes.signature,
            },
          },
        },
      };

      const authenticatorStateData = {
        id: `${abstractAccount.id}-${accountIndex}`,
        type: AAAlgo.secp256k1,
        authenticator: signArbRes.pub_key.value,
        authenticatorIndex: accountIndex,
      };

      await handleAddAuthenticator(msg, authenticatorStateData);
    } catch (error) {
      console.warn(error);
      setErrorMessage("Something went wrong trying to add authenticator");
    } finally {
      setIsLoading(false);
    }
  }

  async function addOkxAuthenticator() {
    try {
      setIsLoading(true);

      if (!window.okxwallet) {
        return alert("Install OKX Wallet");
      }

      const encoder = new TextEncoder();
      const signArbMessage = Buffer.from(encoder.encode(abstractAccount?.id));

      await window.okxwallet.keplr.enable(chainInfo.chainId);
      const okxAccount = await window.okxwallet.keplr.getKey(chainInfo.chainId);
      const signArbRes = await window.okxwallet.keplr.signArbitrary(
        chainInfo.chainId,
        okxAccount.bech32Address,
        new Uint8Array(signArbMessage),
      );

      const accountIndex = findLowestMissingOrNextIndex(
        abstractAccount?.authenticators,
      );

      const msg = {
        add_auth_method: {
          add_authenticator: {
            Secp256K1: {
              id: accountIndex,
              pubkey: signArbRes.pub_key.value,
              signature: signArbRes.signature,
            },
          },
        },
      };

      const authenticatorStateData = {
        id: `${abstractAccount.id}-${accountIndex}`,
        type: AAAlgo.secp256k1,
        authenticator: okxAccount.bech32Address,
        authenticatorIndex: accountIndex,
      };

      await handleAddAuthenticator(msg, authenticatorStateData);
    } catch (error) {
      console.warn(error);
      setErrorMessage("Something went wrong trying to add authenticator");
    } finally {
      setIsLoading(false);
    }
  }

  async function addEthAuthenticator() {
    try {
      setIsLoading(true);

      if (!window.ethereum) {
        return alert("Please install wallet extension");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const primaryAccount = accounts[0];

      const challenge = `0x${Buffer.from(abstractAccount?.id, "utf8").toString("hex")}`;

      const ethSignature = await window.ethereum.request<string>({
        method: "personal_sign",
        params: [challenge, primaryAccount],
      });

      const base64Signature = Buffer.from(
        ethSignature.slice(2),
        "hex",
      ).toString("base64");

      const accountIndex = findLowestMissingOrNextIndex(
        abstractAccount?.authenticators,
      );

      const msg = {
        add_auth_method: {
          add_authenticator: {
            EthWallet: {
              id: accountIndex,
              address: primaryAccount,
              signature: base64Signature,
            },
          },
        },
      };

      const authenticatorStateData = {
        id: `${abstractAccount.id}-${accountIndex}`,
        type: AAAlgo.ETHWALLET,
        authenticator: primaryAccount,
        authenticatorIndex: accountIndex,
      };

      await handleAddAuthenticator(msg, authenticatorStateData);
    } catch (error) {
      console.warn(error);
      setErrorMessage("Something went wrong trying to add authenticator");
    } finally {
      setIsLoading(false);
    }
  }

  async function addPasskeyAuthenticator() {
    try {
      setIsLoading(true);

      const challenge = Buffer.from(abstractAccount?.id);
      let RP_URL = window.location.href;
      // Contract throws if there is a trailing "/" in the RP url
      if (RP_URL.endsWith("/")) {
        RP_URL = RP_URL.slice(0, -1);
      }

      const options: CredentialCreationOptions = {
        publicKey: {
          rp: {
            name: RP_URL,
          },
          user: {
            name: abstractAccount.id,
            displayName: abstractAccount.id,
            id: new Uint8Array(challenge),
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          challenge,
          authenticatorSelection: { userVerification: "preferred" },
          timeout: 300000, // 5 minutes,
          excludeCredentials: registeredCredentials(abstractAccount.id),
        },
      };

      const publicKeyCredential = await create(options);
      if (publicKeyCredential === null) {
        console.log("null credential");
        return;
      }
      // stringify the credential
      const publicKeyCredentialJSON = JSON.stringify(publicKeyCredential);

      // base64 encode it
      const base64EncodedCredential = Buffer.from(
        publicKeyCredentialJSON,
      ).toString("base64");

      const accountIndex = findLowestMissingOrNextIndex(
        abstractAccount?.authenticators,
      );

      const msg = {
        add_auth_method: {
          add_authenticator: {
            Passkey: {
              id: accountIndex,
              url: RP_URL,
              credential: base64EncodedCredential,
            },
          },
        },
      };

      const authenticatorStateData = {
        id: `${abstractAccount.id}-${accountIndex}`,
        type: AAAlgo.ETHWALLET,
        authenticator: base64EncodedCredential,
        authenticatorIndex: accountIndex,
      };

      await handleAddAuthenticator(msg, authenticatorStateData);
      saveRegistration(abstractAccount.id, publicKeyCredential);
    } catch (error) {
      console.warn(error);
      if (error instanceof DOMException) {
        if (
          error.message.includes(
            "The user attempted to register an authenticator that contains one of the credentials already registered with the relying party.",
          )
        ) {
          alert("Authenticator already registered");
        }
      } else {
        // Handle non-DOMExceptions
        console.error("An unexpected error occurred:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Loading
        header="ADDING AUTHENTICATOR..."
        message="We are adding an authenticator to your account. Don't leave the page or close the window. This will take a few seconds..."
      />
    );
  }

  if (isAddingEmail) {
    return (
      <AddEmail
        onSubmit={addJwtAuthenticator}
        error={otpError}
        onError={setOtpError}
      />
    );
  }

  return (
    <div className="ui-p-0 md:ui-p-8 ui-flex ui-flex-col ui-gap-8 ui-items-center">
      <div className="ui-flex ui-flex-col ui-gap-2">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          ADD AUTHENTICATORS
        </h1>
        {isSuccess ? (
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
            Successfully added authenticator to account. Please click continue
            to navigate back to home page.
          </p>
        ) : errorMessage ? (
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-red-500">
            {errorMessage}
          </p>
        ) : (
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
            Enhance your account&apos;s security by adding authenticators.
            Select from the following options.
          </p>
        )}
      </div>
      {!isSuccess ? (
        <>
          {/* <Button
            className="!ui-no-underline !ui-text-sm !ui-p-0 ui-max-w-max"
            onClick={() => setIsOpen(false)}
            structure="naked"
          >
            SKIP FOR NOW
          </Button> */}
          <div className="ui-flex ui-gap-4 ui-w-full ui-justify-center">
            <Button
              className={
                selectedAuthenticator === "jwt" ? "!ui-border-white" : ""
              }
              onClick={() => handleSwitch("jwt")}
              structure="outlined"
            >
              <EmailIcon />
            </Button>
            {shouldEnableKeplr ? (
              <Button
                className={
                  selectedAuthenticator === "keplr" ? "!ui-border-white" : ""
                }
                onClick={() => handleSwitch("keplr")}
                structure="outlined"
              >
                <KeplrLogo />
              </Button>
            ) : null}
            {shouldEnableMetamask ? (
              <Button
                className={
                  selectedAuthenticator === "metamask" ? "!ui-border-white" : ""
                }
                disabled={!shouldEnableMetamask}
                onClick={() => handleSwitch("metamask")}
                structure="outlined"
              >
                <MetamaskLogo className="ui-w-12" />
              </Button>
            ) : null}
            {shouldEnableOkx ? (
              <Button
                className={
                  selectedAuthenticator === "okx" ? "!ui-border-white" : ""
                }
                disabled={!shouldEnableOkx}
                onClick={() => handleSwitch("okx")}
                structure="outlined"
              >
                <img
                  src="/okxWallet.png"
                  height={48}
                  width={48}
                  alt="OKX Logo"
                />
              </Button>
            ) : null}
            {shouldEnablePasskey ? (
              <Button
                className={`ui-relative ${selectedAuthenticator === "passkey" ? "!ui-border-white" : ""}`}
                disabled={!shouldEnablePasskey}
                onClick={() => handleSwitch("passkey")}
                structure="outlined"
              >
                <span className="ui-absolute ui-top-0 ui-right-0 ui-bg-neutral-500 ui-text-white ui-text-xs ui-font-bold ui-px-1 ui-py-0.5 ui-rounded-[.28rem]">
                  BETA
                </span>
                <PasskeyIcon className="ui-w-12" />
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
      {isSuccess ? (
        <Button className="ui-mt-4 ui-w-full" onClick={() => setIsOpen(false)}>
          CONTINUE
        </Button>
      ) : (
        <Button
          className="ui-mt-4 ui-w-full"
          disabled={selectedAuthenticator === "none"}
          onClick={handleSelection}
        >
          SET UP AUTHENTICATOR
        </Button>
      )}
    </div>
  );
}
