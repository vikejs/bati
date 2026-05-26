/**
 * Chainable builder for the multi-stage Dockerfiles emitted by Bati boilerplates.
 *
 * `.from(img, { as })` widens the `Stages` type parameter, so `.copy(..., { from })`
 * only autocompletes — and accepts — stage names that were actually declared.
 */

export interface BaseOptions {
  /** Rendered as `# <comment>` line(s) immediately before the instruction. */
  comment?: string;
}

export interface FromOptions extends BaseOptions {
  /** Stage alias: `AS <name>`. */
  as: string;
}

export interface CopyOptions<Stages extends string = string> extends BaseOptions {
  /** Copy from a named build stage: `--from=<stage>`. */
  from?: Stages;
}

export type EnvRecord = Record<string, string>;

type Instruction =
  | { kind: "from"; image: string; options: FromOptions }
  | { kind: "workdir"; path: string; options: BaseOptions }
  | { kind: "run"; command: string; options: BaseOptions }
  | { kind: "copy"; sources: string[]; dest: string; options: CopyOptions }
  | { kind: "env"; vars: EnvRecord; options: BaseOptions }
  | { kind: "expose"; port: number; options: BaseOptions }
  | { kind: "cmd"; command: string[]; options: BaseOptions };

export class DockerfileBuilder<Stages extends string = never> {
  private readonly instructions: Instruction[] = [];

  from<S extends string>(image: string, options: FromOptions & { as: S }): DockerfileBuilder<Stages | S> {
    this.instructions.push({ kind: "from", image, options });
    return this as DockerfileBuilder<Stages | S>;
  }

  workdir(path: string, options: BaseOptions = {}): this {
    this.instructions.push({ kind: "workdir", path, options });
    return this;
  }

  run(command: string, options: BaseOptions = {}): this {
    this.instructions.push({ kind: "run", command, options });
    return this;
  }

  // `string & {}` keeps declared stage names as autocomplete hints without
  // closing the type to external image refs (e.g. "nginx:alpine").
  copy(sources: string[], dest: string, options: CopyOptions<Stages | (string & {})> = {}): this {
    this.instructions.push({ kind: "copy", sources, dest, options });
    return this;
  }

  env(vars: EnvRecord, options: BaseOptions = {}): this {
    this.instructions.push({ kind: "env", vars, options });
    return this;
  }

  expose(port: number, options: BaseOptions = {}): this {
    this.instructions.push({ kind: "expose", port, options });
    return this;
  }

  cmd(command: string[], options: BaseOptions = {}): this {
    this.instructions.push({ kind: "cmd", command, options });
    return this;
  }

  /** Run `cb` against the builder only when `condition` holds. */
  when(condition: boolean, cb: (builder: this) => void): this {
    if (condition) cb(this);
    return this;
  }

  /** Apply a reusable group of steps. */
  pipe(cb: (builder: this) => void): this {
    cb(this);
    return this;
  }

  build(): string {
    return this.instructions.map(renderInstruction).join("\n");
  }
}

export function dockerfile(): DockerfileBuilder {
  return new DockerfileBuilder();
}

function renderInstruction(inst: Instruction): string {
  const comment = inst.options.comment
    ? `${inst.options.comment
        .split("\n")
        .map((l) => (l.trim() === "" ? "#" : `# ${l}`))
        .join("\n")}\n`
    : "";
  return comment + renderBody(inst);
}

function renderBody(inst: Instruction): string {
  switch (inst.kind) {
    case "from":
      return `FROM ${inst.image} AS ${inst.options.as}`;
    case "workdir":
      return `WORKDIR ${inst.path}`;
    case "run":
      return `RUN ${inst.command}`;
    case "copy": {
      const from = inst.options.from ? `--from=${inst.options.from} ` : "";
      return `COPY ${from}${[...inst.sources, inst.dest].join(" ")}`;
    }
    case "env": {
      const pairs = Object.entries(inst.vars)
        .map(([k, v]) => `${k}=${quoteEnvValue(v)}`)
        .join(" \\\n    ");
      return `ENV ${pairs}`;
    }
    case "expose":
      return `EXPOSE ${inst.port}`;
    case "cmd":
      return `CMD ${formatExecForm(inst.command)}`;
  }
}

function formatExecForm(args: string[]): string {
  return `[ ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(", ")} ]`;
}

function quoteEnvValue(value: string): string {
  return /[\s"'\\$`|&;<>(){}]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

// ---------------------------------------------------------------------------
// Package-manager facts for containerized installs
// ---------------------------------------------------------------------------

export interface DockerPackageManager {
  image: string;
  /** pnpm and yarn ship through corepack; bun and npm don't. */
  corepack: boolean;
  install: string;
  installProd: string;
  /** Glob(s) to COPY so the install layer re-caches only on lockfile changes. */
  lockfiles: string[];
}

export function dockerPackageManager(
  name: string,
  { frozenLockfile }: { frozenLockfile: boolean },
): DockerPackageManager {
  const frozen = frozenLockfile ? " --frozen-lockfile" : "";
  switch (name) {
    case "pnpm":
      return {
        image: "node:24-alpine",
        corepack: true,
        install: `pnpm install${frozen}`,
        installProd: `pnpm install${frozen} --prod`,
        lockfiles: ["pnpm-lock.yaml*", "pnpm-workspace.yaml*"],
      };
    case "yarn":
      return {
        image: "node:24-alpine",
        corepack: true,
        install: `yarn install${frozen}`,
        installProd: `yarn install${frozen} --production`,
        lockfiles: ["yarn.lock*"],
      };
    case "bun":
      return {
        image: "oven/bun:1-alpine",
        corepack: false,
        install: `bun install${frozen}`,
        installProd: `bun install${frozen} --production`,
        lockfiles: ["bun.lock*"],
      };
    default:
      return {
        image: "node:24-alpine",
        corepack: false,
        install: frozenLockfile ? "npm ci" : "npm install",
        installProd: frozenLockfile ? "npm ci --omit=dev" : "npm install --omit=dev",
        lockfiles: ["package-lock.json*"],
      };
  }
}
