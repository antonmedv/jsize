const path = require('path');
const fs = require('fs');
const os = require('os');
const npm = require('npm');
const webpack = require('webpack');
const uglify = require('uglify-js');
const gzipSize = require('gzip-size');

const tmp = os.tmpdir();
const index = path.join(tmp, 'index.js');
const bundle = path.join(tmp, 'bundle.js');
const minimized = path.join(tmp, 'bundle.min.js');

function install(packageName) {
  return new Promise((resolve, reject) => {
    const log = console.log;
    console.log = () => {
    };
    npm.load({
        loaded: false,
        progress: false,
        loglevel: 'silent'
      },
      (err, npm) => {
        if (err) {
          return reject(err);
        }
        npm.commands.install(
          tmp,
          [packageName],
          (err, deps) => {
            console.log = log;
            if (err) {
              return reject(err);
            }
            resolve(deps);
          }
        );
      });
  });
}

function create(packageName) {
  return new Promise((resolve) => {
    fs.writeFile(
      index,
      `window.package = require('${packageName}');`,
      () => resolve()
    );
  });
}

function build() {
  return new Promise((resolve, reject) => {
    webpack({
      entry: index,
      output: {
        path: path.dirname(bundle),
        filename: path.basename(bundle)
      },
      plugins: [
        new webpack.optimize.UglifyJsPlugin({mangle: false, sourcemap: false}),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': 'production',
          'process.browser': true
        })
      ]
    }, (err, stats) => {
      if (err || stats.hasErrors()) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function minify() {
  const result = uglify.minify(bundle);
  fs.writeFileSync(minimized, result.code);
}

function size(file) {
  const stat = fs.statSync(file);
  return stat.size;
}

module.exports = async function jsize(packageName) {
  const result = {
    initial: 0,
    minify: 0,
    gzip: 0
  };
  await install(packageName);
  await create(packageName);
  await build();
  result.initial = size(bundle);
  minify();
  result.minify = size(minimized);
  result.gzip = gzipSize.sync(fs.readFileSync(minimized, 'utf8'));
  return result;
};
