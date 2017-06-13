# jsize

To install:
```
npm install -g jsize
```

## Features
* [Scoped packages](https://docs.npmjs.com/misc/scope).
* Individual files within packages.
* Multiple packages at once.

## Usage

```
$ jsize jquery lodash lodash/map @rill/http/adapter/document
jquery                         30.6 kB (gzip)
lodash                         25.3 kB (gzip)
lodash/map                     5.91 kB (gzip)
@rill/http/adapter/document    5.52 kB (gzip)
```

## Options

### `-v, --verbose`

Display initial size, minified size and gzip size.

```
$ jsize jquery -v
jquery    271 kB (initial)    87.3 kB (minify)    30.6 kB (gzip)
```
