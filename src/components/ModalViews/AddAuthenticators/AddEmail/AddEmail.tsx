import React, { useEffect, useState } from "react";
import {
  BaseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "../../../ui";
import { useStytch } from "@stytch/react";
import OtpForm from "../../../OtpForm";
import { Loading } from "../../../Loading";

export function AddEmail({
  onSubmit,
  error,
  onError,
}: {
  onSubmit: (otp: string, methodId: string) => void;
  error: string | null;
  onError: (error: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [methodId, setMethodId] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const stytch = useStytch();

  useEffect(() => {
    if (error && !isCodeSent) {
      setIsCodeSent(true);
    }
  }, [error, isCodeSent]);

  const handleEmail = async () => {
    try {
      const { method_id } = await stytch.otps.email.loginOrCreate(email, {
        login_template_id: "xion_otp",
        signup_template_id: "xion_otp_signup",
        expiration_minutes: 2,
      });
      setMethodId(method_id);
      setIsCodeSent(true);
    } catch {
      onError("Error sending verification code");
    }
  };

  const handleSubmit = async (otp: string) => {
    setIsLoading(true);
    await onSubmit(otp, methodId);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Loading
        header="Adding Authenticator"
        message="We are adding an authenticator to your account. Don't leave the page or close the window. This will take a few seconds..."
      />
    );
  }

  return (
    <div className="ui-flex ui-flex-col ui-gap-12 ui-items-center">
      <DialogHeader>
        <DialogTitle>Add Authenticator</DialogTitle>
        <DialogDescription>
          {isCodeSent
            ? `Input the 6 digit verification code. Please check your email for the verification code. You will be logged in with this account.`
            : `Enter your email to receive a verification code. Input the email
          address that you want to use as an authenticator.`}
        </DialogDescription>
      </DialogHeader>
      {!isCodeSent ? (
        <>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ui-w-full"
          />
          <BaseButton
            className="ui-w-full"
            onClick={handleEmail}
            disabled={!email}
          >
            SEND VERIFICATION CODE
          </BaseButton>
        </>
      ) : (
        <OtpForm
          handleOtp={handleSubmit}
          handleResendCode={handleEmail}
          error={error}
          setError={onError}
        />
      )}
    </div>
  );
}
