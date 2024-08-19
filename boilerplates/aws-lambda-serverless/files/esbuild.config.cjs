const esbuildPlugins = require('./esbuild-plugins.cjs')

module.exports = () => {
  return {
    packager: 'pnpm',
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outputFileExtension: '.mjs', // https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html
    bundle: true,
    treeShaking: true,
    minify: false, // this breaks the application
    sourcemap: true,
    splitting: false, // better AWS Lambda performance when false
    // https://github.com/evanw/esbuild/issues/1921
    banner: {
      js: `
import { createRequire as topLevelCreateRequire } from 'module';
import { dirname as fix_path_dirname } from "node:path";
import { fileURLToPath as fix_url_fileURLToPath } from "node:url";
const require = topLevelCreateRequire(import.meta.url);
const __filename = fix_url_fileURLToPath(import.meta.url);
const __dirname = fix_path_dirname(__filename);
`
    },
    plugins: esbuildPlugins
  }
}