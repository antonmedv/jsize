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
✔ jquery                         30.6 kB (gzip)
✔ lodash                         24.8 kB (gzip)
✔ lodash/map                     5.88 kB (gzip)
✔ @rill/http/adapter/document    5.51 kB (gzip)
```

## Options

### `-v, --verbose`

Display initial size, minified size and gzip size.

```
$ jsize jquery -v
✔ jquery    271 kB (initial)    87.3 kB (minify)    30.6 kB (gzip)
```

## Peer Dependencies

When a package has `peerDependencies` they are automatically not included in the bundle size.
To have a better idea of the total size of all dependencies you must add up all peers as well.

```
$ jsize react react-dom
✔ react        7.22 kB (gzip)
✔ react-dom    43.9 kB (gzip)
```

Where the total for `react` in the browser is `51.12kb (gzip)`.
