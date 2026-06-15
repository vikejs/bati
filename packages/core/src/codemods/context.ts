/**
 * The run context every Bati codemod evaluates `$$` conditions against and reports back through: it
 * is the same object passed to `transform(source, ctx)`, so a caller reads `keepFileIfImported` /
 * `imports` out after the run. `BATI` / `BATI_TEST` are the build-time globals `$$` conditions read.
 */
export interface BatiContext extends Record<string, unknown> {
  /** Bati's feature set: `has(feature)` and its derived properties (`hasDatabase`, `hasD1`, …). */
  BATI: { has(feature: string): boolean } & Record<string, unknown>;
  BATI_TEST?: boolean;
  /** The file being transformed (destination tree) — required to rewrite `@batijs/…` to a relative
   *  path; omit to leave such imports untouched. */
  filename?: string;
  /** Set by the codemod when it strips a `$$.keepFileIfImported` directive. */
  keepFileIfImported?: boolean;
  /** Surviving relative import specifiers, for Bati's `keep-file-if-imported` graph. Provide the Set. */
  imports?: Set<string>;
}
