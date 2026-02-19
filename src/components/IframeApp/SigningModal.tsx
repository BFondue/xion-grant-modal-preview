import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "../ui";
import { ChevronRightIcon } from "../ui/icons/ChevronRight";
import { useState, useEffect, useRef } from "react";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import { ZKEmailAuthenticatorStatus } from "../ModalViews/AddAuthenticators/ZKEmailAuthenticatorStatus";
import { useZKEmailSigningStatus } from "../../hooks/useZKEmailSigningStatus";
import { CONNECTION_METHOD, type ConnectionMethod } from "../../auth/useAuthState";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { getTurnstileTokenForSubmit } from "../../utils/turnstile";
import { setZKEmailTurnstileTokenProvider } from "../../auth/zk-email/zk-email-signing-status";
import { TURNSTILE_SITE_KEY } from "../../config";

interface TransactionData {
  messages: Array<{
    typeUrl: string;
    value: unknown;
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
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || connectionMethod !== CONNECTION_METHOD.ZKEmail) return;
    setZKEmailTurnstileTokenProvider(() =>
      getTurnstileTokenForSubmit({
        execute: () => turnstileRef.current?.execute?.() ?? Promise.resolve(),
        getResponse: () => turnstileRef.current?.getResponse?.() ?? "",
        getRefToken: () => turnstileTokenRef.current,
      }),
    );
    return () => {
      setZKEmailTurnstileTokenProvider(null);
    };
  }, [isOpen, connectionMethod]);

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
        <div className="ui-p-0 ui-flex ui-flex-col ui-gap-6 ui-max-h-full ui-h-full">
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

          <div className="ui-flex ui-flex-col ui-gap-6">
            <div className="ui-h-[1px] ui-w-full ui-bg-border" />

            {/* Transaction Messages */}
            <div className="ui-flex ui-flex-col ui-gap-4 ui-p-4 ui-rounded-lg ui-bg-surface-page">
              <h5 className="ui-text-label">Transaction Messages</h5>
              {transaction.messages.map((msg: { typeUrl: string; value: unknown }, index: number) => (
                <div key={index} className="ui-flex ui-flex-col ui-gap-1.5">
                  <div className="ui-flex ui-items-center ui-justify-between ui-gap-1.5">
                    <h6 className="ui-text-body ui-text-secondary-text">Type</h6>
                    <p className="ui-text-caption ui-font-bold ui-font-mono">
                      {msg.typeUrl}
                    </p>
                  </div>
                  <div className="ui-flex ui-flex-col ui-gap-1.5">
                    <h6 className="ui-text-body ui-text-secondary-text">
                      Details
                    </h6>
                    <pre className="ui-text-caption ui-font-mono ui-bg-gray-100 ui-p-2.5 ui-rounded ui-overflow-x-auto ui-max-h-48">
                      {JSON.stringify(msg.value, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="ui-h-[1px] ui-w-full ui-bg-border" />

            {/* Fee Details */}
            <div className="ui-flex ui-flex-col ui-gap-4 ui-p-4 ui-rounded-lg ui-bg-surface-page">
              <h5 className="ui-text-label">Fee Details</h5>

              <div className="ui-flex ui-items-center ui-justify-between ui-gap-1.5">
                <h6 className="ui-text-body">Gas Limit</h6>
                <p className="ui-text-label ui-font-mono">
                  {transaction.fee.gas}
                </p>
              </div>

              <div className="ui-flex ui-items-center ui-justify-between ui-gap-1.5">
                <h6 className="ui-text-body">Fee Amount</h6>
                <p className="ui-text-label ui-font-mono">
                  {transaction.fee.amount
                    .map((a: { denom: string; amount: string }) => `${a.amount} ${a.denom.toUpperCase()}`)
                    .join(", ")}
                </p>
              </div>

              {transaction.fee.granter && (
                <div className="ui-flex ui-items-center ui-justify-between ui-gap-1.5">
                  <h6 className="ui-text-body">Paid By (Treasury)</h6>
                  <p className="ui-text-label ui-font-mono ui-text-green-400">
                    {transaction.fee.granter.slice(0, 12)}...
                    {transaction.fee.granter.slice(-8)}
                  </p>
                </div>
              )}
            </div>

            {transaction.memo && (
              <>
                <div className="ui-h-[1px] ui-w-full ui-bg-border" />
                <div className="ui-flex ui-flex-col ui-gap-4 ui-p-4 ui-rounded-lg ui-bg-surface-page">
                  <div className="ui-flex ui-items-start ui-justify-between ui-gap-1.5 ui-flex-wrap">
                    <h5 className="ui-text-body">Memo</h5>
                    <p className="ui-text-label ui-max-w-[70%] ui-break-words ui-text-end">
                      {transaction.memo}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {connectionMethod === CONNECTION_METHOD.ZKEmail && TURNSTILE_SITE_KEY && (
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              options={{ size: "invisible", execution: "execute" }}
              onSuccess={(token) => {
                turnstileTokenRef.current = token;
              }}
              onError={() => {
                turnstileTokenRef.current = null;
              }}
              onExpire={() => {
                turnstileTokenRef.current = null;
              }}
            />
          )}

          <div className="ui-flex ui-gap-2.5">
            <Button
              variant="secondary"
              size="icon-large"
              onClick={onReject}
              disabled={isLoading}
            >
              <div className="ui-flex ui-items-center ui-justify-center">
                <ChevronRightIcon className="ui-fill-text-secondary ui-rotate-180 group-hover/basebutton:ui-fill-text-primary" />
                <ChevronRightIcon className="ui-fill-text-secondary ui-rotate-180 group-hover/basebutton:ui-fill-text-primary" />
              </div>
            </Button>
            <Button
              onClick={handleApprove}
              className="ui-w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <SpinnerV2 size="sm" color="black" />
              ) : (
                "APPROVE & SIGN"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
