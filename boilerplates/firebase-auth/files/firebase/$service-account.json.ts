import * as console from "node:console";
import { type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const firebaseAccountStringified = process.env.TEST_FIREBASE_ACCOUNT;
  if (!firebaseAccountStringified) {
    if (process.env.CI) {
      throw new Error("Must define TEST_FIREBASE_ACCOUNT");
    }
    console.warn("No TEST_FIREBASE_ACCOUNT defined");
  }

  return firebaseAccountStringified
    ? JSON.parse(firebaseAccountStringified)
    : {
        type: "",
        project_id: "",
        private_key_id: "",
        private_key: "",
        client_email: "",
        client_id: "",
        auth_uri: "",
        token_uri: "",
        auth_provider_x509_cert_url: "",
        client_x509_cert_url: "",
        universe_domain: "",
      };
}
