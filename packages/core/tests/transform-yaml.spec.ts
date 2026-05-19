import { BatiSet, features } from "@batijs/features";
import { assert, describe, test } from "vitest";
import { transformAndFormat } from "../src/index.js";

function testCondition(
  code: string,
  expectedWith: string,
  expectedWithout: string,
  featureFlag: string,
  filename = "docker-compose.yml",
) {
  test("with feature", async () => {
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new BatiSet([featureFlag] as never[], features),
      },
      { filepath: filename },
    );
    assert.equal(renderedOutput.code, expectedWith);
  });

  test("without feature", async () => {
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new BatiSet([], features),
      },
      { filepath: filename },
    );
    assert.equal(renderedOutput.code, expectedWithout);
  });
}

describe("yaml: sequence item removal", () => {
  testCondition(
    `services:
  app:
    environment:
      - NODE_ENV=production
      # BATI.has("authjs")
      - AUTH_SECRET=\${AUTH_SECRET}
`,
    `services:
  app:
    environment:
      - NODE_ENV=production
      - AUTH_SECRET=\${AUTH_SECRET}
`,
    `services:
  app:
    environment:
      - NODE_ENV=production
`,
    "authjs",
  );
});

describe("yaml: mapping pair removal", () => {
  testCondition(
    `services:
  app:
    build: .
    # BATI.has("sqlite")
    volumes:
      - sqlite_data:/app/data
    restart: unless-stopped
`,
    `services:
  app:
    build: .
    volumes:
      - sqlite_data:/app/data
    restart: unless-stopped
`,
    `services:
  app:
    build: .
    restart: unless-stopped
`,
    "sqlite",
  );
});

describe("yaml: top-level pair removal", () => {
  testCondition(
    `services:
  app:
    restart: unless-stopped

# BATI.has("sqlite")
volumes:
  sqlite_data:
`,
    `services:
  app:
    restart: unless-stopped

volumes:
  sqlite_data:
`,
    `services:
  app:
    restart: unless-stopped
`,
    "sqlite",
  );
});

describe("yaml: keep non-bati comments", () => {
  testCondition(
    `services:
  app:
    environment:
      - NODE_ENV=production
      # regular comment
      # BATI.has("authjs")
      - AUTH_SECRET=\${AUTH_SECRET}
`,
    `services:
  app:
    environment:
      - NODE_ENV=production
      # regular comment
      - AUTH_SECRET=\${AUTH_SECRET}
`,
    `services:
  app:
    environment:
      - NODE_ENV=production
`,
    "authjs",
  );
});

describe("yaml: .yaml extension also works", () => {
  testCondition(
    `services:
  app:
    environment:
      - NODE_ENV=production
      # BATI.has("authjs")
      - AUTH_SECRET=\${AUTH_SECRET}
`,
    `services:
  app:
    environment:
      - NODE_ENV=production
      - AUTH_SECRET=\${AUTH_SECRET}
`,
    `services:
  app:
    environment:
      - NODE_ENV=production
`,
    "authjs",
    "compose.yaml",
  );
});
