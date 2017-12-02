'use strict'

const test = require('ava')
const util = require('util')
const jsize = require('./index')
const execFile = util.promisify(require('child_process').execFile)

test('programmatic usage', async t => {
  const size = await jsize('react@15.6.2')
  t.deepEqual(size, {
    gzipped: 7502,
    initial: 117471,
    minified: 22339
  })
})

test('programmatic usage +', async t => {
  const size = await jsize(['react@15.6.2', 'react-dom@15.6.2'])
  t.deepEqual(size, {
    gzipped: 44404,
    initial: 668109,
    minified: 146936
  })
})

test('cli usage', async t => {
  const {stdout} = await execFile('bin/jsize', ['react@15.6.2'])
  t.regex(stdout, /react@15\.6\.2 *= *7\.5 kB \(gzipped\)/)
})

test('cli usage +', async t => {
  const {stdout} = await execFile('bin/jsize', ['react@15.6.2+react-dom@15.6.2'])
  t.regex(stdout, /react@15\.6\.2 \+ react-dom@15\.6\.2 *= *44\.4 kB \(gzipped\)/)
})
