import type { UserRecord } from "firebase-admin/auth";
import type { FirebaseApp } from "firebase/app";

declare global {
  // eslint-disable-next-line
  namespace Vike {
    interface PageContext {
      user?: UserRecord | null;
    }
    interface Config {
      firebaseApp?: FirebaseApp;
    }
  }
}

export {};
