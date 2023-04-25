import type { ConnectionOptions } from 'mysql2/typings/mysql/lib/Connection'
import type { PoolOptions } from 'mysql2/typings/mysql/lib/Pool'
import { MysqlInstace, MysqlServer, MysqlPool } from './mysql'
import { TableColumns } from '@mysql-manager/shared'
import { Table } from './table'

export type DataBaseOptions = Omit<
  ConnectionOptions | PoolOptions,
  'database'
> &
  Required<Pick<ConnectionOptions | PoolOptions, 'database'>>

export class DataBase {
  public readonly server
  constructor(
    server: MysqlInstace | DataBaseOptions,
    private _is_pool: boolean,
    public readonly name: string
  ) {
    if ('active' in server) {
      this.server = server
    } else if (_is_pool) {
      this.server = new MysqlPool(server, true)
    } else {
      this.server = new MysqlServer(server, true)
    }
  }

  public get is_pool() {
    return this._is_pool
  }

  public createTable<Columns extends TableColumns>(
    name: string,
    columns: Columns
  ) {
    return new Table(this, name, columns)
  }

  // TODO 添加表
}

export const createDataBase = (options: DataBaseOptions, is_pool = true) =>
  new DataBase(options, is_pool, options.database)
