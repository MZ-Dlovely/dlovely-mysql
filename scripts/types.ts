export interface PackageJson {
  name: string
  version: `${number}.${number}.${number}`
  description?: string
  private?: true
  main: string
  types: string
  scripts?: Record<string, string>
  keywords?: string[]
  authors?: string[]
  readonly license?: string
  devDependencies?: Record<string, string>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export interface PackageInfo {
  name: string
  path: string
  pkg: string
}
