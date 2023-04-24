import path from 'node:path'
import fs from 'node:fs'
import execa from 'execa'
import chalk from 'chalk'
import { Group } from '../record'
import { setPackageJson, formatPackageName } from '../utils'
import { PackageJson } from '../types'
import { runParallel, error } from './utils'

interface Options {
  init: boolean
}
export default async function (packages: string[], { init }: Options) {
  packages = [...new Set(packages)]
  if (!packages?.length) packages = ['self']
  runParallel(
    packages.map(name => ({
      name,
      init,
      group_title: `creating ${name}`,
    })),
    create,
    'Creating New Package'
  )
}

type FnOptions = Options & { name: string; status: Group }
async function create({ name, init, status }: FnOptions) {
  const { name: package_name, path: package_path } = formatPackageName(name)
  try {
    if (fs.existsSync(package_path)) {
      status.log('package ' + chalk.yellow(package_name) + ' is existed')
      return false
    }
    status.log('creating catalogue')
    fs.mkdirSync(package_path)

    status.log('creating package.json')
    const json: PackageJson = {
      name: package_name,
      version: '0.0.1',
      description: '',
      main: 'lib/index.js',
      types: 'types/index.d.ts',
      scripts: {
        build: 'pnpm build:compile && pnpm build:types',
        'build:compile': 'tsc --project ./.tsconfig.compile.json',
        'build:types': 'tsc --project ./.tsconfig.types.json',
      },
      keywords: [],
      authors: ['1556468030@qq.com'],
      license: 'MIT',
    }
    setPackageJson(json, name)

    status.log('creating tsconfig.compile.json')
    const compile_tsconfig = {
      compilerOptions: {
        strict: true,
        lib: ['ESNext', 'DOM'],
        target: 'es2016',
        module: 'commonjs',
        declaration: false,
        outDir: './lib',
        skipLibCheck: true,
        baseUrl: './',
        moduleResolution: 'Node',
        allowJs: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        types: ['node'],
        paths: {},
      },
      include: ['./src/**/*', '../global.d.ts'],
    }
    fs.writeFileSync(
      path.join(package_path, '.tsconfig.compile.json'),
      JSON.stringify(compile_tsconfig, null, 2)
    )

    status.log('creating tsconfig.types.json')
    const types_tsconfig = {
      compilerOptions: {
        strict: true,
        lib: ['ESNext', 'DOM'],
        target: 'es2016',
        module: 'commonjs',
        declaration: true,
        emitDeclarationOnly: true,
        outDir: './types',
        skipLibCheck: true,
        baseUrl: './',
        moduleResolution: 'Node',
        allowJs: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        types: ['node'],
        paths: {},
      },
      include: ['./src/**/*', '../global.d.ts'],
    }
    fs.writeFileSync(
      path.join(package_path, '.tsconfig.types.json'),
      JSON.stringify(types_tsconfig, null, 2)
    )

    status.log('creating dir src')
    fs.mkdirSync(path.join(package_path, 'src'))
    fs.writeFileSync(
      path.join(package_path, 'src', 'index.ts'),
      `export default '${package_name}'\n`
    )

    status.log('init dependencies')
    if (init) await execa('pnpm', ['i', '-F', package_name])

    status.log('package ' + chalk.yellow(package_name) + ' is created')
    return true
  } catch (err: any) {
    error(status, name, err, info => {
      fs.rmdirSync(info.path)
    })
    return false
  }
}
