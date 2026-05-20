/**
 * Chainable TypeScript API for generating Dockerfiles.
 *
 * The builder tracks declared stage names at the type level.
 * After `.from("img", { as: "myStage" })`, all subsequent `.copy(..., { from: ... })`
 * calls are restricted to known stage names, giving compile-time safety.
 *
 * @example
 * const df = dockerfile()
 *   .from("oven/bun:1", { as: "base", comment: "official Bun image" })
 *   .workdir("/usr/src/app")
 *   .from("base", { as: "install" })
 *   .run("mkdir -p /temp/dev")
 *   .copy(["package.json", "bun.lock*"], "/temp/dev/")
 *   .copy(["node_modules"], "node_modules", { from: "install" }) // ✅ type-safe
 *   // .copyFrom("typo", ["x"], "y")                             // ❌ TS error
 *   .build();
 */

// ---------------------------------------------------------------------------
// Shared base options (every instruction can have an optional comment)
// ---------------------------------------------------------------------------

interface BaseOptions {
  /**
   * Emitted as `# <comment>` on the line(s) immediately before this instruction.
   * Multi-line strings produce multiple comment lines.
   */
  comment?: string;
}

// ---------------------------------------------------------------------------
// Per-instruction option types
// ---------------------------------------------------------------------------

export interface FromOptions extends BaseOptions {
  /** Stage alias (required): `AS <name>` */
  as: string;
  /** `--platform=<platform>` e.g. `"linux/amd64"` */
  platform?: string;
}

export interface RunOptions extends BaseOptions {
  /** Emit as `# RUN ...` (commented-out / disabled line) */
  disabled?: boolean;
  /** `--mount=<...>` */
  mount?: string;
  /** `--network=<mode>` */
  network?: string;
  /** `--security=<insecure|sandbox>` */
  security?: string;
}

export interface CopyOptions<Stages extends string = string> extends BaseOptions {
  /** Copy files from a named build stage: `--from=<stage>` */
  from?: Stages;
  /** `--chown=<user>:<group>` */
  chown?: string;
  /** `--chmod=<perms>` */
  chmod?: string;
}

export interface AddOptions extends BaseOptions {
  /** `--chown=<user>:<group>` */
  chown?: string;
  /** `--chmod=<perms>` */
  chmod?: string;
  /** `--keep-git-dir` */
  keepGitDir?: boolean;
}

export interface CmdOptions extends BaseOptions {}
export interface EntrypointOptions extends BaseOptions {}
export interface EnvOptions extends BaseOptions {}
export interface ArgOptions extends BaseOptions {
  /** Default value: `ARG <name>=<default>` */
  default?: string;
}
export interface LabelOptions extends BaseOptions {}
export interface ExposeOptions extends BaseOptions {
  /** `tcp` or `udp` (default: `tcp`) */
  protocol?: "tcp" | "udp";
}
export interface VolumeOptions extends BaseOptions {}
export interface UserOptions extends BaseOptions {}
export interface OnbuildOptions extends BaseOptions {}
export interface StopsignalOptions extends BaseOptions {}
export interface ShellOptions extends BaseOptions {}

export interface HealthcheckOptions extends BaseOptions {
  /** e.g. `"30s"` */
  interval?: string;
  /** e.g. `"10s"` */
  timeout?: string;
  /** e.g. `"0s"` */
  startPeriod?: string;
  /** Number of retries before unhealthy */
  retries?: number;
}

export type EnvRecord = Record<string, string>;
export type LabelRecord = Record<string, string>;

// ---------------------------------------------------------------------------
// Internal instruction representation
// ---------------------------------------------------------------------------

type Instruction =
  | { kind: "from"; image: string; options: FromOptions }
  | { kind: "workdir"; path: string; options: BaseOptions }
  | { kind: "run"; command: string | string[]; options: RunOptions }
  | { kind: "copy"; sources: string[]; dest: string; options: CopyOptions }
  | { kind: "add"; sources: string[]; dest: string; options: AddOptions }
  | { kind: "cmd"; command: string | string[]; options: CmdOptions }
  | { kind: "entrypoint"; command: string | string[]; options: EntrypointOptions }
  | { kind: "env"; vars: EnvRecord; options: EnvOptions }
  | { kind: "arg"; name: string; options: ArgOptions }
  | { kind: "label"; labels: LabelRecord; options: LabelOptions }
  | { kind: "expose"; port: number | string; options: ExposeOptions }
  | { kind: "volume"; paths: string[]; options: VolumeOptions }
  | { kind: "user"; user: string; options: UserOptions }
  | { kind: "onbuild"; instruction: string; options: OnbuildOptions }
  | { kind: "stopsignal"; signal: string; options: StopsignalOptions }
  | { kind: "healthcheck"; command: string | null; options: HealthcheckOptions }
  | { kind: "shell"; command: string[]; options: ShellOptions };

// ---------------------------------------------------------------------------
// DockerfileBuilder<Stages>
//
// `Stages` accumulates the union of all `as` names declared via `.from()`.
// This lets `.copy(..., { from: <Stages> })` be type-checked at compile time.
// ---------------------------------------------------------------------------

export class DockerfileBuilder<Stages extends string = never> {
  // Accessible to `merge()` on a compatible instance; otherwise opaque.
  /** @internal */
  readonly _instructions: Instruction[] = [];

  // -------------------------------------------------------------------------
  // FROM  — the only method that widens the Stages type parameter
  // -------------------------------------------------------------------------

  /**
   * `FROM <image> AS <name>`
   *
   * `as` is required — every stage must be named. The returned builder type
   * accumulates `S` into its `Stages` union, making `<name>` available as a
   * valid value for `from` in `.copy()` / `.copyFrom()` calls.
   *
   * @example
   * const b = dockerfile()
   *   .from("oven/bun:1", { as: "base" })
   *   .from("base",       { as: "install" })
   *   .copy(["dist"], ".", { from: "base" })      // ✅ autocompleted
   *   .copyFrom("install", ["node_modules"], ".") // ✅ hard-checked
   *   // .copyFrom("typo", ["x"], ".")            // ❌ TS error
   */
  from<S extends string>(image: string, options: FromOptions & { as: S }): DockerfileBuilder<Stages | S> {
    this._instructions.push({ kind: "from", image, options });
    return this as any;
  }

  // -------------------------------------------------------------------------
  // WORKDIR
  // -------------------------------------------------------------------------

  /** `WORKDIR <path>` */
  workdir(path: string, options: BaseOptions = {}): this {
    this._instructions.push({ kind: "workdir", path, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // RUN
  // -------------------------------------------------------------------------

  /**
   * `RUN <command>`
   *
   * - String → shell form: `RUN cd /app && bun install`
   * - Array  → exec form:  `RUN [ "bun", "install" ]`
   * - `options.disabled = true` → `# RUN ...`
   *
   * @example
   * .run("cd /temp && bun install")
   * .run("cd /temp && bun install --frozen-lockfile", { disabled: true })
   */
  run(command: string | string[], options: RunOptions = {}): this {
    this._instructions.push({ kind: "run", command, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // COPY
  // -------------------------------------------------------------------------

  /**
   * `COPY [--from=<stage>] <src>... <dest>`
   *
   * The `from` option provides **IDE autocompletion** for declared stage names
   * while still accepting arbitrary strings for external image refs (e.g. `"nginx:alpine"`).
   *
   * Use `.copyFrom()` for **hard compile errors** on unknown stage names.
   *
   * @example
   * .copy(["package.json", "bun.lock*"], "/temp/dev/")
   * .copy(["node_modules"], "node_modules", { from: "install" })   // autocompleted
   * .copy(["nginx.conf"], "/etc/nginx/", { from: "nginx:alpine" }) // external ok
   */
  copy(
    sources: string[],
    dest: string,
    options: CopyOptions<Stages | (string & {})> = {},
    //                   ^^^^^^^^^^^^^^^^^^^^
    // `string & {}` surfaces known stage names as autocomplete suggestions
    // while keeping the type open for external image refs like "nginx:alpine".
  ): this {
    this._instructions.push({ kind: "copy", sources, dest, options });
    return this;
  }

  /**
   * `COPY --from=<stage> <src>... <dest>` — **strict** variant.
   *
   * Unlike `.copy()`, `from` is restricted **only** to stage names declared
   * via `.from(..., { as })`. Any other string is a **compile-time error**.
   *
   * @example
   * // After .from("oven/bun:1", { as: "build" }):
   * .copyFrom("build", ["dist"], "./dist")      // ✅ known stage
   * // .copyFrom("typo", ["x"], "y")            // ❌ TS error: not in Stages
   */
  copyFrom(from: Stages, sources: string[], dest: string, options: Omit<CopyOptions<Stages>, "from"> = {}): this {
    this._instructions.push({ kind: "copy", sources, dest, options: { ...options, from } });
    return this;
  }

  // -------------------------------------------------------------------------
  // ADD
  // -------------------------------------------------------------------------

  /** `ADD [options] <src>... <dest>` */
  add(sources: string[], dest: string, options: AddOptions = {}): this {
    this._instructions.push({ kind: "add", sources, dest, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // CMD / ENTRYPOINT
  // -------------------------------------------------------------------------

  /**
   * `CMD <command>`
   *
   * Pass an array for exec form: `CMD ["node", "server.js"]`
   */
  cmd(command: string | string[], options: CmdOptions = {}): this {
    this._instructions.push({ kind: "cmd", command, options });
    return this;
  }

  /**
   * `ENTRYPOINT <command>`
   *
   * Pass an array for exec form: `ENTRYPOINT ["bun", "run", "start"]`
   */
  entrypoint(command: string | string[], options: EntrypointOptions = {}): this {
    this._instructions.push({ kind: "entrypoint", command, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // ENV / ARG / LABEL
  // -------------------------------------------------------------------------

  /**
   * `ENV <key>=<value> ...`
   *
   * @example .env({ NODE_ENV: "production", PORT: "3000" })
   */
  env(vars: EnvRecord, options: EnvOptions = {}): this {
    this._instructions.push({ kind: "env", vars, options });
    return this;
  }

  /**
   * `ARG <name>[=<default>]`
   *
   * @example .arg("NODE_VERSION", { default: "20" })
   */
  arg(name: string, options: ArgOptions = {}): this {
    this._instructions.push({ kind: "arg", name, options });
    return this;
  }

  /** `LABEL <key>="<value>" ...` */
  label(labels: LabelRecord, options: LabelOptions = {}): this {
    this._instructions.push({ kind: "label", labels, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // EXPOSE / VOLUME / USER
  // -------------------------------------------------------------------------

  /**
   * `EXPOSE <port>[/<protocol>]`
   *
   * @example .expose(3000, { protocol: "tcp" })
   */
  expose(port: number | string, options: ExposeOptions = {}): this {
    this._instructions.push({ kind: "expose", port, options });
    return this;
  }

  /** `VOLUME <path> [<path>...]` */
  volume(paths: string[], options: VolumeOptions = {}): this {
    this._instructions.push({ kind: "volume", paths, options });
    return this;
  }

  /** `USER <user>[:<group>]` */
  user(user: string, options: UserOptions = {}): this {
    this._instructions.push({ kind: "user", user, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // ONBUILD / STOPSIGNAL / SHELL
  // -------------------------------------------------------------------------

  /** `ONBUILD <instruction>` */
  onbuild(instruction: string, options: OnbuildOptions = {}): this {
    this._instructions.push({ kind: "onbuild", instruction, options });
    return this;
  }

  /** `STOPSIGNAL <signal>` */
  stopsignal(signal: string, options: StopsignalOptions = {}): this {
    this._instructions.push({ kind: "stopsignal", signal, options });
    return this;
  }

  /** `SHELL ["executable", "params"]` */
  shell(command: string[], options: ShellOptions = {}): this {
    this._instructions.push({ kind: "shell", command, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // HEALTHCHECK
  // -------------------------------------------------------------------------

  /**
   * `HEALTHCHECK [options] CMD <command>`
   *
   * Pass `null` as command to emit `HEALTHCHECK NONE`.
   *
   * @example
   * .healthcheck("curl -f http://localhost/ || exit 1", { interval: "30s", retries: 3 })
   * .healthcheck(null)  // → HEALTHCHECK NONE
   */
  healthcheck(command: string | null, options: HealthcheckOptions = {}): this {
    this._instructions.push({ kind: "healthcheck", command, options });
    return this;
  }

  // -------------------------------------------------------------------------
  // Composition helpers
  // -------------------------------------------------------------------------

  /**
   * Merge another builder's instructions into this one.
   *
   * The returned type merges both builders' known stages.
   *
   * @example
   * const shared = dockerfile().workdir("/app").env({ TZ: "UTC" });
   * const final  = dockerfile().from("node:20", { as: "base" }).merge(shared);
   */
  merge<OtherStages extends string>(other: DockerfileBuilder<OtherStages>): DockerfileBuilder<Stages | OtherStages> {
    this._instructions.push(...other._instructions);
    return this as any;
  }

  /**
   * Conditionally apply a callback.
   *
   * @example
   * .when(isDev, b => b.run("bun install").run("bun run dev"))
   */
  when(condition: boolean, cb: (builder: this) => void): this {
    if (condition) cb(this);
    return this;
  }

  /**
   * Apply a callback (useful for reusable step groups).
   *
   * @example
   * const addMeta = (b: DockerfileBuilder<any>) =>
   *   b.label({ maintainer: "team@example.com" });
   *
   * dockerfile().from("node:20", { as: "base" }).pipe(addMeta)
   */
  pipe(cb: (builder: this) => void): this {
    cb(this);
    return this;
  }

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------

  /** Render the Dockerfile as a string. */
  build(): string {
    return this._instructions.map(renderInstruction).join("\n");
  }

  /** Alias for `.build()` */
  toString(): string {
    return this.build();
  }
}

// ---------------------------------------------------------------------------
// Factory function (preferred entry point — avoids `new` keyword)
// ---------------------------------------------------------------------------

/** Create a new `DockerfileBuilder`. Preferred over `new DockerfileBuilder()`. */
export function dockerfile(): DockerfileBuilder<never> {
  return new DockerfileBuilder();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderInstruction(inst: Instruction): string {
  const commentLines = inst.options.comment
    ? inst.options.comment
        .split("\n")
        .map((l) => (l.trim() === "" ? "#" : `# ${l}`))
        .join("\n") + "\n"
    : "";

  const body = renderBody(inst);
  return commentLines + body;
}

function renderBody(inst: Instruction): string {
  switch (inst.kind) {
    case "from": {
      const { image, options } = inst;
      const parts = ["FROM"];
      if (options.platform) parts.push(`--platform=${options.platform}`);
      parts.push(image);
      if (options.as) parts.push("AS", options.as);
      return parts.join(" ");
    }

    case "workdir":
      return `WORKDIR ${inst.path}`;

    case "run": {
      const { command, options } = inst;
      const flags: string[] = [];
      if (options.mount) flags.push(`--mount=${options.mount}`);
      if (options.network) flags.push(`--network=${options.network}`);
      if (options.security) flags.push(`--security=${options.security}`);
      const flagStr = flags.length ? flags.join(" ") + " " : "";
      const cmdStr = Array.isArray(command) ? formatExecForm(command) : command;
      const line = `RUN ${flagStr}${cmdStr}`;
      return options.disabled ? `# ${line}` : line;
    }

    case "copy": {
      const { sources, dest, options } = inst;
      const flags: string[] = [];
      if (options.from) flags.push(`--from=${options.from}`);
      if (options.chown) flags.push(`--chown=${options.chown}`);
      if (options.chmod) flags.push(`--chmod=${options.chmod}`);
      const flagStr = flags.length ? flags.join(" ") + " " : "";
      return `COPY ${flagStr}${[...sources, dest].join(" ")}`;
    }

    case "add": {
      const { sources, dest, options } = inst;
      const flags: string[] = [];
      if (options.chown) flags.push(`--chown=${options.chown}`);
      if (options.chmod) flags.push(`--chmod=${options.chmod}`);
      if (options.keepGitDir) flags.push("--keep-git-dir");
      const flagStr = flags.length ? flags.join(" ") + " " : "";
      return `ADD ${flagStr}${[...sources, dest].join(" ")}`;
    }

    case "cmd":
      return `CMD ${Array.isArray(inst.command) ? formatExecForm(inst.command) : inst.command}`;

    case "entrypoint":
      return `ENTRYPOINT ${Array.isArray(inst.command) ? formatExecForm(inst.command) : inst.command}`;

    case "env": {
      const pairs = Object.entries(inst.vars)
        .map(([k, v]) => `${k}=${quoteEnvValue(v)}`)
        .join(" \\\n    ");
      return `ENV ${pairs}`;
    }

    case "arg":
      return inst.options.default !== undefined
        ? `ARG ${inst.name}=${quoteEnvValue(inst.options.default)}`
        : `ARG ${inst.name}`;

    case "label": {
      const pairs = Object.entries(inst.labels)
        .map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
        .join(" \\\n      ");
      return `LABEL ${pairs}`;
    }

    case "expose": {
      const proto = inst.options.protocol;
      return proto ? `EXPOSE ${inst.port}/${proto}` : `EXPOSE ${inst.port}`;
    }

    case "volume":
      return inst.paths.length === 1 ? `VOLUME ${inst.paths[0]}` : `VOLUME ${formatExecForm(inst.paths)}`;

    case "user":
      return `USER ${inst.user}`;

    case "onbuild":
      return `ONBUILD ${inst.instruction}`;

    case "stopsignal":
      return `STOPSIGNAL ${inst.signal}`;

    case "healthcheck": {
      if (inst.command === null) return "HEALTHCHECK NONE";
      const { options } = inst;
      const flags: string[] = [];
      if (options.interval) flags.push(`--interval=${options.interval}`);
      if (options.timeout) flags.push(`--timeout=${options.timeout}`);
      if (options.startPeriod) flags.push(`--start-period=${options.startPeriod}`);
      if (options.retries !== undefined) flags.push(`--retries=${options.retries}`);
      const flagStr = flags.length ? flags.join(" ") + " " : "";
      return `HEALTHCHECK ${flagStr}CMD ${inst.command}`;
    }

    case "shell":
      return `SHELL ${formatExecForm(inst.command)}`;
  }
}

function formatExecForm(args: string[]): string {
  return `[ ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(", ")} ]`;
}

function quoteEnvValue(value: string): string {
  return /[\s"'\\$`|&;<>(){}]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}
