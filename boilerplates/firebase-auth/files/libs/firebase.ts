// Import the functions you need from the SDKs you need
import { deleteApp, getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, inMemoryPersistence } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
// Create a singleton firebase client app
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
  deleteApp(app);
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);

// As httpOnly cookies are to be used, do not persist any state client side.
// `inMemoryPersistence` is an implementation of Persistence of type 'NONE'.
auth.setPersistence(inMemoryPersistence);

// export the firebase app and auth
export { app, auth };
