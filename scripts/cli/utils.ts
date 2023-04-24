import { cpus } from 'node:os'
import chalk from 'chalk'
import { Group, createConsola, setStatus } from '../record'
import { formatPackageName } from '../utils'
import { PackageInfo } from '../types'

export async function runParallel<Source extends { group_title: string }>(
  source: Source[],
  iteratorFn: (
    options: Omit<Source, 'group_title'> & { status: Group }
  ) => Promise<boolean>,
  title: string,
  sub_title?: string,
  maxConcurrency = Math.min(4, cpus().length),
  onError?: (info: PackageInfo) => void
) {
  const consola = createConsola(title, sub_title)
  try {
    const ret = [] as Promise<any>[]
    const executing = [] as Promise<any>[]
    for (const item of source) {
      const { group_title, ...options } = item
      const status = consola.group(group_title)
      const p = Promise.resolve().then(async () => {
        status.loading()
        const result = await iteratorFn({ status, ...options })
        setStatus({ status, result })
      })
      ret.push(p)
      if (maxConcurrency <= source.length) {
        const e: Promise<any> = p.then(() =>
          executing.splice(executing.indexOf(e), 1)
        )
        executing.push(e)
        if (executing.length >= maxConcurrency) {
          await Promise.race(executing)
        }
      }
    }
    await Promise.all(ret)
    consola.end()
  } catch (err: any) {
    const status = consola.group('unknown error')
    error(status, undefined, err, onError)
  }
}

const space_re = /[\n\r]/
const start_at_re = /at.*/
export function error(
  status: Group,
  name?: string,
  err?: Error,
  callback?: (info: PackageInfo) => void
) {
  const info = formatPackageName(name ?? 'root')
  name && callback?.(info)
  const text = status.getMessages().join()
  const { message = 'unset', stack = 'unknow' } = err ?? {}
  const stack_message = stack.split(space_re).filter(message => {
    message = message.trim()
    if (!message) return false
    if (start_at_re.test(message)) return false
    return true
  })
  for (let index = 0; index < stack_message.length; index++) {
    const message = stack_message[index]
    if (index) {
      stack_message[index] = `         ` + message
    } else {
      stack_message[index] = `- stack: ` + message
    }
  }
  status.log(
    `- target: ${chalk.yellow(info.name)}`,
    `- when: ${text}`,
    `- error: ${message}`,
    ...stack_message
  )
}
