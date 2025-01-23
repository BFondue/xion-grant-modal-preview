import React, { useState } from "react";
import type { InputHTMLAttributes } from "react";

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix">;

export interface ITextFieldProps extends BaseInputProps {
  className?: string;
  error?: string;
  baseInputClassName?: string;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => false | Promise<void>;
}
export function Input({
  className,
  placeholder,
  // This should only be used for specific classes that can't override the base input styles.
  baseInputClassName,
  value,
  error,
  onBlur,
  onKeyDown,
  ...props
}: ITextFieldProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleFocus = () => {
    setIsInputFocused(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (event.target.value === "") {
      setIsInputFocused(false);
    }
    onBlur?.(event);
  };

  return (
    <div className={`ui-relative ui-w-full ui-text-left ${className || ""}`}>
      <label
        className={`ui-relative ui-z-0 ui-w-auto ui-transition-all ui-duration-100 ui-ease-in-out ${
          isInputFocused || value
            ? "ui-top-2 ui-text-xs ui-leading-tight ui-text-[#949494]"
            : "ui-top-7 ui-text-[#6C6A6A]"
        }`}
      >
        {placeholder}
      </label>
      <input
        {...props}
        className={`${
          baseInputClassName || ""
        } ui-z-10 ui-block ui-h-8 ui-w-full ui-border-b ui-border-[#949494] ui-rounded-none ui-relative ${
          error ? "ui-border-red-400" : ""
        } ui-bg-transparent ui-font-akkuratLL ui-py-5 !ui-text-base ui-text-zinc-100 ui-font-normal ui-leading-tight ui-outline-none`}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={onKeyDown}
        style={{
          WebkitBorderRadius: "none",
        }}
        value={value}
      />
      {error ? (
        <p className="ui-left-0 -ui-bottom-6 ui-text-xs ui-leading-tight ui-absolute ui-text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
