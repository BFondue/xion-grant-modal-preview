import React from "react";
import { ModalSection, Spinner } from "@burnt-labs/ui";

export const Loading = () => {
  return (
    <ModalSection>
      <div className="ui-flex ui-flex-col ui-justify-center ui-items-center ui-h-full ui-w-full">
        <div className="ui-text-white">
          <h1 className="ui-mb-3 ui-text-2xl ui-font-bold ui-tracking-tighter ui-text-center">
            Let&apos;s Go
          </h1>
          <h2 className="ui-mb-6">Starting your journey</h2>
        </div>
        <div className="ui-flex ui-w-full ui-items-center ui-justify-center ui-text-white">
          <Spinner />
        </div>
      </div>
    </ModalSection>
  );
};
