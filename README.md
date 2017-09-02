<h1 align="center">
  <a href="https://github.com/antonmedv/jsize">
    <img src="https://user-images.githubusercontent.com/141232/29957332-1d50d0be-8f17-11e7-91cc-2329a01d5b23.png" width="600">
  </a>
</h1>

To install:
```
npm install -g jsize
```

## Features
* [Scoped packages](https://docs.npmjs.com/misc/scope)
* Individual files within packages
* Multiple packages at once
* Easy CLI and programatic usage

## CLI Usage

```
$ jsize jquery lodash lodash/map @rill/http/adapter/document
✔ jquery                         30.6 kB (gzipped)
✔ lodash                         24.8 kB (gzipped)
✔ lodash/map                     5.88 kB (gzipped)
✔ @rill/http/adapter/document    5.51 kB (gzipped)
```

### Options

### `-v, --verbose`

Display initial size, minified size and gzip size.

```
$ jsize jquery -v
✔ jquery    271 kB (initial)    87.3 kB (minified)  30.6 kB (gzipped)
```

## Programtic Usage

```js
import jsize from 'jsize'

jsize('lodash').then(({ initial, minified, gzipped }) => {
  // Work with values (all in bytes).
})

// Also supports multiple entries.
jsize(['lodash/map', 'lodash/filter']).then(({ initial, minified, gzipped }) => {
  // Work with values (all in bytes).
})
```

## Total size of multiple entries.

You can add up multiple entries by using `+` between entry names.
This is useful because in some cases like in lodash there is a runtime which is a one time cost.

```js
$ jsize lodash/map+lodash/assign+lodash/filter
✔ lodash/map + lodash/assign + lodash/filter    6.63 kB (gzipped)
```

Sizes look much larger when comparing individually because it doesn't account for the shared runtime.

```js
$ jsize lodash/map lodash/assign lodash/filter
✔ lodash/map       5.89 kB (gzipped)
✔ lodash/assign    2.78 kB (gzipped)
✔ lodash/filter    5.85 kB (gzipped)
```

## Peer Dependencies

When a package has `peerDependencies` they are automatically excluded from the bundle size.
To have a better idea of the total size of all dependencies you must add up all peers as well.

```
$ jsize react
✔ react    7.23 kB (gzipped)
$ jsize react+react-dom
✔ react + react-dom  43.6 kB (gzipped)
```

## License

Licensed under the [MIT license](https://github.com/antonmedv/jsize/blob/master/LICENSE).
