import React from "react";

type OtpCode = [string, string, string, string, string, string];

interface OtpInputProps {
  otp: OtpCode;
  otpError: string | null;
  inputRefs: React.RefObject<Array<HTMLInputElement | null>>;
  handleInputChange: (value: string, index: number) => void;
  handlePaste: (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => void;
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({
  otp,
  otpError,
  inputRefs,
  handleInputChange,
  handlePaste,
  handleKeyDown,
}) => {
  return (
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
    </div>
  );
};

export default OtpInput;
