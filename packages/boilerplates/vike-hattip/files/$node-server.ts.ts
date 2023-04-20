import { loadFile, generateCode } from "magicast";
import { transformAst } from "../src/parse";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function getHattipFile(
  currentContent: (() => string | Promise<string>) | undefined,
  config: VikeMeta
) {
  const mod = await loadFile(join(__dirname, "#node-server.ts"));

  transformAst(mod.$ast, config);

  return generateCode(mod).code;
}
