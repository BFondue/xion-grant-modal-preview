import React, { Dispatch, SetStateAction } from "react";
import { CloseIcon, Dialog, DialogClose, DialogContent } from "../../ui";
import { AddAuthenticatorsForm } from "./AddAuthenticatorsForm";

export default function AddAuthenticatorsModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent
        className="ui-text-white ui-flex ui-flex-col ui-p-12"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="ui-flex ui-justify-end ui-absolute ui-top-10 ui-right-10">
          <DialogClose className="ui-inline-flex">
            <CloseIcon className="ui-stroke-white/50 " />
          </DialogClose>
        </div>

        <AddAuthenticatorsForm setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}
