import type { Sql, SqlWithParams } from './virtual-sql'
import { type Where, formatWhereOptions } from './where'

export namespace Delete {
  export interface Options {
    table: string
    where: Sql | Where.Options
  }
}

export const formatDelete = (options: Delete.Options): SqlWithParams => {
  const { table, where } = options
  const { sql, params } = formatWhereOptions(where)
  return {
    sql: `DELETE FROM ${table} ${sql}`,
    params,
  }
}
