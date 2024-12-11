import React, { useContext, useState } from "react";
import { Button, Input } from "../../../ui";
import { useStytch } from "@stytch/react";
import OtpForm from "../../../OtpForm";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../../../AbstraxionContext";
// import { useStytchUser } from "@stytch/react";

export function AddEmail({ onSuccess }: { onSuccess: (string) => void }) {
  const [email, setEmail] = useState("");
  const [methodId, setMethodId] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const stytch = useStytch();
  const session_jwt = stytch.session.getTokens()?.session_jwt;
  const session_token = stytch.session.getTokens()?.session_token;

  console.log({ session_jwt, session_token });

  const { setConnectionType } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const handleEmail = async () => {
    try {
      const { method_id } = await stytch.otps.email.send(email, {
        login_template_id: "xion_otp",
        signup_template_id: "xion_otp_signup",
        expiration_minutes: 2,
      });
      setMethodId(method_id);
      setIsCodeSent(true);
    } catch (error) {
      console.error("Error sending verification code:", error);
    }
  };

  const handleOtp = async (otp: string) => {
    try {
      const { session_jwt } = await stytch.otps.authenticate(otp, methodId, {
        session_duration_minutes: 60,
      });
      setConnectionType("stytch");
      localStorage.setItem("loginType", "stytch");
      onSuccess(session_jwt);
    } catch {
      console.error("Error Verifying OTP Code");
    }
  };

  return (
    <div className="ui-flex ui-flex-col ui-gap-8 ui-items-center">
      <div className="ui-flex ui-flex-col ui-gap-2">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          ADD AUTHENTICATORS
        </h1>
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          {isCodeSent
            ? `Input the 6 digit verification code. Please check your email for the verification code`
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
        <OtpForm handleOtp={handleOtp} handleResendCode={handleEmail} />
      )}
    </div>
  );
}
