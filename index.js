'use strict'

const path = require('path')
const os = require('os')
const execFile = require('execa')
const webpack = require('webpack')
const minify = require('babel-minify')
const gzipSize = require('gzip-size')
const MemoryFs = require('memory-fs')
const Buffer = require('buffer').Buffer
const parsePackageName = require('parse-package-name')
const enhancedResolve = require('enhanced-resolve')
const tmp = path.join(os.tmpdir(), 'jsize-' + Math.random().toString(36).substring(7))
const npmBin = path.join(require.resolve('npm/package.json'), '../../.bin/npm')
const resolver = enhancedResolve.ResolverFactory.createResolver({
  fileSystem: new enhancedResolve.NodeJsInputFileSystem(),
  mainFields: ['browser', 'module', 'main']
})
require('fs').mkdirSync(tmp)

/**
 * Calculates the sizes (initial, minified and gziped) for a given package.
 *
 * @param {string|string[]} pkgs - the package(s) to check the size of.
 * @return {Promise}
 */
module.exports = function jsize (pkgs) {
  // Parse all package details. (allows for single or multiple packages)
  pkgs = [].concat(pkgs).map(parsePackageName)
  // Get unique package ids.
  const ids = pkgs
    .map(it => it.name + '@' + (it.version || 'latest'))
    .filter((id, i, all) => all.indexOf(id) === i)

  // Install modules.
  return install(ids)
  // Lookup install paths for each module.
    .then(() => Promise.all(pkgs.map(loadPaths)))
    // Extract entry and external files, then build with webpack.
    .then(paths => build({
      entry: paths.map(path => path.entry),
      externals: paths.reduce((externals, path) => {
        const peers = require(path.package).peerDependencies
        if (!peers) return externals
        return externals.concat(Object.keys(peers))
      }, [])
    }))
    // Calculate sizes.
    .then(script => {
      const minified = minify(script).code
      return gzipSize(minified).then(gzipped => {
        return {
          initial: Buffer.byteLength(script, 'utf8'),
          minified: Buffer.byteLength(minified),
          gzipped: gzipped
        }
      })
    })
}

/**
 * Installs packages with npm to the temp directory.
 *
 * @param {string[]} ids - the list of packages to install.
 */
function install (ids) {
  return execFile(npmBin, ['i', '--no-save', '--prefix', tmp].concat(ids))
}

/**
 * Uses webpack to build a file in memory and return the bundle.
 *
 * @param {object} config - webpack config options.
 * @return {Promise<string>}
 */
function build (config) {
  return new Promise((resolve, reject) => {
    const compiler = webpack(Object.assign(config, {
      output: { filename: 'file' },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
          'process.browser': true
        })
      ]
    }), (err, stats) => {
      if (err || stats.hasErrors()) reject(err || new Error(stats.toString('errors-only')))
      const compilation = stats.compilation
      const compiler = compilation.compiler
      const memoryFs = compiler.outputFileSystem
      const outputFile = compilation.assets.file.existsAt
      resolve(memoryFs.readFileSync(outputFile, 'utf8'))
    })
    compiler.outputFileSystem = new MemoryFs()
  })
}

/**
 * Given package details loads resolved package and entry files.
 *
 * @param {object} pkg - the parsed package details.
 * @return {Promise}
 */
function loadPaths (pkg) {
  const name = pkg.name
  const file = pkg.path
  return resolveFile(tmp, path.join(name, file)).then(entry => ({
    entry: entry,
    package: path.join(tmp, 'node_modules', name, 'package.json')
  }))
}

/**
 * Async resolve a files path using nodes module resolution.
 *
 * @param {string} dir - the directory to look in.
 * @param {string} file - the file to find.
 * @return {Promise<string>}
 */
function resolveFile (dir, file) {
  return new Promise((resolve, reject) => {
    resolver.resolve({}, dir, file, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}
