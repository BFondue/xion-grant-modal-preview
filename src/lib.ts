import { StytchHeadlessClient } from "@stytch/vanilla-js/headless";
import { getEnvStringOrThrow } from "./utils";

const stytchOptions = {
  endpointOptions: {
    dfppaDomain: "stytchauth.burnt.com",
  },
};

console.log("public token", import.meta.env.VITE_DEFAULT_STYTCH_PUBLIC_TOKEN);

export const stytchClient = new StytchHeadlessClient(
  getEnvStringOrThrow(
    "VITE_DEFAULT_STYTCH_PUBLIC_TOKEN",
    import.meta.env.VITE_DEFAULT_STYTCH_PUBLIC_TOKEN,
  ),
  stytchOptions,
);
