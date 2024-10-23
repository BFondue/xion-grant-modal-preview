import { gql } from "@apollo/client";
import { SMART_ACCOUNT_FRAGMENT } from "./fragments";

export const AllSmartWalletQueryByIdAndTypeAndAuthenticator = gql`
  ${SMART_ACCOUNT_FRAGMENT}
  query ($id: String!, $type: String!, $authenticator: String!) {
    smartAccounts(
      filter: {
        id: { equalTo: $id }
        authenticators: {
          some: {
            authenticator: { equalTo: $authenticator }
            type: { equalTo: $type }
          }
        }
      }
    ) {
      nodes {
        authenticators {
          nodes {
            ...SmartAccountFragment
          }
        }
      }
    }
  }
`;
