import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../../ui";
import { AddAuthenticatorsForm } from "./AddAuthenticatorsForm";

export default function AddAuthenticatorsModal({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog modal onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="ui-flex ui-flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        closeButton
      >
        <AddAuthenticatorsForm setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}
