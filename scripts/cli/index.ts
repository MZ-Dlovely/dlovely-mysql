// @ts-check
import { getPackageJson } from '../utils'
const pkg_root = getPackageJson()

import { cac } from 'cac'
const cli = cac(pkg_root.name)

// cli.command('init', 'init item').action(require('./init.cjs'))

import create from './create'
cli
  .command('create [...names]', 'create new packages')
  .option('-i, --init', 'auto run pnpm install', {
    default: true,
  })
  .action(create)

// cli
//   .command('demo [name]', 'running demo')
//   .option('-i, --init', 'auto run pnpm install', {
//     default: false,
//   })
//   .action(require('./demo.cjs'))

import install from './install'
cli
  .command('install <...dependencies>', 'install dependencies for packages')
  .alias('i')
  .option('-D, --dev', 'devDependencies', { default: false })
  .option('-P, --peer', 'peerDependencies', { default: false })
  .action(install)

import cleanup from './cleanup'
cli
  .command('cleanup [...names]', 'cleanup /dist and /lib for packages')
  .option('-n, --node_modules', 'node_modules', { default: false })
  .action(cleanup)

// import rename from './rename'
// cli.command('rename [name]', 'rename for all packages').action(rename)

cli.help()
cli.version(pkg_root.version)

cli.parse()
