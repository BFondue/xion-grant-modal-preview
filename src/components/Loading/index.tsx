import React from "react";
import {
  BaseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui";
import SpinnerV2 from "../ui/icons/SpinnerV2";

interface LoadingProps {
  header: string;
  message: string;
}

export const Loading = ({ header, message }: LoadingProps) => {
  return (
    <div className="ui-flex ui-flex-col ui-justify-center ui-items-center ui-gap-12 ui-w-full">
      <DialogHeader>
        <DialogTitle>{header}</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <div className="ui-flex ui-w-full ui-items-center ui-justify-center ui-text-white">
        <SpinnerV2 size="lg" color="white" />
      </div>

      <DialogFooter>
        <BaseButton className="ui-w-full" disabled={true}>
          SET UP AUTHENTICATOR
        </BaseButton>
      </DialogFooter>
    </div>
  );
};
