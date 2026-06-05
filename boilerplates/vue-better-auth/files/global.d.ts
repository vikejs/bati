declare global {
  namespace Vike {
    interface PageContext {
      // Set by `betterAuthSessionMiddleware` and passed to the client via `passToClient`.
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }
  }
}

export {};
