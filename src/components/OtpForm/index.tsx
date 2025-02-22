import React, { useEffect, useRef, useState } from "react";
import { BaseButton } from "../ui";
import { cn } from "../../utils/classname-util";
import SpinnerV2 from "../ui/icons/SpinnerV2";

type OtpCode = [string, string, string, string, string, string];

interface OtpFormProps {
  handleOtp: (string) => void;
  handleResendCode: () => void;
  error: string | null;
  setError: (error: string) => void;
}

const OtpForm: React.FC<OtpFormProps> = ({
  handleOtp,
  handleResendCode,
  error,
  setError,
}) => {
  const [otp, setOtp] = useState<OtpCode>(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (error) {
      setIsSubmitted(false);
      // Focus the first empty input or the first input if all are filled
      const firstEmptyIndex = otp.findIndex((digit) => digit === "") ?? 0;
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  }, [error, otp]);

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
      setError("Error Verifying OTP Code");
    }
  }

  async function submitResendCode(e: React.UIEvent) {
    e.preventDefault();
    setIsSubmitted(false);
    try {
      await handleResendCode();
      setTimeLeft(60);
    } catch {
      setError("Error Resending OTP Code");
    }
  }

  const isOtpValid =
    otp.every((digit) => /^\d$/.test(digit)) && otp.length === 6;

  const handleInputChange = (value: string, index: number) => {
    setError(null);
    setIsSubmitted(false);

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
    setError(null);
    setIsSubmitted(false);

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
    <div
      className={cn("ui-flex ui-flex-col ui-items-center ui-gap-12 ui-w-full", {
        "ui-gap-6": error,
      })}
    >
      <div className="ui-grid ui-grid-cols-6 ui-gap-3 ui-w-fit ui-mx-auto">
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
            disabled={isSubmitted}
            className={cn(
              // Base styles - dimensions, text, border
              "ui-no-spinner ui-w-full ui-h-12 ui-text-center ui-text-white ui-text-[28px] ui-font-bold ui-border ui-rounded-lg",
              // Focus states and responsive styles
              "ui-outline-none ui-border-border focus:ui-border-border-focus ui-p-2.5 sm:ui-h-14 sm:ui-w-14 sm:ui-text-2xl ui-bg-transparent",
              // Active/filled state styling
              { "ui-bg-white/5": digit },
              // Error state styling
              {
                "ui-border-destructive !ui-text-destructive ui-bg-inherit focus:!ui-border-destructive":
                  error,
              },
              // Submitted state styling
              { "ui-opacity-50": isSubmitted },
            )}
          />
        ))}
      </div>
      <div className="ui-w-full ui-flex ui-flex-col ui-gap-3">
        <p className="ui-text-center ui-text-destructive">{error}</p>
        <BaseButton onClick={submitOtp} disabled={!isOtpValid || isSubmitted}>
          {isSubmitted ? <SpinnerV2 size="sm" color="black" /> : "CONFIRM"}
        </BaseButton>
        {timeLeft ? (
          <div
            className={cn(
              "ui-text-sm ui-text-inactive ui-w-full ui-text-center ui-leading-none ui-py-1",
              { "ui-opacity-50": isSubmitted },
            )}
          >
            RESEND {`IN ${timeLeft}S`}
          </div>
        ) : (
          <BaseButton
            onClick={submitResendCode}
            disabled={!!timeLeft}
            variant="text"
            size="text"
          >
            RESEND CODE {timeLeft && `in ${timeLeft} seconds`}
          </BaseButton>
        )}
      </div>
    </div>
  );
};

export default OtpForm;
