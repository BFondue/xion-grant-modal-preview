import React, { useEffect, useState } from "react";
import { Button, Input } from "../../../ui";
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
        header="ADDING AUTHENTICATOR..."
        message="We are adding an authenticator to your account. Don't leave the page or close the window. This will take a few seconds..."
      />
    );
  }

  return (
    <div className="ui-flex ui-flex-col ui-gap-8 ui-items-center">
      <div className="ui-flex ui-flex-col ui-gap-2">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          ADD AUTHENTICATORS
        </h1>
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          {isCodeSent
            ? `Input the 6 digit verification code. Please check your email for the verification code. You will be logged in with this account.`
            : `Enter your email to receive a verification code. Input the email
          address that you want to use as an authenticator.`}
        </p>
      </div>
      {!isCodeSent ? (
        <>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ui-w-full"
          />
          <Button className="ui-w-full" onClick={handleEmail} disabled={!email}>
            SEND VERIFICATION CODE
          </Button>
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
