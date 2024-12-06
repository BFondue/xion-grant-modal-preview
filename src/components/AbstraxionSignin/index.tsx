import React, {
  UIEvent,
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
import { getHumanReadablePubkey } from "../../utils";
import {
  convertToStandardBase64,
  registeredCredentials,
} from "../../utils/webauthn-utils";
import okxLogo from "../../assets/okx-logo.png";
import { useSuggestChainAndConnect, WalletType } from "graz";

type OtpCode = [string, string, string, string, string, string];

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
  const [otp, setOtp] = useState<OtpCode>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const tokenProcessed = useRef(false);

  const { suggestAndConnect } = useSuggestChainAndConnect({
    onError: (error) => console.log("connection error: ", error),
    onSuccess: () => {
      localStorage.setItem("loginType", "");
      setConnectionType("graz");
    },
  });

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  const handleInputChange = (value: string, index: number) => {
    setOtpError(null);

    if (value === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp as OtpCode);
      return;
    }

    // Only allow digits
    if (/^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp as OtpCode);

      // Move focus to the next input if available
      if (index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const isOtpValid =
    otp.every((digit) => /^\d$/.test(digit)) && otp.length === 6;

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // Move to the previous input if the current input is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        handleInputChange("", index);
      }
    }

    if (e.key === "Enter" && isOtpValid) {
      handleOtp(e);
    }
  };

  const handlePaste = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();

    const pastedData = await navigator.clipboard.readText();
    // Only allow digits to be pasted
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = [...otp];
    const pastedDigits = pastedData.split("").slice(0, otp.length - index);

    pastedDigits.forEach((digit, i) => {
      newOtp[index + i] = digit;
      if (inputRefs.current[index + i]) {
        inputRefs.current[index + i]!.value = digit;
      }
    });

    setOtp(newOtp as OtpCode);

    const nextIndex = index + pastedDigits.length;
    if (nextIndex < otp.length) {
      inputRefs.current[nextIndex]?.focus();
    }
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

  const handleEmail = async (event) => {
    event.preventDefault();

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
      setTimeLeft(60);
    } catch {
      setEmailError("Error sending email");
      setConnectionType("none");
    }
    setIsSendingEmail(false);
  };

  const getOtp = () => {
    return otp.join("");
  };

  const handleOtp = async (event: UIEvent) => {
    event.preventDefault();

    try {
      await stytchClient.otps.authenticate(getOtp(), methodId, {
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
          window.history.replaceState(
            null,
            "",
            `${window.location.origin}?${urlParams.toString()}`,
          );
        }
      }
    };

    authenticateUser();
  }, []);

  // For the "resend otp" countdown
  useEffect(() => {
    if (timeLeft === 0) {
      setTimeLeft(null);
    }
    if (!timeLeft) return;
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

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
          <div className="ui-flex ui-flex-col">
            <div className="ui-grid ui-grid-cols-6 ui-gap-2 ui-w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="number"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  onChange={(e) => handleInputChange(e.target.value, index)}
                  onPaste={(e) => handlePaste(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`ui-no-spinner ui-w-full ui-h-12 ui-text-center ui-text-white ui-text-base ui-border ui-rounded-md ui-outline-none ui-border-gray-500 focus:ui-border-gray-200 focus:ui-border-2 ui-p-2 sm:ui-h-14 sm:ui-text-lg ${
                    digit
                      ? "ui-bg-[rgba(255,255,255,0.1)]"
                      : "ui-bg-transparent"
                  }  ${
                    otpError
                      ? "ui-border-inputError !ui-text-inputError ui-bg-inherit focus:!ui-border-inputError"
                      : ""
                  }`}
                />
              ))}
            </div>
            <p className="ui-mt-2 ui-text-center ui-text-inputError">
              {otpError}
            </p>
          </div>
          <div className="ui-flex ui-w-full ui-flex-col ui-items-center ui-gap-4">
            <Button fullWidth={true} onClick={handleOtp} disabled={!isOtpValid}>
              Confirm
            </Button>

            {timeLeft ? (
              <div className="ui-text-sm ui-text-inactive">
                RESEND {`IN ${timeLeft}S`}
              </div>
            ) : (
              <Button
                className="ui-mt-2"
                structure="outlined"
                fullWidth={true}
                onClick={handleEmail}
                disabled={!!timeLeft}
              >
                Resend Code {timeLeft && `in ${timeLeft} seconds`}
              </Button>
            )}
          </div>
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
            onKeyDown={(e) => e.key === "Enter" && handleEmail(e)}
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
