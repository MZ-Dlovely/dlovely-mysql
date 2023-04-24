import fs from 'node:fs'
import path from 'node:path'

import type { PackageJson, PackageInfo } from './types'

export const packages_path = path.resolve(__dirname, '../packages')
const pkg_root_path = path.resolve(__dirname, '../package.json')

export const encoding: BufferEncoding = 'utf-8'

/**
 * 对包名(包括简称)格式化
 */
export function formatPackageName(package_name: string): PackageInfo {
  if (package_name === 'root')
    return {
      name: 'root',
      path: path.resolve(__dirname, '..'),
      pkg: pkg_root_path,
    }
  else {
    const { name } = JSON.parse(
      fs.readFileSync(pkg_root_path, { encoding }) || '{}'
    ) as PackageJson
    const package_path = path.join(
      packages_path,
      package_name === 'self' ? name : package_name
    )
    return {
      name: package_name === 'self' ? name : `@${name}/${package_name}`,
      path: package_path,
      pkg: path.join(package_path, 'package.json'),
    }
  }
}

/**
 * 获取指定包的package.json文件
 */
export function getPackageJson(
  package_name: string | PackageInfo = 'root'
): PackageJson {
  const { pkg: pkg_path } =
    typeof package_name === 'string'
      ? formatPackageName(package_name)
      : package_name
  return JSON.parse(fs.readFileSync(pkg_path, { encoding }) || '{}')
}

/**
 * 设置指定包的package.json文件
 */
export function setPackageJson(
  pkg: PackageJson,
  package_name: string | PackageInfo = 'root'
) {
  const { pkg: pkg_path } =
    typeof package_name === 'string'
      ? formatPackageName(package_name)
      : package_name
  return fs.writeFileSync(pkg_path, JSON.stringify(pkg, null, 2), { encoding })
}

export function getPackages() {
  const packages = [] as string[]
  for (const dir of fs.readdirSync(packages_path)) {
    const package_path = path.join(packages_path, dir)
    const stat = fs.statSync(package_path)
    if (stat.isDirectory()) packages.push(dir)
  }
  return packages
}

export function sleep(delay = 1000) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, delay)
  })
}
