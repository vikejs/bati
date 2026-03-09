# @batijs/features

All features that should be visible in the WebUI and the CLI are defined in [src/features.ts](src/features.ts).

In the CLI, feature flags also come from [src/features.ts](src/features.ts), but some non-feature CLI options can be provided by integrations (for example `--storybook`).

All rules (conflicts/dependencies between features, features in beta, etc.) are defined in [src/rules](src/rules).
