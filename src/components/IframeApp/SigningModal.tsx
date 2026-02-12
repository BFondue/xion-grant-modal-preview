import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  BaseButton,
} from "../ui";
import { ChevronRightIcon } from "../ui/icons/ChevronRight";
import { useState } from "react";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import { ZKEmailAuthenticatorStatus } from "../ModalViews/AddAuthenticators/ZKEmailAuthenticatorStatus";
import { useZKEmailSigningStatus } from "../../hooks/useZKEmailSigningStatus";
import { CONNECTION_METHOD, type ConnectionMethod } from "../../auth/useAuthState";

interface TransactionData {
  messages: Array<{
    typeUrl: string;
    value: any;
  }>;
  fee: {
    amount: Array<{
      denom: string;
      amount: string;
    }>;
    gas: string;
    granter?: string;
    payer?: string;
  };
  memo?: string;
}

interface SigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionData | null;
  onApprove: () => Promise<void>;
  onReject: () => void;
  /** When ZKEmail, zk-email signing status is shown during signing */
  connectionMethod?: ConnectionMethod;
}

export function SigningModal({
  isOpen,
  onClose,
  transaction,
  onApprove,
  onReject,
  connectionMethod,
}: SigningModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const zkEmailStatus = useZKEmailSigningStatus(connectionMethod === CONNECTION_METHOD.ZKEmail);

  if (!transaction) return null;

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="md:ui-max-w-2xl">
        <div className="ui-p-0 ui-flex ui-flex-col ui-gap-8 ui-max-h-full ui-h-full">
          <DialogHeader>
            <DialogTitle>Sign Transaction</DialogTitle>
            <DialogDescription>
              Review and approve the transaction below.
            </DialogDescription>
          </DialogHeader>

          {zkEmailStatus && (
            <ZKEmailAuthenticatorStatus
              phase={zkEmailStatus.phase}
              message={zkEmailStatus.message}
              detail={zkEmailStatus.detail}
            />
          )}

          <div className="ui-flex ui-flex-col ui-gap-8">
            <div className="ui-h-[1px] ui-w-full ui-bg-border" />

            {/* Transaction Messages */}
            <div className="ui-flex ui-flex-col ui-gap-5 ui-p-5 ui-rounded-lg ui-bg-black/50">
              <h5 className="ui-text-sm ui-font-bold">Transaction Messages</h5>
              {transaction.messages.map((msg: any, index: number) => (
                <div key={index} className="ui-flex ui-flex-col ui-gap-2">
                  <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
                    <h6 className="ui-text-sm ui-text-secondary-text">Type</h6>
                    <p className="ui-text-sm ui-font-bold ui-font-mono ui-text-xs">
                      {msg.typeUrl}
                    </p>
                  </div>
                  <div className="ui-flex ui-flex-col ui-gap-2">
                    <h6 className="ui-text-sm ui-text-secondary-text">
                      Details
                    </h6>
                    <pre className="ui-text-xs ui-font-mono ui-bg-black/30 ui-p-3 ui-rounded ui-overflow-x-auto ui-max-h-48">
                      {JSON.stringify(msg.value, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="ui-h-[1px] ui-w-full ui-bg-border" />

            {/* Fee Details */}
            <div className="ui-flex ui-flex-col ui-gap-5 ui-p-5 ui-rounded-lg ui-bg-black/50">
              <h5 className="ui-text-sm ui-font-bold">Fee Details</h5>

              <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
                <h6 className="ui-text-sm">Gas Limit</h6>
                <p className="ui-text-sm ui-font-bold ui-font-mono">
                  {transaction.fee.gas}
                </p>
              </div>

              <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
                <h6 className="ui-text-sm">Fee Amount</h6>
                <p className="ui-text-sm ui-font-bold ui-font-mono">
                  {transaction.fee.amount
                    .map((a: any) => `${a.amount} ${a.denom.toUpperCase()}`)
                    .join(", ")}
                </p>
              </div>

              {transaction.fee.granter && (
                <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
                  <h6 className="ui-text-sm">Paid By (Treasury)</h6>
                  <p className="ui-text-sm ui-font-bold ui-font-mono ui-text-green-400">
                    {transaction.fee.granter.slice(0, 12)}...
                    {transaction.fee.granter.slice(-8)}
                  </p>
                </div>
              )}
            </div>

            {transaction.memo && (
              <>
                <div className="ui-h-[1px] ui-w-full ui-bg-border" />
                <div className="ui-flex ui-flex-col ui-gap-5 ui-p-5 ui-rounded-lg ui-bg-black/50">
                  <div className="ui-flex ui-items-start ui-justify-between ui-gap-2 ui-flex-wrap">
                    <h5 className="ui-text-sm">Memo</h5>
                    <p className="ui-text-sm ui-font-bold ui-max-w-[70%] ui-break-words ui-text-end">
                      {transaction.memo}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="ui-flex ui-gap-3">
            <BaseButton
              variant="secondary"
              size="icon-large"
              onClick={onReject}
              disabled={isLoading}
            >
              <div className="ui-flex ui-items-center ui-justify-center">
                <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
                <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
              </div>
            </BaseButton>
            <BaseButton
              onClick={handleApprove}
              className="ui-w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <SpinnerV2 size="sm" color="black" />
              ) : (
                "APPROVE & SIGN"
              )}
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
