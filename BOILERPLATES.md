Any folder contained in [boilerplates](https://github.com/batijs/bati/tree/main/boilerplates) folder is considered a _boilerplate_.

Each boilerplate may be related to one or multiple _features_.

> [!NOTE]
> `react`, `eslint`, `auth0`, etc. are each considered as _features_.
> They are visible on the [website](https://batijs.dev/) and available through flags in the CLI.
> They are defined in [features.ts](https://github.com/batijs/bati/blob/main/packages/features/src/features.ts).
> On the CLI, each flag (i.e. `--solid`) enables the given feature.

Some features are well contained in a dedicated boilerplate ([Cloudflare](https://github.com/batijs/bati/tree/main/boilerplates/cloudflare)),
some others are [split](https://github.com/batijs/bati/tree/main/boilerplates/firebase-auth) [into](https://github.com/batijs/bati/tree/main/boilerplates/react-firebase-auth) [several](https://github.com/batijs/bati/tree/main/boilerplates/solid-firebase-auth) [ones](https://github.com/batijs/bati/tree/main/boilerplates/vue-firebase-auth).

## Anatomy of a boilerplate

> [!TIP]
> Create a new boilerplate with `pnpm run new-boilerplate <name>`

Each boilerplate contains at least:
- `files` folder, which contains files that will be used by Bati CLI to scaffold a new app. This is where all code related to features must be placed.
- `package.json`, with a special `bati` property, linking one or many _features_ (or the lack of) to the boilerplate. [More on that below](#packagejsonbati-condition).

## How to keep code maintainable

The most important thing is to avoid duplicating code as much as possible. And we have several ways to help us:
- Create multiple boilerplates if necessary, each with [different conditions](#packagejsonbati-condition)
- Make use of [Bati's own templating syntax](https://github.com/batijs/bati/blob/main/boilerplates/README.md)
- Use [special `$*.ts` filename syntax](#ts-files)

One other important goal is to keep code safely typed. Thanks to Bati's [special syntax](https://github.com/batijs/bati/blob/main/boilerplates/README.md), mixing code and templating is usually straightforward.

> [!NOTE]
> You can require boilerplates files from any other boilerplate. Use the special `@batijs/*` imports to achieve this.
> For instance, importing `@batijs/trpc/trpc/server` imports the `boilerplates/trpc/files/trpc/server.ts` file. Typing information is conserved when doing so.
> Upon scaffolding, those imports are replaced by relative ones.

## `package.json#bati` condition

All boilerplates `package.json` files contain a `bati` property, which dictates if the boilerplate is part of a _feature_.
Most notably, the `bati.if` property leverages [sift](https://www.npmjs.com/package/sift) syntax to include or exclude said boilerplate depending on CLI flags.

> [!TIP]
> Take a look at existing boilerplates `package.json` for inspiration

## `$*.ts` files

`files/` folder can contain special `$*.ts` files which, contrary to other files which are [mostly](https://github.com/batijs/bati/blob/main/boilerplates/README.md) copied as-is,
are interpreted.

> [!TIP]
> When generating the proper filename of the destination file, the `$` and `.ts` parts are removed.
> For instance, `$vite.config.ts.ts` is renamed `vite.config.ts`, or `$package.json.ts` is renamed `package.json`.

Those files MUST export a default function which returns either a `string` or `undefined` (or some serializable object for `.json` files).
If the function returns `undefined`, nothing happens (existing file is not altered, and no empty file created).

```ts
// files/$vite.config.ts.ts

// bati's utils
import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

// the exported default function, which always takes a `TransformerProps` as its first parameter.
export default async function getViteConfig(props: TransformerProps) {
  // Multiple `$*.ts` files can target the same file, here its target is `vite.config.ts`
  // Some utils allows you access the already generated file, and modify it.
  
  // Here, `loadAsMagicast` loads previously created `vite.config.ts`, which always exists because defined in `boilerplates/shared/files`.
  const mod = await loadAsMagicast(props);
  // Other utils like this one exist:
  // - `loadAsJson`: loads a JSON file and parses it
  // - `loadReadme`: loads README file and provides utils to manipulate it
  // - `props.readfile`: loads previous file as string if it exists

  // Then we edit the AST to add a vite plugin
  addVitePlugin(mod, {
    from: "vite-plugin-compiled-react",
    constructor: "compiled",
    imported: "compiled",
    options: { extract: true },
  });

  // Finally we return the updated code as a string
  return mod.generate().code;
}
```

> [!TIP]
> Take a look at existing boilerplates for examples

## Advanced rules

Some _features_ could be incompatible with one another. For instance, `compiled` can only be used with `react`.
To materialize those conflicts (or contextual information), Bati defines them in [packages/features/src/rules](https://github.com/batijs/bati/tree/main/packages/features/src/rules).

- [enum.ts](https://github.com/batijs/bati/blob/main/packages/features/src/rules/enum.ts) uniquely identify a message shown by the CLI or the website
- [rules.ts](https://github.com/batijs/bati/blob/main/packages/features/src/rules/rules.ts) where the logic behind each message is defined

Each message should then be defined on the [website](https://github.com/batijs/bati/blob/main/website/components/RulesMessages.tsx) and on the [CLI](https://github.com/batijs/bati/blob/main/packages/cli/rules.ts).
