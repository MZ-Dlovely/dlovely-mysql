import { EventEmitter } from 'node:events'
import type { Chalk } from 'chalk'
import {
  Consola,
  Group,
  IOStdin,
  IOStdout,
  colorText,
  default_console_config,
} from '.'

export class Message extends EventEmitter {
  constructor(
    protected consola: Consola,
    protected stdin: IOStdin,
    protected stdout: IOStdout,
    public line: number,
    public message?: string,
    last_message?: Group | Message,
    public readonly space_lines = 0,
    protected color: Chalk = default_console_config.content
  ) {
    super()
    this._init()
    if (last_message) {
      last_message.on('line-up', (lines: number) => {
        this._lineUp(lines)
      })
      last_message.on('line-down', (lines: number) => {
        this._lineDown(lines)
      })
    }
  }

  private _lines = 0
  protected __calcLines(
    width = this.stdout.getWindowSize()[0],
    ...messages: string[]
  ) {
    let lines = 0
    for (const message of messages) {
      if (/\n/.test(message)) {
        lines += this.__calcLines(width, ...message.split('\n'))
      } else {
        lines += Math.floor(message.length / width) + 1
      }
    }
    return lines
  }
  private _calcLines(message: string) {
    const [width] = this.stdout.getWindowSize()
    const lines = this.__calcLines(width, message)
    if (lines > this._lines) {
      this.emit('line-down', lines - this._lines)
    } else if (lines < this._lines) {
      this.emit('line-up', this._lines - lines)
    }
    this._lines = lines
    return lines
  }
  public get lines() {
    return this._lines
  }

  protected _init() {
    if (this.message) {
      this._lines = this.__calcLines(undefined, this.message)
      this.stdout.cursorTo(0, this.line)
      this.stdout.write(colorText(this.message, this.color))
      this.is_empty = false
    }
    this._drawAppend('\n'.repeat(this.space_lines + 1))
  }
  protected _drawAppend(message = this.message) {
    if (message) {
      this.stdout.write(colorText(message, this.color))
    }
    if (this.is_empty && message) {
      this.is_empty = false
    }
  }

  private is_empty = true
  protected _draw(message?: string) {
    if (!this._checkActive()) return
    this.clear()
    if (message) {
      this._calcLines(message)
      this.stdout.cursorTo(0, this.line)
      this.stdout.write(colorText(message, this.color))
    }
  }
  public draw(message?: string) {
    if (!this._checkActive()) return
    this.clear()
    if (message && message !== this.message) {
      this._calcLines(message)
      this.stdout.cursorTo(0, this.line)
      this.message = message
      this.stdout.write(colorText(message, this.color))
      this.is_empty = false
    }
  }

  public clear() {
    if (!this._checkActive()) return
    this.stdout.cursorTo(0, this.line)
    if (this.lines > 2)
      this.stdout.write(`\x1b[${this.line}H\x1b[${this.lines - 1}M`)
    this.stdout.clearLine(0)
    this.is_empty = true
  }

  protected _lineUp(lines = 1) {
    this.line -= lines
    this.emit('line-up', lines)
  }
  protected _lineDown(lines = 1) {
    this.line += lines
    this.emit('line-down', lines)
  }

  public active = true
  protected _checkActive() {
    if (!this.active) {
    }
    return this.active
  }
  public delete() {
    if (!this._checkActive()) return
    const lines = 1 + this.space_lines
    this.stdout.write(`\x1b[${this.line}H\x1b[${lines}M`)
    this.emit('line-up', lines)
    this.active = false
  }
}
