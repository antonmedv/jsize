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
✔ lodash                         24.7 kB (gzip)
✔ lodash/map                     5.86 kB (gzip)
✔ @rill/http/adapter/document    5.5 kB (gzip)
```

## Options

### `-v, --verbose`

Display initial size, minified size and gzip size.

```
$ jsize jquery -v
✔ jquery    271 kB (initial)    87.3 kB (minify)    30.6 kB (gzip)
```

## Peer Dependencies

One common issue is getting the size of a module when it has a peer dependency such as react-dom.

Be sure to include the peerDependencies first when checking the size like so:

```
$ jsize react react-dom
✔ react        13.6 kB (gzip)
✔ react-dom    64.2 kB (gzip)
```
