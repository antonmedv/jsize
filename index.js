'use strict'

const npm = require('npm')
const path = require('path')
const tmp = require('os').tmpdir()
const webpack = require('webpack')
const uglify = require('uglify-js')
const gzipSize = require('gzip-size')
const MemoryFs = require('memory-fs')
const Buffer = require('buffer').Buffer
const parsePackageName = require('parse-package-name')
const enhancedResolve = require('enhanced-resolve')
const resolver = enhancedResolve.ResolverFactory.createResolver({
  fileSystem: new enhancedResolve.NodeJsInputFileSystem(),
  mainFields: ['browser', 'module', 'main']
})

/**
 * Calculates the sizes (initial, minified and gziped) for a given package.
 *
 * @param {string} pkg - the package to check the size of.
 * @return {Promise}
 */
module.exports = function jsize (pkg) {
  const parsed = parsePackageName(pkg)
  const name = parsed.name
  const version = parsed.version
  const file = parsed.path
  return install(`${name}@${version || 'latest'}`)
    .then(() => build(name, file))
    .then(script => {
      const minimized = uglify.minify(script).code
      return getGzippedSize(minimized).then(gzipped => {
        return {
          initial: Buffer.byteLength(script, 'utf8'),
          minified: Buffer.byteLength(minimized),
          gzipped: gzipped
        }
      })
    })
}

/**
 * Installs a package with npm to the temp directory.
 *
 * @param {string} id - the package to install.
 */
function install (id) {
  return new Promise((resolve, reject) => {
    // Temporarily disable logging.
    const log = console.log
    console.log = () => {}

    npm.load({
      loaded: false,
      progress: false,
      loglevel: 'silent'
    }, (err, npm) => {
      if (err) return reject(err)

      npm.commands.install(tmp, [id], (err, deps) => {
        // Restore logging.
        console.log = log
        if (err) return reject(err)
        resolve(deps)
      }
    )
    })
  })
}

/**
 * Uses webpack to build a file in memory and return the bundle.
 *
 * @param {*} name - library folder name
 * @param {*} file - entry point path relative to the library folder
 * @return {Promise<string>}
 */
function build (name, file) {
  return Promise.all([
    resolve(tmp, path.join(name, file)),
    resolve(tmp, path.join(name, 'package.json'))
  ]).then(results => {
    const entry = results[0]
    const peers = require(results[1]).peerDependencies
    const externals = Object.keys(peers || {})

    return new Promise((resolve, reject) => {
      const compiler = webpack({
        target: 'web',
        output: { filename: 'file' },
        entry: entry,
        externals: externals,
        plugins: [
          new webpack.optimize.UglifyJsPlugin({ sourcemap: false }),
          new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"', 'process.browser': true })
        ]
      }, (err, stats) => {
        if (err || stats.hasErrors()) reject(err || new Error(stats.toString('errors-only')))
        const compilation = stats.compilation
        const compiler = compilation.compiler
        const memoryFs = compiler.outputFileSystem
        const outputFile = compilation.assets.file.existsAt
        resolve(memoryFs.readFileSync(outputFile, 'utf8'))
      })
      compiler.outputFileSystem = new MemoryFs()
    })
  })
}

/**
 * Async resolve a files path using nodes module resolution.
 * @param {string} dir - the directory to look in.
 * @param {string} file - the file to find.
 * @return {Promise<string>}
 */
function resolve (dir, file) {
  return new Promise((resolve, reject) => {
    resolver.resolve({}, dir, file, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

/**
 * Calculates the gzipped size of a string.
 *
 * @param {string} str - the string to check.
 * @return {Promise<number>}
 */
function getGzippedSize (str) {
  return new Promise((resolve, reject) => {
    gzipSize(str, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}
