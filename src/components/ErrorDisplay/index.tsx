import React, { useContext } from "react";
import {
  BaseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { ErrorIcon } from "../ui/icons/Error";

export const ErrorDisplay = ({
  title = "OOPS! Something went wrong...",
  description = "Please try again later.",
  errorMessage,
  onClose,
  buttonText = "Close",
  onButtonClick,
}: {
  title?: string;
  description?: string;
  errorMessage?: string;
  onClose?: VoidFunction;
  buttonText?: string;
  onButtonClick?: VoidFunction;
}) => {
  const { setAbstraxionError } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose?.();
    }
    setAbstraxionError("");
  };

  return (
    <div className="ui-flex ui-h-full ui-w-full ui-flex-col ui-items-center ui-justify-center ui-gap-8">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {errorMessage && (
        <div className="ui-w-full ui-border ui-border-destructive ui-rounded-lg ui-bg-destructive/10 ui-p-4 ui-flex ui-flex-col ui-items-center ui-text-center ui-gap-3">
          <ErrorIcon />
          <span className="ui-font-bold ui-text-lg ui-leading-[21.6px]">
            Error Message
          </span>
          <p className="ui-text-base ui-font-bold">{errorMessage}</p>
        </div>
      )}

      <BaseButton className="ui-w-full" onClick={handleButtonClick}>
        {buttonText}
      </BaseButton>
    </div>
  );
};
