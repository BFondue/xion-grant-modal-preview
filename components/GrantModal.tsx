"use client";

import { useState } from "react";
import { Shield, Check, X, Loader2, Lock, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { GrantModalProps } from "@/lib/types";
import { PermissionItem } from "./PermissionItem";

function truncateAddress(address: string) {
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function ApproveState({
  appName,
  appIconUrl,
  appDomain,
  permissions,
  expiresIn,
  walletAddress,
  onAllow,
  onDeny,
}: Omit<GrantModalProps, "state">) {
  const [showAddress, setShowAddress] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <>
      {/* App Identity */}
      <div className="flex flex-col items-center text-center">
        <img
          src={appIconUrl}
          alt={appName}
          className="h-phi-2xl w-phi-2xl rounded-button"
        />
        <h2 className="mt-phi-sm text-title-lg text-text-primary">{appName}</h2>
        <div className="mt-phi-sm inline-flex items-center gap-phi-xs rounded-full border border-surface-border bg-surface-page px-phi-md py-phi-2xs">
          <Lock size={10} className="text-accent-trust" />
          <span className="text-caption text-text-muted">{appDomain}</span>
        </div>
        <p className="mt-phi-lg text-body text-text-muted">
          is requesting permissions
        </p>
      </div>

      {/* Divider */}
      <div className="my-phi-xl h-px bg-surface-border" />

      {/* Permissions */}
      <div>
        <p className="mb-phi-lg text-body text-text-secondary">
          This will allow {appName} to:
        </p>
        <div className="flex flex-col gap-phi-xs">
          {permissions.map((perm, i) => (
            <PermissionItem key={perm.label} {...perm} index={i} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-phi-lg h-px bg-surface-border" />

      {/* Actions */}
      <div className="mt-phi-lg flex flex-col items-center gap-phi-md">
        <button
          type="button"
          onClick={onAllow}
          className="h-phi-2xl w-full rounded-button bg-cta text-body-lg font-medium text-white transition-opacity duration-fast hover:opacity-90"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={onDeny}
          className="text-body text-text-secondary transition-colors duration-fast hover:text-text-primary"
        >
          Deny
        </button>
        <button
          type="button"
          className="text-caption text-text-muted transition-colors duration-fast hover:text-text-secondary"
        >
          Use a different account
        </button>
      </div>

      {/* Footer */}
      <div className="mt-phi-lg flex flex-col items-center gap-phi-xs">
        <button
          type="button"
          onClick={() => setShowAddress((v) => !v)}
          className="flex items-center gap-phi-xs transition-opacity duration-fast hover:opacity-70"
        >
          <Shield size={12} className="text-amber-600" />
          <span className="text-caption text-amber-600 font-medium">Secured by XION</span>
        </button>
        {showAddress && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-phi-xs animate-fade-in transition-opacity duration-fast hover:opacity-70"
          >
            <span className={cn("text-[12px] leading-[1.618]", copied ? "text-accent-trust" : "text-text-muted")}>
              {copied ? "Copied!" : truncateAddress(walletAddress)}
            </span>
            {copied ? (
              <CheckCheck size={12} className="text-accent-trust" />
            ) : (
              <Copy size={12} className="text-text-muted" />
            )}
          </button>
        )}
      </div>
    </>
  );
}

function LoadingState({ appName }: { appName: string }) {
  return (
    <div className="flex flex-col items-center py-phi-4xl text-center">
      <Loader2 size={42} className="animate-spin text-cta" />
      <h2 className="mt-phi-xl text-title-lg text-text-primary">
        Granting access...
      </h2>
      <p className="mt-phi-sm text-body text-text-muted">
        Confirming permissions for {appName}
      </p>
    </div>
  );
}

function SuccessState({ appName }: { appName: string }) {
  return (
    <div className="flex flex-col items-center py-phi-4xl text-center">
      <div className="flex h-phi-3xl w-phi-3xl items-center justify-center rounded-full bg-accent-trust/10">
        <Check size={32} className="text-accent-trust" />
      </div>
      <h2 className="mt-phi-xl text-title-lg text-text-primary">
        Access granted
      </h2>
      <p className="mt-phi-sm text-body text-text-muted">
        {appName} can now access your account
      </p>
    </div>
  );
}

function ErrorState({ appName }: { appName: string }) {
  return (
    <div className="flex flex-col items-center py-phi-4xl text-center">
      <div className="flex h-phi-3xl w-phi-3xl items-center justify-center rounded-full bg-accent-error/10">
        <X size={32} className="text-accent-error" />
      </div>
      <h2 className="mt-phi-xl text-title-lg text-text-primary">
        Something went wrong
      </h2>
      <p className="mt-phi-sm text-body text-text-muted">
        Could not grant access to {appName}. Please try again.
      </p>
    </div>
  );
}

export function GrantModal(props: GrantModalProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[480px] rounded-card border border-surface-border bg-surface p-phi-xl shadow-lg",
        "animate-scale-in"
      )}
    >
      {props.state === "approve" && <ApproveState {...props} />}
      {props.state === "loading" && <LoadingState appName={props.appName} />}
      {props.state === "success" && <SuccessState appName={props.appName} />}
      {props.state === "error" && <ErrorState appName={props.appName} />}
    </div>
  );
}
