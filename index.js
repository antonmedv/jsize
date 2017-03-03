var path = require('path');
var fs = require('fs');
var npm = require('npm');
var browserify = require('browserify');
var uglify = require("uglify-js");
var gzipSize = require('gzip-size');

var tmpDir = path.join(__dirname, 'tmp');
var tmpIndexFilePath = path.join(tmpDir, 'index.js');
var tmpBundleFilePath = path.join(tmpDir, 'bundle.js');
var tmpMinifyFilePath = path.join(tmpDir, 'bundle.min.js');

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

function npmInstall(packageName, callback) {
  npm.load({}, function (error, npm) {
    npm.prefix = tmpDir;
    if (packageName) {
      npm.commands.install([packageName], function (err, deps) {
        var location = deps[deps.length - 1][1]
        var packagePath = path.join(path.dirname(tmpDir), location, 'package.json')
        packageName = require(packagePath).name;
        fs.writeFileSync(tmpIndexFilePath, 'require("' + packageName + '");');
        callback(packageName, tmpIndexFilePath);
      });
    } else {
      fs.writeFileSync(tmpIndexFilePath, '');
      callback(packageName, tmpIndexFilePath);
    }
  });
}

function doBrowserify(packageName, indexFile, callback) {
  var bundle = browserify([indexFile], {
    basedir: tmpDir
  }).bundle();
  var stream = fs.createWriteStream(tmpBundleFilePath);
  stream.on('finish', function () {
    callback(packageName, tmpBundleFilePath);
    if (packageName) {
      npm.uninstall(packageName);
    }
  });
  bundle.pipe(stream);
}

function doMinify(packageName, bundleFile, callback) {
  var result = uglify.minify(bundleFile);
  fs.writeFileSync(tmpMinifyFilePath, result.code);
  callback(packageName, tmpMinifyFilePath);
}

function fileSize(file) {
  var stat = fs.statSync(file);
  return stat.size;
}

module.exports = function jsize(packageName, callback) {
  var result = {
    initial: 0,
    minify: 0,
    gzip: 0
  };
  npmInstall(packageName, function (packageName, indexFile) {
    doBrowserify(packageName, indexFile, function (packageName, bundleFile) {
      result.initial = fileSize(bundleFile);
      doMinify(packageName, bundleFile, function (packageName, minifyFile) {
        result.minify = fileSize(minifyFile);
        result.gzip = gzipSize.sync(fs.readFileSync(minifyFile));
        callback(packageName, result);
      });
    });
  });
};
