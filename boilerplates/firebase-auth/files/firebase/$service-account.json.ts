export default async function getPackageJson() {
  const firebaseAccountStringified = process.env.TEST_FIREBASE_ACCOUNT;

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
