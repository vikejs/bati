import { type Flags } from "./features.js";
import type { Feature } from "./types.js";

export class BatiSet extends Set<Flags> {
  readonly #servers: Set<Flags>;
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
    return this.hasOneOf(this.#databases);
  }
}