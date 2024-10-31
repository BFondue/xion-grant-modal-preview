import React, { UIEvent, useContext, useEffect, useRef, useState } from "react";
import { useStytch } from "@stytch/react";
import { Button, Input, ModalSection, PasskeyIcon } from "@burnt-labs/ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { getHumanReadablePubkey } from "../../utils";

import okxLogo from "../../assets/okx-logo.png";
import {
  convertToStandardBase64,
  registeredCredentials,
} from "../../utils/webauthn-utils";
import { MetamaskLogo } from "../Icons";
import { get } from "@github/webauthn-json/browser-ponyfill";

type OtpCode = [string, string, string, string, string, string];

const okxFlag = import.meta.env.VITE_OKX_FLAG === "true";
const metamaskFlag = import.meta.env.VITE_METAMASK_FLAG === "true";
const shouldEnablePasskey = import.meta.env.VITE_PASSKEY_FLAG === "true";
const deploymentEnv = import.meta.env.VITE_DEPLOYMENT_ENV;

// Variable to be true if deploymentEnv is "testnet", otherwise check okxFlag for "mainnet"
const shouldEnableOkx =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && okxFlag);

const shouldEnableMetamask =
  deploymentEnv === "testnet" || (deploymentEnv === "mainnet" && metamaskFlag);

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
    console.log("input changed");
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

  const handleEmail = async (event) => {
    event.preventDefault();

    if (!email) {
      setEmailError("Please enter your email");
      return;
    }

    try {
      setIsSendingEmail(true);
      setConnectionType("stytch");
      const emailRes = await stytchClient.otps.email.loginOrCreate(email);
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
    <ModalSection className="!ui-justify-center sm:ui-py-5 sm:ui-px-7">
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
                  type="text"
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  onChange={(e) => handleInputChange(e.target.value, index)}
                  onPaste={(e) => handlePaste(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`ui-w-full ui-h-12 ui-text-center ui-text-white ui-border ui-rounded-md ui-outline-none ui-border-gray-500 focus:ui-border-gray-200 focus:ui-border-2 ui-p-2 sm:ui-h-14 sm:ui-text-lg ${
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
            <Button
              className="ui-mt-7"
              fullWidth={true}
              onClick={handleOtp}
              disabled={!isOtpValid}
            >
              Confirm
            </Button>

            {timeLeft ? (
              <div className="ui-text-sm ui-pt-3 ui-mt-3 ui-text-inactive">
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
          <Button
            fullWidth={true}
            onClick={handleEmail}
            disabled={!!emailError || isSendingEmail}
          >
            Log in / Sign up
          </Button>
          {shouldEnableOkx || shouldEnableMetamask ? (
            <div className="ui-w-full">
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
