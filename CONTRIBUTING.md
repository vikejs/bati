## Get started

**1. Install**

```shell
git clone git@github.com:vikejs/bati.git
cd bati # Go to the monorepo root
pnpm install
```

> [!NOTE]
> See [System requirements](#system-requirements) for how to install pnpm.

**2. Build**

Build Bati's source code:

```shell
pnpm build # At the monorepo root
```

> [!NOTE]
> The build process works is divided into several phases:
> 1. Compile packages necessary to compile boilerplates
> 2. Compile and prepare every boilerplate (from `boilerplates` folder) individually
> 3. Compile `package/cli` to generate the self-contained Bati CLI

<br/>

## Integrate a new feature
```shell
# At the monorepo root

pnpm run new-boilerplate <name_of_integration>
pnpm i
```

This will create a new folder in `boilerplates/` folder.
You can then check the [boilerplates documentation](https://github.com/vikejs/bati/blob/main/BOILERPLATES.md),
or take inspiration from existing ones.

<br/>

## Run tests

```shell
# At the monorepo root

# Run the unit tests /**/*.local.spec.ts
pnpm run test
# Run the end-to-end tests /packages/tests/tests/*.spec.ts
pnpm run test-e2e
```

Filter end-to-end tests:

```shell
# Run all e2e tests containing --solid and --authjs flags
pnpm run test-e2e --filter solid,authjs
```

> [!NOTE]
> End-to-end tests run thanks to turborepo, which will cache tests results.
> This means that even when running the full end-to-end test suite, only changed tests/code will actually be executed.

> [!TIP]
> Even with the help of turborepo, the end-to-end tests can take a lot of time. We therefore recommend the following:
> - Instead of running all end-to-end tests, run only the end-to-end tests of one example.
> - Instead of running all end-to-end tests locally, run them on GitHub: push your changes to your Bati fork (`github.com/my-username/bati`) and see the result of all end-to-end tests on the GitHub actions of your fork.

<br/>

## System requirements

> [!NOTE]
> These requirements are only needed for developing the source code of Bati. `@bati/cli` itself can be used with Windows and with any package manager.

- Node.js `>=20.0.0`
- pnpm `>=10.11.1`
- Unix (Linux or macOS)

> [!NOTE]
> To install [pnpm](https://pnpm.io) run:
> ```shell
> npm install -g pnpm
> ```
> (Or see [pnpm Docs > Installation](https://pnpm.io/installation) for alternative methods.)
