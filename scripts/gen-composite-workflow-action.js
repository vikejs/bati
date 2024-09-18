// @ts-nocheck
import { mkdirSync, writeFileSync } from "node:fs";

/**
 * @param {string} stringifiedSteps
 */
function genComposite(stringifiedSteps) {
  const steps = JSON.parse(stringifiedSteps).map(([destination, flags, testFiles]) =>
    getStep(destination, flags, testFiles),
  );

  return `name: Execute Bati CLI and run E2E tests

inputs:
  os:
    required: true
    type: string
  node:
    required: true
    default: 20

runs:
  using: "composite"

  steps:
${steps.join("\n\n")}`;
}

/**
 * @param {string} destination
 * @param {string} flags
 * @param {string} testFiles
 */
function getStep(destination, flags, testFiles) {
  return `    - name: ${destination}
      uses: ./.github/actions/bati-run
      with:
        os: \${{ inputs.os }}
        node: \${{ inputs.node }}
        flags: ${flags}
        test-files: ${testFiles}
        destination: ${destination}`;
}

// eslint-disable-next-line no-undef
const argv = process.argv.slice(2);

mkdirSync("./.github/actions/bati-gen", {
  recursive: true,
});

const composite = genComposite(argv[0]);

writeFileSync("./.github/actions/bati-gen/action.yml", composite);

console.log(composite);
