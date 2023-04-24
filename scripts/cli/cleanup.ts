import path from 'node:path'
import execa from 'execa'
import chalk from 'chalk'
import { Group } from '../record'
import { formatPackageName, getPackages } from '../utils'
import { runParallel, error } from './utils'

export default async function (packages: string[], node_modules: boolean) {
  packages = [...new Set(packages)]
  if (!packages?.length) {
    packages = getPackages()
  }
  runParallel(
    packages.map(name => ({
      name,
      node_modules,
      group_title: `cleanup for ${name}`,
    })),
    cleanup,
    'Creating New Package'
  )
}

type FnOptions = { name: string; status: Group; node_modules: boolean }
async function cleanup({ name, status, node_modules }: FnOptions) {
  const { name: package_name, path: package_path } = formatPackageName(name)
  try {
    status.log('cleanuping for ' + chalk.yellow(package_name))
    await execa('rimraf', ['-rf', path.join(package_path, 'lib')])
    await execa('rimraf', ['-rf', path.join(package_path, 'types')])
    if (node_modules)
      await execa('rimraf', ['-rf', path.join(package_path, 'node_modules')])
    status.log(`${chalk.yellow(package_name)} cleanup finished`)
    return true
  } catch (err: any) {
    error(status, name, err)
    return false
  }
}
