declare module "vitest" {
  export interface TestContext {
    tmpdir: string;
  }
}
