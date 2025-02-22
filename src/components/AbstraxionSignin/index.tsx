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
  BaseButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  KeplrLogo,
  MetamaskLogo,
  NavigationButton,
  PasskeyIcon,
} from "../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { getHumanReadablePubkey } from "../../utils";
import {
  convertToStandardBase64,
  registeredCredentials,
} from "../../utils/webauthn-utils";
import okxLogo from "../../assets/okx-logo.png";
import { useSuggestChainAndConnect, WalletType } from "graz";
import OtpForm from "../OtpForm";
import { GoogleLogoIcon } from "../ui/icons/GoogleLogo";
import { TikTokLogoIcon } from "../ui/icons/TikTokLogo";
import { cn } from "../../utils/classname-util";
import { ChevronRightIcon } from "../ui/icons/ChevronRight";
import SpinnerV2 from "../ui/icons/SpinnerV2";

const okxFlag = import.meta.env.VITE_OKX_FLAG === "true";
const metamaskFlag = import.meta.env.VITE_METAMASK_FLAG === "true";
const shouldEnablePasskey = import.meta.env.VITE_PASSKEY_FLAG === "true";
const keplrFlag = import.meta.env.VITE_KEPLR_FLAG === "true";
const tiktokFlag = import.meta.env.VITE_TIKTOK_FLAG === "true";
const deploymentEnv = import.meta.env.VITE_DEPLOYMENT_ENV;

// Variable to be true if deploymentEnv is "testnet", otherwise check flags for "mainnet"
const shouldEnableOkx =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && okxFlag);

const shouldEnableMetamask =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && metamaskFlag);

const shouldEnableKeplr =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && keplrFlag);

const shouldEnableTikTok = tiktokFlag;

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

  const loginWithTikTok = useCallback(async () => {
    const origin = window.location.origin;
    const currentParams = window.location.search;
    // Take url params into consideration on grant flow cases

    const redirectUrl = `${origin}/${currentParams}`;

    await stytchClient.oauth.tiktok.start({
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
          setAbstraxionError("Social authentication failed");
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
    <Dialog modal open={true} defaultOpen={true}>
      <DialogTrigger className="ui-hidden"></DialogTrigger>
      <DialogContent overApp={true} className="ui-gap-8">
        {isOnOtpStep ? (
          <>
            <DialogHeader>
              <DialogTitle>Input 6 Digit Code</DialogTitle>
              <DialogDescription>
                Please check your email for the verification code
              </DialogDescription>
            </DialogHeader>
            <OtpForm
              error={otpError}
              setError={setOtpError}
              handleOtp={handleOtp}
              handleResendCode={handleEmail}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Welcome!</DialogTitle>
              <DialogDescription>
                Log in or sign up with your email
              </DialogDescription>
            </DialogHeader>
            <div className="ui-flex ui-flex-col ui-gap-6 ui-w-full">
              <div className="ui-flex ui-flex-col ui-gap-4">
                <Input
                  baseInputClassName="!ui-text-[16px]"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                  error={emailError}
                  onBlur={validateEmail}
                  onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                />
                <BaseButton
                  onClick={handleEmail}
                  disabled={!!emailError || isSendingEmail}
                  className={"ui-mt-2"}
                >
                  {isSendingEmail ? (
                    <SpinnerV2 size="sm" color="black" />
                  ) : (
                    "LOG IN / SIGN UP"
                  )}
                </BaseButton>
              </div>
              <div className="ui-flex ui-items-center ui-justify-center ui-gap-3">
                <span className="ui-h-px ui-bg-border ui-w-full" />
                <h6 className="ui-text-xs ui-text-secondary-text">OR</h6>
                <span className="ui-h-px ui-bg-border ui-w-full" />
              </div>
              <div className="ui-flex ui-flex-col ui-gap-2">
                <NavigationButton
                  icon={<GoogleLogoIcon />}
                  onClick={loginWithGoogle}
                >
                  Google
                </NavigationButton>
                {shouldEnableTikTok && (
                  <NavigationButton
                    icon={<TikTokLogoIcon />}
                    onClick={loginWithTikTok}
                  >
                    TikTok
                  </NavigationButton>
                )}
              </div>
            </div>
            {shouldEnableOkx || shouldEnableMetamask ? (
              <div className="ui-w-full ui-mb-12 sm:ui-mb-0 ui-flex ui-flex-col ui-gap-3">
                <button
                  className="group ui-flex ui-w-full ui-items-center ui-gap-3"
                  onClick={() =>
                    setShowAdvanced((showAdvanced) => !showAdvanced)
                  }
                >
                  Advanced Options
                  <span className="ui-text-secondary-text">
                    {"(Login Only)"}
                  </span>
                  {/* Down Caret */}
                  <ChevronRightIcon
                    className={cn(
                      "ui-fill-white/50 ui-rotate-180 group-hover/base button:ui-fill-white",
                      showAdvanced ? "-ui-rotate-[90deg]" : "ui-rotate-90",
                    )}
                  />
                </button>
                {showAdvanced ? (
                  <div className="ui-flex ui-w-full ui-gap-2">
                    {shouldEnableOkx ? (
                      <BaseButton
                        variant="secondary"
                        size="icon-large"
                        onClick={handleOkx}
                      >
                        <img
                          src={okxLogo}
                          height={82}
                          width={50}
                          alt="OKX Logo"
                          className="ui-min-w-7"
                        />
                      </BaseButton>
                    ) : null}
                    {shouldEnableKeplr ? (
                      <BaseButton
                        variant="secondary"
                        size="icon-large"
                        onClick={handleKeplr}
                      >
                        <KeplrLogo className="ui-min-w-6 ui-min-h-6" />
                      </BaseButton>
                    ) : null}
                    {shouldEnableMetamask ? (
                      <BaseButton
                        variant="secondary"
                        size="icon-large"
                        onClick={handleMetamask}
                      >
                        <MetamaskLogo className="ui-min-w-6 ui-min-h-6" />
                      </BaseButton>
                    ) : null}
                    {shouldEnablePasskey ? (
                      <BaseButton
                        variant="secondary"
                        size="icon-large"
                        onClick={getPasskey}
                        className="ui-relative"
                      >
                        <span className="ui-absolute ui-top-0 ui-right-0 ui-bg-neutral-500/50 ui-text-white ui-text-[10px] ui-leading-none ui-font-bold ui-px-1 ui-py-0.5 ui-rounded-[7px] ui-rounded-br-none ui-rounded-tl-none">
                          BETA
                        </span>
                        <PasskeyIcon className="ui-min-w-6 ui-min-h-6" />
                      </BaseButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
