import chalk from 'chalk'
import { Group } from '../record'
import { formatPackageName, setPackageJson, getPackages } from '../utils'
import { runParallel, error } from './utils'
import { getPackageJson } from '../utils'

export default async function (new_name: string) {
  const packages = getPackages()
  const old_name = getPackageJson().name
  runParallel(
    packages.map(name => ({
      name,
      new_name,
      old_name,
      group_title: `rename for ${name}`,
    })),
    rename,
    'Creating New Package'
  )
}

type FnOptions = {
  name: string
  status: Group
  new_name: string
  old_name: string
}
async function rename({ name, status, new_name, old_name }: FnOptions) {
  const pkg_info = formatPackageName(name)
  const pkg = getPackageJson(pkg_info)
  try {
    status.log('renameing for ' + chalk.yellow(pkg_info.name))
    if (name === 'root') {
      pkg.name = new_name
    } else if (name === 'self' || name === old_name) {
      pkg.name = new_name
    } else {
      pkg.name = `@${new_name}/${name}`
    }
    setPackageJson(pkg, pkg_info)
    status.log(`${chalk.yellow(pkg.name)} rename finished`)
    return true
  } catch (err: any) {
    error(status, name, err)
    return false
  }
}
