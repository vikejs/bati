/* eslint-disable */
// @ts-ignore
const { copy } = require('esbuild-plugin-copy')
// @ts-ignore
const SentrySourcemapsPlugin = require('./esbuild-sentry-plugin.cjs')

// https://github.com/evanw/esbuild/issues/1051#issuecomment-806325487
const nativeNodeModules = {
  name: 'native-node-modules',
  /**
   * @param {{ onResolve: (arg0: { filter: RegExp; namespace: string; }, arg1: { (args: any): { path: any; namespace: string; } | undefined; (args: any): { path: any; namespace: string; }; }) => void; onLoad: (arg0: { filter: RegExp; namespace: string; }, arg1: (args: any) => { contents: string; }) => void; initialOptions: any; }} build
   */
  setup(build) {
    // If a ".node" file is imported within a module in the "file" namespace, resolve
    // it to an absolute path and put it into the "node-file" virtual namespace.
    // @ts-ignore
    build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => {
      // Ignore "react-dom/server.node" because it is not a native module
      if (args.path.startsWith('react-dom/')) return undefined
      return ({
        // @ts-ignore
        path: require.resolve(args.path, { paths: [args.resolveDir] }),
        namespace: 'node-file',
      })
    })

    // Files in the "node-file" virtual namespace call "require()" on the
    // path from esbuild of the ".node" file in the output directory.
    build.onLoad({ filter: /.*/, namespace: 'node-file' }, args => ({
      contents: `
        import path from ${JSON.stringify(args.path)}
        try { module.exports = require(path) }
        catch {}
      `,
    }))

    // If a ".node" file is imported within a module in the "node-file" namespace, put
    // it in the "file" namespace where esbuild's default loading behavior will handle
    // it. It is already an absolute path since we resolved it to one above.
    build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, args => ({
      path: args.path,
      namespace: 'file',
    }))

    // Tell esbuild's default loading behavior to use the "file" loader for
    // these ".node" files.
    let opts = build.initialOptions
    opts.loader = opts.loader || {}
    opts.loader['.node'] = 'file'
  }
}

const copyPlugin = copy({
  assets: [
    {
      from: ['./dist/client/**/*','!./dist/client/assets/**/*'],
      to: ['dist/client'],
    },
    {
      from: 'sentry.config.server.mjs',
      to: 'sentry.config.server.mjs',
    }
  ]
})

module.exports = [nativeNodeModules, ...(typeof SentrySourcemapsPlugin==="function"?[SentrySourcemapsPlugin]:[]) , copyPlugin]