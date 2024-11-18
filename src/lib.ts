import { StytchHeadlessClient } from "@stytch/vanilla-js/headless";
import { getEnvStringOrThrow } from "./utils";

export const stytchClient = new StytchHeadlessClient(
  getEnvStringOrThrow(
    "VITE_DEFAULT_STYTCH_PUBLIC_TOKEN",
    import.meta.env.VITE_DEFAULT_STYTCH_PUBLIC_TOKEN,
  ),
);
