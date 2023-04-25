import { createConnection, createPool } from 'mysql2/promise'
import type { Connection } from 'mysql2/promise'
import type { ConnectionOptions } from 'mysql2/typings/mysql/lib/Connection'
import type { PoolOptions } from 'mysql2/typings/mysql/lib/Pool'
import { DataBase } from './database'

export interface MysqlInstace {
  readonly active: boolean
  getConnection(): Promise<{
    connection: Connection
    release: () => void
  }>
  createDataBase(name: string): DataBase
}

export class MysqlServer implements MysqlInstace {
  public config
  constructor(config: ConnectionOptions, is_database = false) {
    is_database || Reflect.deleteProperty(config, 'database')
    this.config = config
  }

  private _connection?: Connection
  public async getConnection() {
    const connection =
      this._connection ??
      (this._connection = await createConnection(this.config))
    const release = () => {
      this._connection = undefined
    }
    return { connection, release }
  }

  private _active = false
  public get active() {
    return this._active
  }

  public createDataBase(name: string): DataBase {
    return new DataBase(this, false, name)
  }
}

export const createMysqlServer = (config: ConnectionOptions) =>
  new MysqlServer(config)

export class MysqlPool implements MysqlInstace {
  public pool
  constructor(config: PoolOptions, is_database = false) {
    is_database || Reflect.deleteProperty(config, 'database')
    this.pool = createPool(config)
  }

  public async getConnection() {
    const { connection, release } = await this.pool.getConnection()
    return { connection, release }
  }

  private _active = false
  public get active() {
    return this._active
  }

  public createDataBase(name: string): DataBase {
    return new DataBase(this, true, name)
  }
}

export const createMysqlPool = (config: PoolOptions) => new MysqlPool(config)

export type { ConnectionOptions, PoolOptions }
