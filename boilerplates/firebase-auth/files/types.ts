import type { UserRecord } from "firebase-admin/auth";
import type { FirebaseApp } from "firebase/app";

declare global {
  /*{ @if (it.BATI.has("express")) }*/
  // eslint-disable-next-line
  namespace Express {
    interface Request {
      user?: UserRecord | null;
    }
  }
  /*{ /if }*/
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

// Tell TypeScript that this file isn't an ambient module
export {};
