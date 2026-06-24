import type { Flags } from "./features.js";
import type { Feature } from "./types.js";

/**
 * /!\ This needs to be published for updates to be taken into account in the CI
 */
export class BatiSet extends Set<Flags> {
  readonly #servers: Set<Flags>;
  readonly #databases: Set<Flags>;
  readonly #orm: Set<Flags>;

  public pm: string;

  constructor(flags: Flags[], allFeatures: ReadonlyArray<Feature>, pm: string) {
    super(flags);
    this.pm = pm;
    this.#servers = new Set(allFeatures.filter((f) => f.category === "Server").map((f) => f.flag as Flags));
    this.#databases = new Set(allFeatures.filter((f) => f.category === "Database").map((f) => f.flag as Flags));
    this.#orm = new Set(allFeatures.filter((f) => f.category === "ORM / Query builder").map((f) => f.flag as Flags));
  }

  private hasOneOf(a: Set<Flags>) {
    for (const x of this) if (a.has(x)) return true;
    return false;
  }

  /** Prefix to run a package.json script (`npm run`, `pnpm`, `yarn`, `bun run`). */
  get pmRun(): string {
    return this.pm === "pnpm" || this.pm === "yarn" ? this.pm : `${this.pm} run`;
  }

  /** Prefix to run an installed dependency's binary (`npx`, `pnpm exec`, `yarn`, `bunx`). */
  get pmExec(): string {
    switch (this.pm) {
      case "pnpm":
        return "pnpm exec";
      case "yarn":
        return "yarn";
      case "bun":
        return "bunx";
      default:
        return "npx";
    }
  }

  /** Prefix to fetch-and-run a package's binary, for `@latest` (`npx`, `pnpm dlx`, `yarn dlx`, `bunx`). */
  get pmDlx(): string {
    switch (this.pm) {
      case "pnpm":
        return "pnpm dlx";
      case "yarn":
        return "yarn dlx";
      case "bun":
        return "bunx";
      default:
        return "npx";
    }
  }

  get hasServer(): boolean {
    return this.hasOneOf(this.#servers);
  }

  /** A database engine is selected (SQLite or PostgreSQL). */
  get hasDatabase(): boolean {
    return this.hasOneOf(this.#databases);
  }

  /** An ORM or query builder is selected (Drizzle, Kysely or Prisma). */
  get hasOrm(): boolean {
    return this.hasOneOf(this.#orm);
  }

  /** A database engine whose client and todo demo Bati scaffolds. Prisma is self-managed
   * (it brings its own client and `DATABASE_URL`), so it opts out of the shared demo. */
  get hasDbDemo(): boolean {
    return this.hasDatabase && !this.has("prisma");
  }

  get hasD1(): boolean {
    // D1 is the SQLite engine running on Cloudflare.
    return this.has("cloudflare") && this.has("sqlite");
  }

  get hasDotEnvSecrets(): boolean {
    // Cloudflare keeps runtime vars in wrangler.jsonc; there `.env` is public-only.
    // Other targets store secrets in `.env`. Widen as platform adapters are added.
    return !this.has("cloudflare");
  }

  get hasUD(): boolean {
    return (
      this.has("cloudflare") ||
      this.has("vercel") ||
      this.has("netlify") ||
      this.has("docker") ||
      this.has("dokploy") ||
      this.hasOneOf(this.#servers)
    );
  }

  /**
   * @deprecated
   */
  get hasPhoton(): boolean {
    return this.hasUD;
  }
}
