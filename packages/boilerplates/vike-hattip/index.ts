import { dirname, join } from "node:path/posix";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default join(__dirname, "files");
