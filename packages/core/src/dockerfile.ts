/**
 * Chainable TypeScript API for generating Dockerfiles.
 *
 * Usage:
 *   const df = new DockerfileBuilder()
 *     .from("oven/bun:1", { as: "base" })
 *     .workdir("/usr/src/app")
 *     .from("base", { as: "install" })
 *     .run("mkdir -p /temp/dev")
 *     .copy(["package.json", "bun.lock*"], "/temp/dev/")
 *     .run("cd /temp/dev && bun install")
 *     .build();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FromOptions {
  /** Multi-stage alias: `AS <name>` */
  as?: string;
  /** Build platform: `--platform=<platform>` */
  platform?: string;
}

export interface CopyOptions {
  /** Source stage to copy from: `--from=<stage>` */
  from?: string;
  /** Change ownership of copied files: `--chown=<user>:<group>` */
  chown?: string;
  /** Change permissions of copied files: `--chmod=<perms>` */
  chmod?: string;
}

export interface AddOptions {
  /** Change ownership: `--chown=<user>:<group>` */
  chown?: string;
  /** Change permissions: `--chmod=<perms>` */
  chmod?: string;
  /** Keep archive format (tar): `--keep-git-dir` */
  keepGitDir?: boolean;
}

export interface RunOptions {
  /** Render as a comment-prefixed disabled line: `# RUN ...` */
  disabled?: boolean;
  /** Mount options: `--mount=...` */
  mount?: string;
  /** Network mode: `--network=<mode>` */
  network?: string;
  /** Security options: `--security=<insecure|sandbox>` */
  security?: string;
}

export interface ExposeOptions {
  /** Protocol: `tcp` or `udp` (default: `tcp`) */
  protocol?: "tcp" | "udp";
}

export interface HealthcheckOptions {
  /** Time between checks: e.g. `30s` */
  interval?: string;
  /** Time to wait for a check: e.g. `30s` */
  timeout?: string;
  /** Start period: e.g. `0s` */
  startPeriod?: string;
  /** Number of retries before unhealthy */
  retries?: number;
}

export interface ArgOptions {
  /** Default value for the ARG */
  default?: string;
}

export type EnvRecord = Record<string, string>;
export type LabelRecord = Record<string, string>;

// ---------------------------------------------------------------------------
// Internal instruction types
// ---------------------------------------------------------------------------

type Instruction =
  | { kind: "comment"; text: string }
  | { kind: "blank" }
  | { kind: "from"; image: string; options: FromOptions }
  | { kind: "workdir"; path: string }
  | { kind: "run"; command: string | string[]; options: RunOptions }
  | { kind: "copy"; sources: string[]; dest: string; options: CopyOptions }
  | { kind: "add"; sources: string[]; dest: string; options: AddOptions }
  | { kind: "cmd"; command: string | string[] }
  | { kind: "entrypoint"; command: string | string[] }
  | { kind: "env"; vars: EnvRecord }
  | { kind: "arg"; name: string; options: ArgOptions }
  | { kind: "label"; labels: LabelRecord }
  | { kind: "expose"; port: number | string; options: ExposeOptions }
  | { kind: "volume"; paths: string[] }
  | { kind: "user"; user: string }
  | { kind: "onbuild"; instruction: string }
  | { kind: "stopsignal"; signal: string }
  | { kind: "healthcheck"; command: string | null; options: HealthcheckOptions }
  | { kind: "shell"; command: string[] };

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export class DockerfileBuilder {
  private readonly instructions: Instruction[] = [];

  // -------------------------------------------------------------------------
  // Comments & whitespace
  // -------------------------------------------------------------------------

  /** Add a `# comment` line */
  comment(text: string): this {
    // Support multi-line comments
    for (const line of text.split("\n")) {
      this.instructions.push({ kind: "comment", text: line });
    }
    return this;
  }

  /** Add a blank line for readability */
  blank(): this {
    this.instructions.push({ kind: "blank" });
    return this;
  }

  // -------------------------------------------------------------------------
  // Core instructions
  // -------------------------------------------------------------------------

  /**
   * `FROM <image> [AS <name>]`
   *
   * @example
   * builder.from("oven/bun:1", { as: "base" })
   */
  from(image: string, options: FromOptions = {}): this {
    this.instructions.push({ kind: "from", image, options });
    return this;
  }

  /**
   * `WORKDIR <path>`
   */
  workdir(path: string): this {
    this.instructions.push({ kind: "workdir", path });
    return this;
  }

  /**
   * `RUN <command>`
   *
   * Pass an array to produce the exec form: `RUN ["cmd", "arg1"]`
   * Use `options.disabled = true` to comment the line out.
   *
   * @example
   * builder.run("bun install")
   * builder.run(["bun", "install"], { disabled: true })
   */
  run(command: string | string[], options: RunOptions = {}): this {
    this.instructions.push({ kind: "run", command, options });
    return this;
  }

  /**
   * `COPY [options] <src>... <dest>`
   *
   * @example
   * builder.copy(["package.json", "bun.lock*"], "/temp/dev/")
   * builder.copy(["node_modules"], "node_modules", { from: "install" })
   */
  copy(sources: string[], dest: string, options: CopyOptions = {}): this {
    this.instructions.push({ kind: "copy", sources, dest, options });
    return this;
  }

  /**
   * `ADD [options] <src>... <dest>`
   */
  add(sources: string[], dest: string, options: AddOptions = {}): this {
    this.instructions.push({ kind: "add", sources, dest, options });
    return this;
  }

  /**
   * `CMD <command>`
   *
   * Pass an array for exec form: `CMD ["bun", "run", "start"]`
   */
  cmd(command: string | string[]): this {
    this.instructions.push({ kind: "cmd", command });
    return this;
  }

  /**
   * `ENTRYPOINT <command>`
   *
   * Pass an array for exec form: `ENTRYPOINT ["bun", "run", "start"]`
   */
  entrypoint(command: string | string[]): this {
    this.instructions.push({ kind: "entrypoint", command });
    return this;
  }

  /**
   * `ENV <key>=<value> ...`
   *
   * @example
   * builder.env({ NODE_ENV: "production", PORT: "3000" })
   */
  env(vars: EnvRecord): this {
    this.instructions.push({ kind: "env", vars });
    return this;
  }

  /**
   * `ARG <name>[=<default>]`
   *
   * @example
   * builder.arg("NODE_VERSION", { default: "20" })
   */
  arg(name: string, options: ArgOptions = {}): this {
    this.instructions.push({ kind: "arg", name, options });
    return this;
  }

  /**
   * `LABEL <key>=<value> ...`
   */
  label(labels: LabelRecord): this {
    this.instructions.push({ kind: "label", labels });
    return this;
  }

  /**
   * `EXPOSE <port>[/<protocol>]`
   *
   * @example
   * builder.expose(3000, { protocol: "tcp" })
   */
  expose(port: number | string, options: ExposeOptions = {}): this {
    this.instructions.push({ kind: "expose", port, options });
    return this;
  }

  /**
   * `VOLUME ["/data"]`
   */
  volume(...paths: string[]): this {
    this.instructions.push({ kind: "volume", paths });
    return this;
  }

  /**
   * `USER <user>[:<group>]`
   */
  user(user: string): this {
    this.instructions.push({ kind: "user", user });
    return this;
  }

  /**
   * `ONBUILD <instruction>`
   */
  onbuild(instruction: string): this {
    this.instructions.push({ kind: "onbuild", instruction });
    return this;
  }

  /**
   * `STOPSIGNAL <signal>`
   */
  stopsignal(signal: string): this {
    this.instructions.push({ kind: "stopsignal", signal });
    return this;
  }

  /**
   * `HEALTHCHECK` instruction.
   *
   * Pass `null` as command to emit `HEALTHCHECK NONE`.
   *
   * @example
   * builder.healthcheck("curl -f http://localhost/ || exit 1", { interval: "30s" })
   * builder.healthcheck(null) // HEALTHCHECK NONE
   */
  healthcheck(command: string | null, options: HealthcheckOptions = {}): this {
    this.instructions.push({ kind: "healthcheck", command, options });
    return this;
  }

  /**
   * `SHELL ["executable", "params"]`
   */
  shell(command: string[]): this {
    this.instructions.push({ kind: "shell", command });
    return this;
  }

  // -------------------------------------------------------------------------
  // Composition helpers
  // -------------------------------------------------------------------------

  /**
   * Merge another builder's instructions into this one.
   * Useful for sharing base configurations across stages.
   *
   * @example
   * const sharedSetup = new DockerfileBuilder().workdir("/app").env({ TZ: "UTC" });
   * const final = new DockerfileBuilder().from("node:20").merge(sharedSetup);
   */
  merge(other: DockerfileBuilder): this {
    this.instructions.push(...other.instructions);
    return this;
  }

  /**
   * Conditionally apply a callback to this builder.
   *
   * @example
   * builder.when(isDev, b => b.run("bun install").run("bun run dev"))
   */
  when(condition: boolean, cb: (builder: this) => void): this {
    if (condition) cb(this);
    return this;
  }

  /**
   * Apply a callback to this builder (useful for extracting reusable step groups).
   *
   * @example
   * const addHealthcheck = (b: DockerfileBuilder) =>
   *   b.healthcheck("curl -f http://localhost/ || exit 1");
   *
   * builder.pipe(addHealthcheck)
   */
  pipe(cb: (builder: this) => void): this {
    cb(this);
    return this;
  }

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------

  /** Render the Dockerfile as a string */
  build(): string {
    return this.instructions.map(renderInstruction).join("\n");
  }

  /** Alias for `build()` */
  toString(): string {
    return this.build();
  }
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function renderInstruction(inst: Instruction): string {
  switch (inst.kind) {
    case "comment":
      return inst.text === "" ? "#" : `# ${inst.text}`;

    case "blank":
      return "";

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

    case "arg": {
      const { name, options } = inst;
      return options.default !== undefined ? `ARG ${name}=${quoteEnvValue(options.default)}` : `ARG ${name}`;
    }

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
  const escaped = args.map((a) => `"${a.replace(/"/g, '\\"')}"`);
  return `[ ${escaped.join(", ")} ]`;
}

function quoteEnvValue(value: string): string {
  // Quote if value contains spaces or special shell characters
  if (/[\s"'\\$`|&;<>(){}]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}
