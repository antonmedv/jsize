'use strict'

const test = require('ava')
const util = require('util')
const jsize = require('./index')
const execFile = util.promisify(require('child_process').execFile)

test('programmatic usage', async t => {
  const size = await jsize('react@15')
  t.deepEqual(size, {
    gzipped: 7231,
    initial: 119470,
    minified: 21614
  })
})

test('programmatic usage +', async t => {
  const size = await jsize(['react@15', 'react-dom@15'])
  t.deepEqual(size, {
    gzipped: 43614,
    initial: 686503,
    minified: 144762
  })
})

test('cli usage', async t => {
  const {stdout} = await execFile('bin/jsize', ['react@15'])
  t.regex(stdout, /react@15 *= *7\.23 kB \(gzipped\)/)
})

test('cli usage +', async t => {
  const {stdout} = await execFile('bin/jsize', ['react@15+react-dom@15'])
  t.regex(stdout, /react@15 \+ react-dom@15 *= *43\.6 kB \(gzipped\)/)
})
