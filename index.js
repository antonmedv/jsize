'use strict'

const npm = require('npm')
const path = require('path')
const os = require('os')
const webpack = require('webpack')
const uglify = require('uglify-js')
const gzipSize = require('gzip-size')
const MemoryFs = require('memory-fs')
const Buffer = require('buffer').Buffer
const parsePackageName = require('parse-package-name')
const enhancedResolve = require('enhanced-resolve')

const tmp = path.join(os.tmpdir(), 'jsize-' + Math.random().toString(36).substring(7))

const resolvers = {
  browser: enhancedResolve.ResolverFactory.createResolver({
    fileSystem: new enhancedResolve.NodeJsInputFileSystem(),
    mainFields: ['browser', 'module', 'main']
  }),
  server: enhancedResolve.ResolverFactory.createResolver({
    fileSystem: new enhancedResolve.NodeJsInputFileSystem(),
    mainFields: ['module', 'main']
  })
}

/**
 * Calculates the sizes (initial, minified and gziped) for a given package.
 *
 * @param {string|string[]} pkgs - the package(s) to check the size of.
 * @param {object} config - the webpack config options.
 * @return {Promise}
 */
module.exports = function jsize (pkgs, config) {
  config = config || {}
  // Parse all package details. (allows for single or multiple packages)
  pkgs = [].concat(pkgs).map(parsePackageName)
  // Get unique package ids.
  const ids = pkgs
    .map(it => it.name + '@' + (it.version || 'latest'))
    .filter((id, i, all) => all.indexOf(id) === i)

  // Install modules.
  return install(ids)
  // Lookup install paths for each module.
    .then(() => Promise.all(pkgs.map(pkg => loadPaths(pkg, config))))
    // Extract entry and external files, then build with webpack.
    .then(paths => build(Object.assign(config, {
      entry: paths.map(path => path.entry),
      externals: paths.reduce((externals, path) => {
        const peers = require(path.package).peerDependencies
        if (!peers) return externals
        return externals.concat(Object.keys(peers))
      }, [])
    })))
    // Calculate sizes.
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
 * Installs packages with npm to the temp directory.
 *
 * @param {string[]} ids - the list of packages to install.
 */
function install (ids) {
  return new Promise((resolve, reject) => {
    // Temporarily disable logging.
    const log = console.log
    console.log = () => {}

    npm.load({
      loaded: false,
      progress: false,
      loglevel: 'silent'
    }, (err, npm) => {
      if (err) {
        return reject(err)
      }

      npm.commands.install(tmp, ids, (err, deps) => {
        // Restore logging.
        console.log = log
        if (err) return reject(err)
        resolve(deps)
      })
    })
  })
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
      output: {filename: 'file'},
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
          'process.browser': isBrowserConfig(config)
        })
      ].concat(config.plugins || [])
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
 * @param {object} config - the webpack config.
 * @return {Promise}
 */
function loadPaths (pkg, config) {
  const name = pkg.name
  const file = pkg.path
  return resolveFile(tmp, path.join(name, file), config).then(entry => ({
    entry: entry,
    package: path.join(tmp, 'node_modules', name, 'package.json')
  }))
}

/**
 * Async resolve a files path using nodes module resolution.
 *
 * @param {string} dir - the directory to look in.
 * @param {string} file - the file to find.
 * @param {object} config - the webpack config.
 * @return {Promise<string>}
 */
function resolveFile (dir, file, config) {
  return new Promise((resolve, reject) => {
    const resolver = resolvers[isBrowserConfig(config) ? 'browser' : 'server']
    resolver.resolve({}, dir, file, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

/**
 * Checks if a webpack config targets the browser.
 *
 * @param {string} config - the webpack config.
 * @return {boolean|undefined}
 */
function isBrowserConfig (config) {
  switch (config.target) {
    case 'server':
    case 'node':
    case 'async-node':
    case 'atom':
    case 'electron':
    case 'electron-main':
      return undefined
    default:
      return true
  }
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
