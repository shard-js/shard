#!/usr/bin/env node

const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const yargs = require('yargs')
const process = require('process')

const root = (...filesOrDirs) => path.resolve(process.cwd(), ...filesOrDirs)

const src = (...filesOrDirs) => path.join(root('src'), ...filesOrDirs)

const dist = (...filesOrDirs) => path.join(root('dist'), ...filesOrDirs)

const libRegex = /^(.*\/)?(.*)$/

const libName = (function () {
  const fullName = require(root('package.json')).name
  return libRegex.exec(fullName)[2]
})()

function createConfig ({ target }) {
  return {
    entry: src('index.js'),
    mode: 'production',
    target,
    context: root(),
    output: {
      path: dist(),
      filename: `${libName}.${target}.js`,
      library: libName,
      libraryTarget: 'umd'
    },
    module: {
      rules: [
        { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
      ]
    },
    plugins: [
      new CleanWebpackPlugin()
    ]
  }
}

// eslint-disable-next-line
yargs
  .scriptName('shard')
  .usage('$0 <cmd> [args]')
  .command(
    'build',
    'build the library in current directory',
    (yargs) => {
      return yargs.options({
        node: {
          type: 'boolean',
          default: false
        },
        web: {
          type: 'boolean',
          default: false
        }
      })
    },
    (argv) => {
      const { web, node } = argv
      const targets = (function () {
        if (!web && !node) return ['web', 'node']
        return [
          { value: 'web', show: web },
          { value: 'node', show: node }
        ]
          .filter(({ show }) => show)
          .map(({ value }) => value)
      })()

      const configs = targets
        .map((target) => createConfig({ target }))

      webpack(configs)
        .run((err, stats) => {
          if (err) {
            console.log(err)
          } else {
            console.log(stats.toString({
              colors: true
            }))
          }
        })
    }
  )
  .help()
  .argv
