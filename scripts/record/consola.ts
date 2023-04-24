import { EventEmitter } from 'node:events'
import chalk, { type Chalk } from 'chalk'
import { type IOStdout, colorText, Message, Group, IOStdin } from '.'

export interface ConsolaColors {
  title: Chalk
  sub_title: Chalk
  group: Chalk
  content: Chalk
  summarize: Chalk
}
export const default_console_config = {
  title: chalk.bold.blue,
  sub_title: chalk.cyan,
  group: chalk.green,
  content: chalk.blue,
  summarize: chalk.grey,
}
export class Consola extends EventEmitter {
  width = 0
  height = 0
  config: ConsolaColors
  messages = [] as (Message | Group)[]

  constructor(
    private stdin: IOStdin,
    private stdout: IOStdout,
    private title: string,
    private sub_title?: string,
    config?: Partial<ConsolaColors>
  ) {
    super()
    this.config = {
      ...default_console_config,
      ...(config ?? {}),
    }
    this._initSize()
    // ? 不生效
    this.stdout.on('resize', this._initSize.bind(this))
    this.on('success', () => {
      this.group_status.successed += 1
    })
    this.on('fail', () => {
      this.group_status.failed += 1
    })
  }

  private _initSize() {
    const [width, height] = this.stdout.getWindowSize()
    this.width = width
    this.height = height
    this.clearScreen()
    this.stdout.write('\x1b[?1049h')
    const title = new Message(
      this,
      this.stdin,
      this.stdout,
      0,
      colorText(this.title, this.config.title),
      undefined,
      this.sub_title ? 0 : 1
    )
    this.messages.push(title)
    if (this.sub_title) {
      const sub_title = new Message(
        this,
        this.stdin,
        this.stdout,
        1,
        colorText(this.sub_title, this.config.sub_title),
        title,
        1
      )
      this.messages.push(sub_title)
    }
  }

  public get last_line() {
    let lines = 0
    for (const message of this.messages) {
      if (message instanceof Group) {
        lines += message.space_lines + 1 + message.lines
      } else {
        lines += message.space_lines + message.lines
      }
    }
    return lines
  }

  public clearScreen() {
    this.stdout.cursorTo(0, 0)
    this.stdout.clearScreenDown()
  }
  public goEnd() {
    this.stdout.cursorTo(this.width, this.height - 3)
  }

  public group(message: string, messages?: Message[]) {
    const last_msg = this.messages.at(-1)
    const msg = new Group(
      this,
      this.stdin,
      this.stdout,
      this.last_line,
      '  ' + message,
      last_msg,
      0,
      messages,
      this.config.group,
      this.config.content
    )
    this.messages.push(msg)
    this.group_status.total += 1
    return msg
  }

  public log(message: string) {
    const msg = new Message(
      this,
      this.stdin,
      this.stdout,
      this.last_line,
      '  ' + message,
      this.messages.at(-1),
      0,
      this.config.content
    )
    this.messages.push(msg)
    return msg
  }

  private group_status = {
    total: 0,
    successed: 0,
    failed: 0,
  }
  public end() {
    const { total, successed, failed } = this.group_status
    const message = `Total: ${total}, Successed: ${successed}, Failed: ${failed}`
    const msg = new Message(
      this,
      this.stdin,
      this.stdout,
      this.last_line,
      `\n${message}\nPress any key to exit...`,
      this.messages.at(-1),
      0,
      this.config.summarize
    )
    this.messages.push(msg)
    const wait = () => {
      this.stdout.write('\x1b[?1049l')
      process.exit(0)
    }
    this.stdin.on('data', wait)
  }
}

let consola: Consola
export function createConsola(title: string, sub_title?: string | undefined) {
  if (!consola)
    consola = new Consola(process.stdin, process.stdout, title, sub_title)
  return consola
}

export function setStatus({
  status,
  result,
}: {
  status: Group
  result?: boolean
}) {
  if (result) {
    status.success()
  } else {
    status.fail()
  }
}
