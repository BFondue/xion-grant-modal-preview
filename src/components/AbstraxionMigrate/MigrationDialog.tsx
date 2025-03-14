import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  BaseButton,
} from "../ui";
import { Accordion } from "../ui/accordion";
import { getPromotedFeatures } from "../../types/migration-features";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCodeId: number;
  targetCodeId: number;
  onUpgrade: () => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  open,
  onOpenChange,
  targetCodeId,
  onUpgrade,
}) => {
  const migrationFeatures = getPromotedFeatures(targetCodeId);

  const accordionItems = migrationFeatures.map((feature) => ({
    title: feature.title,
    children: feature.description,
    expandable: true,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeButton>
        <DialogHeader>
          <DialogTitle className="ui-text-center">Account Upgrade</DialogTitle>
          <DialogDescription className="ui-text-center">
            We have recently upgraded our accounts. You will need to accept the
            upgrade to get new account features.
          </DialogDescription>
        </DialogHeader>

        <div>
          <h3 className="ui-text-lg ui-font-medium ui-mb-4">
            New upgrade features:
          </h3>
          <Accordion items={accordionItems} />
        </div>

        <DialogFooter>
          <div className="ui-p-4 ui-bg-transparent ui-border ui-border-warning ui-rounded-lg ui-text-warning ui-text-sm">
            If you don&apos;t migrate nothing will change, but you will not get
            the new account features.
          </div>
          <BaseButton onClick={onUpgrade} className="ui-w-full">
            MIGRATE
          </BaseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
