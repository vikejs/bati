## Get started

**1. Install**

```shell
git clone git@github.com:vikejs/bati.git
cd bati # Go to the monorepo root
bun install
```

> [!NOTE]
> See [System requirements](#system-requirements) for how to install Bun.

**2. Build**

Build Bati's source code:

```shell
bun run build # At the monorepo root
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

bun run new-boilerplate <name_of_integration>
bun install
```

This will create a new folder in `boilerplates/` folder.
You can then check the [boilerplates documentation](https://github.com/vikejs/bati/blob/main/BOILERPLATES.md),
or take inspiration from existing ones.

<br/>

## Run tests

```shell
# At the monorepo root

# Run the unit tests /**/*.local.spec.ts
bun run test
# Run the end-to-end tests /packages/tests/tests/*.spec.ts
bun run test:e2e
```

Filter end-to-end tests:

```shell
# Run all e2e tests containing --solid and --authjs flags
bun run test:e2e --filter solid,authjs
```

> [!NOTE]
> End-to-end tests run thanks to Nx, which will cache tests results.
> This means that even when running the full end-to-end test suite, only changed tests/code will actually be executed.

> [!TIP]
> Even with the help of Nx, the end-to-end tests can take a lot of time. We therefore recommend the following:
> - Instead of running all end-to-end tests, run only the end-to-end tests of one example.
> - Instead of running all end-to-end tests locally, run them on GitHub: push your changes to your Bati fork (`github.com/my-username/bati`) and see the result of all end-to-end tests on the GitHub actions of your fork.

<br/>

## System requirements

> [!NOTE]
> These requirements are only needed for developing the source code of Bati. `@bati/cli` itself can be used with Windows and with any package manager.

- Node.js `>=22.0.0`
- Bun `>=1.3.11`
- Unix (Linux or macOS)

> [!NOTE]
> To install [Bun](https://bun.sh) run:
> ```shell
> curl -fsSL https://bun.sh/install | bash
> ```
> (Or see [Bun Docs > Installation](https://bun.sh/docs/installation) for alternative methods.)
