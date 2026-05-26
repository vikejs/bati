import type { TransformerProps } from "@batijs/core";

export default async function getDockerignore(props: TransformerProps): Promise<string> {
  const lines = ["node_modules", ".git", "dist", ".env", ".env.*", "!.env.example", "*.log", ".DS_Store"];

  // The e2e plumbing lives in the sibling `<app>.e2e/` workspace and must never reach
  // the image — but only the test suite ever scaffolds those files. A normal user has
  // none of them, so excluding them outside of tests would just be dead, confusing noise.
  if (props.meta.BATI_TEST) {
    lines.push(
      "# e2e plumbing (lives in the sibling `<app>.e2e/` workspace, never the image)",
      "batijs-tests-utils-*.tgz",
      "bati.config.json",
      "vitest.config.ts",
      "*.spec.ts",
    );
  }

  return `${lines.join("\n")}\n`;
}
