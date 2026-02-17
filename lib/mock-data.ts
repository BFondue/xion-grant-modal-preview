// Grant modal mock data — Wrinkle Game preview
import { Permission, SecurityWarningData } from "./types";

export const MOCK_APP = {
  name: "Wrinkle Game",
  iconUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=wrinklegame&backgroundColor=6366f1",
  domain: "play.wrinklegame.xyz",
  expiresIn: "3 months",
  walletAddress: "xion1abc4d9ef2g8hi3jk567lm8no1pq2rs3tu4vw5x6yz7f3xyz",
};

export const MOCK_SECURITY_WARNING: SecurityWarningData = {
  redirectUrl: "http://wrinkle-game.fake.io",
  registeredUrl: "https://play.wrinklegame.xyz",
};

export const MOCK_PERMISSIONS: Permission[] = [
  {
    label: "Purchase a membership on your behalf",
    description:
      "Allows the application to charge a recurring membership fee from your account. You can cancel anytime from your account settings.",
    expandable: true,
  },
  {
    label: "Access your profile information",
    description:
      "Allows the application to read your display name and account address to personalize your membership experience.",
    expandable: true,
  },
  {
    label: "View your payment history",
    expandable: false,
  },
];
