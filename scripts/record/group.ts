import { Readable } from 'node:stream'
import type { Chalk } from 'chalk'
import { Consola, IOStdin, IOStdout, Message, default_console_config } from '.'
import chalk from 'chalk'

export class Group extends Message {
  constructor(
    consola: Consola,
    stdin: IOStdin,
    stdout: IOStdout,
    line: number,
    message?: string,
    last_message?: Message,
    space_line = 0,
    private messages: Message[] = [],
    group_color: Chalk = default_console_config.group,
    private content_color: Chalk = default_console_config.content
  ) {
    super(
      consola,
      stdin,
      stdout,
      line,
      message,
      last_message,
      space_line,
      group_color
    )
  }

  public get size() {
    return this.messages.length
  }
  public get lines() {
    return this.messages.reduce(
      (pre, msg) => pre + msg.lines + msg.space_lines,
      0
    )
  }
  public getMessages() {
    return this.messages.map(msg => msg.message).filter(Boolean) as string[]
  }

  protected _lineUp(lines = 1) {
    this.line -= lines
    // @ts-expect-error 迫不得已
    this.messages.at(0)?._lineUp(lines)
    this.emit('line-up', lines)
  }
  protected _lineDown(lines = 1) {
    this.line += lines
    // @ts-expect-error 迫不得已
    this.messages.at(0)?._lineDown(lines)
    this.emit('line-down', lines)
  }

  public log(...messages: string[]) {
    if (!this._checkActive()) return
    this.cancelListen()
    const lines = messages.length
    const calc_lines = this.__calcLines(undefined, ...messages)
    const rest_lines = this.lines - calc_lines
    if (rest_lines < 0) {
      const start_line = this.line + this.space_lines + this.lines + 1
      this.stdout.cursorTo(0, start_line)
      this.stdout.write(`\x1b[${-rest_lines}L`)
      this.emit('line-down', -rest_lines)
    }
    let line = this.line + this.space_lines + 1
    for (let index = 0; index < lines; index++) {
      const message = '    ' + messages[index]
      let msg = this.messages.at(index)
      if (msg) {
        msg.draw(message)
      } else {
        this.messages[index] = msg = new Message(
          this.consola,
          this.stdin,
          this.stdout,
          line,
          message,
          this.messages.at(index - 1),
          0,
          this.content_color
        )
      }
      line += msg.lines + msg.space_lines
    }
    if (rest_lines > 0) {
      const start_line = this.line + this.space_lines + calc_lines + 2
      this.stdout.write(`\x1b[${start_line}H\x1b[${rest_lines}M`)
      this.emit('line-up', rest_lines)
    }
  }

  public append(...messages: string[]) {
    if (!this._checkActive()) return
    const lines = messages.length
    const start_line = this.line + this.space_lines + this.size + 1
    this.stdout.cursorTo(0, start_line)
    this.stdout.write(`\x1b[${lines}L`)
    this.emit('line-down', lines)
    const msgs = [] as Message[]
    for (let index = 0; index < lines; index++) {
      const msg = new Message(
        this.consola,
        this.stdin,
        this.stdout,
        start_line + index,
        messages[index],
        this.messages.at(-1),
        0,
        this.content_color
      )
      this.messages.push(msg)
      msgs.push(msg)
    }
    return msgs
  }

  private listening?: Readable
  private listener?: (chunk: Buffer) => void
  public listen(listening: Readable) {
    if (this.listening && this.listener)
      this.listening.off('data', this.listener)
    this.listening = listening
    const message_cache = new Map<string, Message>()
    this.listener = chunk => {
      const message = chunk.toString()
      const key = message.split(/[\s:：]/, 1)[0]
      if (!key) return
      const msg = message_cache.get(key)
      if (msg) {
        msg.draw(message)
      } else {
        const msgs = this.append(message)
        if (msgs && msgs[0]) {
          message_cache.set(key, msgs[0])
        }
      }
    }
    this.listening.on('data', this.listener)
    this.listening.on('end', () => this.cancelListen())
  }
  public cancelListen() {
    if (this.listening && this.listener)
      this.listening.off('data', this.listener)
    this.listening = undefined
    this.listener = undefined
  }

  public remove() {
    if (!this._checkActive()) return
    const start_line = this.line + this.space_lines + 2
    const lines = this.size
    this.stdout.write(`\x1b[${start_line}H\x1b[${lines}M`)
    this.messages.length = 0
    this.emit('line-up', lines)
  }

  public delete() {
    if (!this._checkActive()) return
    const start_line = this.line + this.space_lines + 1
    const lines = this.size + 1
    this.stdout.write(`\x1b[${start_line}H\x1b[${lines}M`)
    this.messages.length = 0
    this.emit('line-up', lines)
    this.active = false
  }

  private loader?: NodeJS.Timer
  public loading() {
    if (!this._checkActive()) return
    if (this.loader) clearInterval(this.loader)
    const load_msgs = ['⇑', '⇗', '⇒', '⇘', '⇓', '⇙', '⇐', '⇖']
    let load_now = 0
    this.loader = setInterval(() => {
      const message = load_msgs[load_now % load_msgs.length]
      this._draw('  ' + chalk.cyan.bold(message) + this.message)
      load_now += 1
    }, 100)
  }
  public success() {
    if (!this._checkActive()) return
    if (this.loader) {
      clearInterval(this.loader)
      this.loader = undefined
    }
    this._draw('  ' + chalk.green.bold('√') + this.message)
    this.consola.emit('success')
    this.active = false
  }
  public fail() {
    if (!this._checkActive()) return
    if (this.loader) {
      clearInterval(this.loader)
      this.loader = undefined
    }
    this._draw('  ' + chalk.red.bold('×') + this.message)
    this.consola.emit('fail')
    this.active = false
  }
}
