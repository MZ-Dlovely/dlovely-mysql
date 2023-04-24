import { type Chalk } from 'chalk'
export * from './message'
export * from './consola'
export * from './group'

export type IOStdin = NodeJS.ReadStream
export type IOStdout = NodeJS.WriteStream

export function colorText(text: string, color?: Chalk) {
  if (color) return color(text)
  else return text
}
