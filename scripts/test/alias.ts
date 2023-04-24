import path from 'node:path'
import { getPackageJson, getPackages, packages_path } from '../utils'

const pkg = getPackageJson()

const alias = {
  [pkg.name]: path.join(packages_path, pkg.name),
}

for (const dir of getPackages()) {
  const key = `@${pkg.name}/${dir}`
  const val = path.join(packages_path, dir, 'src')
  alias[key] = val
}

export default alias
