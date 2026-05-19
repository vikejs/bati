import type { Flags } from "./features.js";
import type { Feature } from "./types.js";

/**
 * /!\ This needs to be published for updates to be taken into account in the CI
 */
export class BatiSet extends Set<Flags> {
  readonly #servers: Set<Flags>;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: used
  readonly #databases: Set<Flags>;

  constructor(flags: Flags[], allFeatures: ReadonlyArray<Feature>) {
    super(flags);
    this.#servers = new Set(allFeatures.filter((f) => f.category === "Server").map((f) => f.flag as Flags));
    this.#databases = new Set(allFeatures.filter((f) => f.category === "Database").map((f) => f.flag as Flags));
  }

  private hasOneOf(a: Set<Flags>) {
    for (const x of this) if (a.has(x)) return true;
    return false;
  }

  get hasServer(): boolean {
    return this.hasOneOf(this.#servers);
  }

  get hasDatabase(): boolean {
    // TODO replace with the following once prisma and edge are properly supported
    // return this.hasOneOf(this.#databases);
    return this.has("sqlite") || this.has("drizzle") || this.has("kysely");
  }

  get hasD1(): boolean {
    return this.has("cloudflare") && (this.has("sqlite") || this.has("drizzle") || this.has("kysely"));
  }

  get hasUD(): boolean {
    return (
      this.has("cloudflare") ||
      this.has("vercel") ||
      this.has("netlify") ||
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
