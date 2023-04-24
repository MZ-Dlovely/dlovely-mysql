import execa from 'execa'
import { Group } from '../record'
import { setPackageJson, getPackageJson } from '../utils'
import { PackageJson } from '../types'
import { runParallel, error } from './utils'

interface Options {
  dev: boolean
  peer: boolean
  '--': string[]
}
export default async function (dependencies: string[], options: Options) {
  dependencies = [...new Set(dependencies)]
  if (!dependencies.length) return
  const { dev, peer } = options
  let packages = [...new Set(options['--'])]
  if (!packages.length) packages = ['root']
  const pkg = getPackageJson()
  runParallel(
    packages.map(name => ({
      name,
      pkg,
      dev,
      peer,
      dependencies,
      group_title: `creating ${name}`,
    })),
    install,
    'Creating New Package'
  )
}

type FnOptions = {
  dev: boolean
  peer: boolean
  dependencies: string[]
  pkg: PackageJson
} & { name: string; status: Group }
async function install({
  name,
  status,
  dev,
  peer,
  dependencies,
  pkg,
}: FnOptions) {
  let text: string
  try {
    let promise: execa.ExecaChildProcess<string>
    if (name === 'root') {
      text = 'root'
      promise = execa('pnpm', ['i', dev ? '-wD' : '-w', ...dependencies])
    } else if (name === 'self') {
      text = pkg.name
      promise = execa(
        'pnpm',
        ['i', '-F', pkg.name, dev ? '-D' : '', ...dependencies].filter(Boolean)
      )
    } else {
      text = name
      promise = execa(
        'pnpm',
        [
          'i',
          '-F',
          `@${pkg.name}/${name}`,
          dev ? '-D' : '',
          ...dependencies,
        ].filter(Boolean)
      )
    }
    status.log('installing for ' + text)
    await promise
    if (peer) {
      status.log('changed peer for' + text)
      const pkg = getPackageJson(name)
      if (!pkg.peerDependencies) pkg.peerDependencies = {}
      for (const dep of dependencies) {
        const dep_version =
          pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]
        if (dep_version) pkg.peerDependencies[dep] = dep_version
        setPackageJson(pkg, name)
      }
    }
    status.log(`${text} install finished`)
    return true
  } catch (err: any) {
    error(status, name, err)
    return false
  }
}
