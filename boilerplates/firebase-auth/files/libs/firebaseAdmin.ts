import "dotenv/config";
import { applicationDefault, getApp, getApps, initializeApp, type App } from "firebase-admin/app";

let firebaseAdmin: App | undefined;

if (!getApps().length) {
  firebaseAdmin = initializeApp({
    credential: applicationDefault(),
  });
} else {
  firebaseAdmin = getApp();
}

export { firebaseAdmin };
