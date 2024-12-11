import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui";

type OtpCode = [string, string, string, string, string, string];

interface OtpFormProps {
  handleOtp: (string) => void;
  handleResendCode: () => void;
}

const OtpForm: React.FC<OtpFormProps> = ({ handleOtp, handleResendCode }) => {
  const [otp, setOtp] = useState<OtpCode>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  const getOtp = () => {
    return otp.join("");
  };

  async function submitOtp(e: React.UIEvent) {
    e.preventDefault();
    setIsSubmitted(true);
    try {
      await handleOtp(getOtp());
    } catch {
      setIsSubmitted(false);
      setOtpError("Error Verifying OTP Code");
    }
  }

  async function submitResendCode(e: React.UIEvent) {
    e.preventDefault();
    try {
      await handleResendCode();
      setTimeLeft(60);
    } catch {
      setOtpError("Error Resending OTP Code");
    }
  }

  const isOtpValid =
    otp.every((digit) => /^\d$/.test(digit)) && otp.length === 6;

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
      submitOtp(e);
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

  return (
    <div className="ui-flex ui-flex-col ui-items-center ui-gap-4">
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
              digit ? "ui-bg-[rgba(255,255,255,0.1)]" : "ui-bg-transparent"
            }  ${
              otpError
                ? "ui-border-inputError !ui-text-inputError ui-bg-inherit focus:!ui-border-inputError"
                : ""
            }`}
          />
        ))}
      </div>
      <p className="ui-mt-2 ui-text-center ui-text-inputError">{otpError}</p>
      <Button
        fullWidth={true}
        onClick={submitOtp}
        disabled={!isOtpValid || isSubmitted}
      >
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
          onClick={submitResendCode}
          disabled={!!timeLeft}
        >
          Resend Code {timeLeft && `in ${timeLeft} seconds`}
        </Button>
      )}
    </div>
  );
};

export default OtpForm;
