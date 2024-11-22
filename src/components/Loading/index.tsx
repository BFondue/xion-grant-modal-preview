import React from "react";
import { ModalSection, Spinner } from "../ui";

interface LoadingProps {
  header: string;
  message: string;
}

export const Loading = ({ header, message }: LoadingProps) => {
  return (
    <ModalSection>
      <div className="ui-flex ui-flex-col md:ui-p-10 ui-justify-center ui-items-center ui-h-full ui-w-full">
        <div className="ui-flex ui-w-full ui-flex-col ui-justify-center ui-items-center ui-text-white">
          <h1 className="ui-max-w-[350px] ui-mb-6 ui-text-3xl ui-font-thin ui-tracking-wide ui-text-center">
            {header}
          </h1>
          <h2 className="ui-mb-6 ui-text-white/50 ui-text-center">{message}</h2>
        </div>
        <div className="ui-flex ui-w-full ui-items-center ui-justify-center ui-text-white">
          <Spinner size="large" />
        </div>
      </div>
    </ModalSection>
  );
};
