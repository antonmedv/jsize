> **Abandoned**. Use package-size instead. 

# jsize

To install:
```
npm install -g jsize
```
## Usage

```
$ jsize jquery angular react monkberry temple-wat
jquery 	   29.88 kB (gzip)
angular    48.95 kB (gzip)
react      51.29 kB (gzip)
monkberry  1.26 kB (gzip)
temple-wat 821 B (gzip)
```

## Options

### `-v, --verbose`

Display initial size, minified size and gzip size.

```
$ jsize jquery -v
jquery 	 248.17 kB (initial)	84.74 kB (minify)	29.88 kB (gzip)
```
