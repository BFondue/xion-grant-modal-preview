import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { mockEnvironmentVariables } from "./utils";
import { UserEvent } from "@testing-library/user-event";

mockEnvironmentVariables({
  VITE_TIKTOK_FLAG: "true",
  VITE_DEPLOYMENT_ENV: "testnet",
});

/**
 * Standard mock for Stytch authentication service
 * @returns A mock Stytch object with common methods
 */
export function createStytchMock() {
  return {
    oauth: {
      google: {
        start: vi.fn().mockResolvedValue(undefined),
      },
    },
    otps: {
      email: {
        loginOrCreate: vi.fn().mockResolvedValue({
          method_id: "test-method-id",
          status_code: 200,
        }),
      },
      authenticate: vi.fn().mockResolvedValue({
        status_code: 200,
        session: {
          session_token: "test-session-token",
        },
      }),
    },
    session: {
      getSync: vi.fn().mockReturnValue({
        session_token: "test-session-token",
      }),
      authenticate: vi.fn().mockResolvedValue({
        status_code: 200,
        session: {
          session_token: "test-session-token",
        },
      }),
    },
    webauthn: {
      register: {
        start: vi.fn().mockResolvedValue({
          status_code: 200,
          method_id: "test-webauthn-method-id",
        }),
        authenticate: vi.fn().mockResolvedValue({
          status_code: 200,
          session: {
            session_token: "test-session-token",
          },
        }),
      },
    },
  };
}

/**
 * Helper to fill OTP inputs with a code
 * @param code The OTP code to fill (default: '123456')
 */
export async function fillOtpInputs(user: UserEvent, code = "123456") {
  const otpInputs = screen.getAllByRole("spinbutton");
  for (let i = 0; i < Math.min(otpInputs.length, code.length); i++) {
    await user.type(otpInputs[i], code[i]);
  }
}
