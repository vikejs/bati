import { UserRecord } from "firebase-admin/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRecord | null;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vike {
    interface PageContext {
      user?: UserRecord | null;
    }
  }
}

// Tell TypeScript that this file isn't an ambient module
export {};
