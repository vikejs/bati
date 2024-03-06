import "dotenv/config";
import { getApps, type App, initializeApp, applicationDefault, getApp } from "firebase-admin/app";

let firebaseAdmin: App | undefined;

if (!getApps().length) {
    firebaseAdmin = initializeApp({
        credential: applicationDefault(),
    });
} else {
    firebaseAdmin = getApp();
}

export { firebaseAdmin }