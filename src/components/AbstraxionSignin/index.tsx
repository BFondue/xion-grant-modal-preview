import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useStytch } from "@stytch/react";
import { get } from "@github/webauthn-json/browser-ponyfill";
import {
  Button,
  Input,
  KeplrLogo,
  MetamaskLogo,
  ModalSection,
  PasskeyIcon,
} from "../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { getHumanReadablePubkey, isMainnet } from "../../utils";
import {
  convertToStandardBase64,
  registeredCredentials,
} from "../../utils/webauthn-utils";
import okxLogo from "../../assets/okx-logo.png";
import { useSuggestChainAndConnect, WalletType } from "graz";
import OtpForm from "../OtpForm";

const okxFlag = import.meta.env.VITE_OKX_FLAG === "true";
const metamaskFlag = import.meta.env.VITE_METAMASK_FLAG === "true";
const shouldEnablePasskey = import.meta.env.VITE_PASSKEY_FLAG === "true";
const keplrFlag = import.meta.env.VITE_KEPLR_FLAG === "true";
const googleOAuthFlag = import.meta.env.VITE_GOOGLE_OAUTH_FLAG === "true";
const deploymentEnv = import.meta.env.VITE_DEPLOYMENT_ENV;

// Variable to be true if deploymentEnv is "testnet", otherwise check okxFlag for "mainnet"
const shouldEnableOkx =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && okxFlag);

const shouldEnableMetamask =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && metamaskFlag);

const shouldEnableKeplr =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && keplrFlag);

export const AbstraxionSignin = () => {
  const stytchClient = useStytch();

  const [email, setEmail] = useState("");
  const [methodId, setMethodId] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isOnOtpStep, setIsOnOtpStep] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const tokenProcessed = useRef(false);

  const { suggestAndConnect } = useSuggestChainAndConnect({
    onError: (error) => console.log("connection error: ", error),
    onSuccess: () => {
      localStorage.setItem("loginType", "");
      setConnectionType("graz");
    },
  });

  // const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { setConnectionType, setAbstraxionError, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailError("");
    let newEmail;
    if (chainInfo.chainId === "xion-testnet-1") {
      newEmail = e.currentTarget.value.toLowerCase();
    } else {
      newEmail = e.currentTarget.value.toLowerCase().trim();
    }
    setEmail(newEmail);
  };

  const EMAIL_REGEX = /\S+@\S+\.\S+/;
  const validateEmail = () => {
    if (EMAIL_REGEX.test(email) || email === "") {
      setEmailError("");
    } else {
      setEmailError("Invalid Email Format");
    }
  };

  const loginWithGoogle = useCallback(async () => {
    const origin = window.location.origin;
    const currentParams = window.location.search;
    // Take url params into consideration on grant flow cases

    const redirectUrl = `${origin}/${currentParams}`;

    await stytchClient.oauth.google.start({
      login_redirect_url: redirectUrl,
      signup_redirect_url: redirectUrl,
      // custom_scopes: (?)
    });
  }, [stytchClient]);

  const handleEmail = async () => {
    if (!email) {
      setEmailError("Please enter your email");
      return;
    }

    if (googleOAuthFlag && email.endsWith("@gmail.com") && isMainnet) {
      await loginWithGoogle();
      return;
    }

    try {
      setIsSendingEmail(true);
      setConnectionType("stytch");
      const emailRes = await stytchClient.otps.email.loginOrCreate(email, {
        login_template_id: "xion_otp",
        signup_template_id: "xion_otp_signup",
        expiration_minutes: 2,
      });
      setMethodId(emailRes.method_id);
      setIsOnOtpStep(true);
    } catch {
      setEmailError("Error sending email");
      setConnectionType("none");
    }
    setIsSendingEmail(false);
  };

  const handleOtp = async (otpCode: string) => {
    try {
      await stytchClient.otps.authenticate(otpCode, methodId, {
        session_duration_minutes: 60,
      });
      localStorage.setItem("loginType", "stytch");
    } catch {
      setOtpError("Error Verifying OTP Code");
    }
  };

  function handleKeplr() {
    if (!window.keplr) {
      alert("Please install the Keplr wallet extension");
      return;
    }
    suggestAndConnect({
      chainInfo,
      walletType: WalletType.KEPLR,
    });
  }

  async function handleOkx() {
    if (!window.okxwallet) {
      alert("Please install the OKX wallet extension");
      return;
    }
    try {
      await window.okxwallet.keplr.enable(chainInfo.chainId);
      const okxAccount = await window.okxwallet.keplr.getKey(chainInfo.chainId);
      const authenticator = getHumanReadablePubkey(okxAccount.pubKey);
      setConnectionType("okx");
      localStorage.setItem("loginType", "okx");
      localStorage.setItem("loginAuthenticator", authenticator);
      localStorage.setItem("okxXionAddress", okxAccount.bech32Address);
      localStorage.setItem("okxWalletName", okxAccount.name);
    } catch {
      setAbstraxionError("OKX wallet connect error");
    }
  }

  async function handleMetamask() {
    if (!window.ethereum) {
      alert("Please install the Metamask wallet extension");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const primaryAccount = accounts[0];
      setConnectionType("metamask");
      localStorage.setItem("loginType", "metamask");
      localStorage.setItem("loginAuthenticator", primaryAccount);
    } catch {
      setAbstraxionError("Metamask connect error");
    }
  }

  const getPasskey = async () => {
    try {
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: registeredCredentials(),
          userVerification: "preferred",
        },
      };

      const publicKeyCredential = await get(options);
      if (!publicKeyCredential) throw new Error("Error getting webauthn key");
      setConnectionType("passkey");
      localStorage.setItem(
        "loginAuthenticator",
        convertToStandardBase64(publicKeyCredential.id),
      );
      localStorage.setItem("loginType", "passkey");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const authenticateUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      if (token && !tokenProcessed.current) {
        tokenProcessed.current = true;
        try {
          await stytchClient.oauth.authenticate(token, {
            session_duration_minutes: 60,
          });
          localStorage.setItem("loginType", "stytch");
        } catch {
          setAbstraxionError("Google OAuth authentication failed");
        } finally {
          // Only delete oauth token related params
          urlParams.delete("token");
          urlParams.delete("stytch_token_type");
          const newUrl = urlParams.toString()
            ? `${window.location.origin}?${urlParams.toString()}`
            : `${window.location.origin}`;
          window.history.replaceState(null, "", newUrl);
        }
      }
    };

    authenticateUser();
  }, []);

  return (
    <ModalSection className="!ui-justify-center ui-mb-20 sm:ui-mb-0">
      {isOnOtpStep ? (
        <>
          <div className="ui-flex ui-flex-col ui-w-full ui-text-center">
            <h1 className="ui-w-full ui-leading-[38.40px] ui-tracking-tighter ui-text-3xl ui-font-light ui-text-white ui-uppercase ui-mb-3">
              Input 6 digit code
            </h1>
            <h2 className="ui-w-full ui-mb-4 ui-text-center ui-text-sm ui-font-normal ui-leading-tight ui-text-white/50">
              Please check your email for the verification code
            </h2>
          </div>
          <OtpForm
            error={otpError}
            setError={setOtpError}
            handleOtp={handleOtp}
            handleResendCode={handleEmail}
          />
        </>
      ) : (
        <>
          <div className="ui-flex ui-flex-col ui-w-full ui-text-center ui-font-akkuratLL">
            <h1 className="ui-w-full ui-leading-[38.40px] ui-tracking-tighter ui-text-3xl ui-font-light ui-text-white ui-uppercase ui-mb-3">
              Welcome
            </h1>
            <h2 className="ui-w-full ui-mb-4 ui-text-center ui-text-sm ui-font-normal ui-leading-tight ui-text-white/50">
              Log in or sign up with your email
            </h2>
          </div>
          <Input
            baseInputClassName="!ui-text-[16px]"
            placeholder="Email address"
            value={email}
            onChange={handleEmailChange}
            error={emailError}
            onBlur={validateEmail}
            onKeyDown={(e) => e.key === "Enter" && handleEmail()}
          />
          <div className="ui-flex ui-flex-col ui-gap-1 ui-w-full">
            <Button
              fullWidth={true}
              onClick={handleEmail}
              disabled={!!emailError || isSendingEmail}
            >
              Log in / Sign up
            </Button>
            {googleOAuthFlag ? (
              <Button
                fullWidth={true}
                onClick={loginWithGoogle}
                structure="outlined"
              >
                Log in with Google
              </Button>
            ) : null}
          </div>
          {shouldEnableOkx || shouldEnableMetamask ? (
            <div className="ui-w-full ui-mb-12 sm:ui-mb-0">
              <button
                className="ui-flex ui-text-white ui-text-sm ui-w-full ui-items-center ui-gap-3"
                onClick={() => setShowAdvanced((showAdvanced) => !showAdvanced)}
              >
                <span>Advanced Options</span>
                {/* Down Caret */}
                <div
                  className={`ui-h-1.5 ui-w-1.5 ${
                    showAdvanced ? "-ui-rotate-[135deg]" : "ui-rotate-45"
                  }  ui-border-white ui-border-r-[1px] ui-border-b-[1px]`}
                />
              </button>
              {showAdvanced ? (
                <div className="ui-flex ui-flex-col ui-w-full ui-gap-2">
                  <p className="ui-my-4 ui-text-sm ui-text-white ui-opacity-50">
                    Log into your existing XION Meta account with a crypto
                    wallet
                  </p>
                  {shouldEnableOkx ? (
                    <Button
                      fullWidth={true}
                      onClick={handleOkx}
                      structure="outlined"
                    >
                      <img
                        src={okxLogo}
                        height={82}
                        width={50}
                        alt="OKX Logo"
                      />
                    </Button>
                  ) : null}
                  {shouldEnableKeplr ? (
                    <Button
                      fullWidth={true}
                      onClick={handleKeplr}
                      structure="outlined"
                    >
                      <KeplrLogo />
                    </Button>
                  ) : null}
                  {shouldEnableMetamask ? (
                    <Button
                      fullWidth={true}
                      onClick={handleMetamask}
                      structure="outlined"
                    >
                      <MetamaskLogo />
                    </Button>
                  ) : null}
                  {shouldEnablePasskey ? (
                    <Button
                      className="ui-relative ui-rounded-md"
                      fullWidth={true}
                      onClick={getPasskey}
                      structure="outlined"
                    >
                      <span className="ui-absolute ui-top-0 ui-right-0 ui-bg-neutral-500 ui-text-white ui-text-xs ui-font-bold ui-px-1 ui-py-0.5 ui-rounded-[.28rem]">
                        BETA
                      </span>
                      <PasskeyIcon />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </ModalSection>
  );
};
