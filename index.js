'use strict'

const Buffer = require('buffer').Buffer
const gzipSize = require('gzip-size')
const npm = require('npm')
const MemoryFs = require('memory-fs')
const parsePackageName = require('parse-package-name')
const path = require('path')
const requireRelative = require('require-relative')
const uglify = require('uglify-js')
const webpack = require('webpack')
const tmp = require('os').tmpdir()
function noop () {}

/**
 * Calculates the sizes (initial, minified and gziped) for a given package.
 *
 * @param {string} pkg - the package to check the size of.
 * @return {Promise}
 */
module.exports = function jsize (pkg) {
  const { name, version, path: file } = parsePackageName(pkg)
  return install(`${name}@${version || 'latest'}`)
    .then(() => build(path.join(name, file)))
    .then(script => {
      const minimized = uglify.minify(script).code

      return {
        initial: Buffer.byteLength(script, 'utf8'),
        minify: Buffer.byteLength(minimized),
        gzip: gzipSize.sync(minimized)
      }
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
    console.log = noop

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
 * @param {*} file - the entry file to build.
 * @return {Promise<string>}
 */
function build (file) {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      target: 'web',
      output: { filename: 'file' },
      entry: requireRelative.resolve(file, tmp),
      plugins: [
        new webpack.optimize.UglifyJsPlugin({ mangle: true, sourcemap: false }),
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
}
