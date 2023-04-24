import { hasOwn } from '@dlovely-mysql/shared'
import { createSql } from './virtual-sql'
import type { Sql, SqlWithParams } from './virtual-sql'
import { type Where, formatWhereOptions } from './where'

export namespace Update {
  export interface Options {
    table: string
    data: Record<string, unknown>
    where?: Sql | Where.Options
    json_key: Map<string, string>
  }
}

export const formatUpdate = (options: Update.Options): SqlWithParams => {
  const { table, data, where, json_key } = options
  const keys = [] as string[],
    vals = [] as unknown[]
  for (const key in data) {
    if (hasOwn(data, key)) {
      let val = data[key]
      if (val === null || val === undefined) {
        val = json_key.get(key)
      }
      keys.push(key)
      vals.push(val)
    }
  }
  const { sql, params } = formatWhereOptions(where)
  return createSql(
    `UPDATE ${table} SET ${keys.map(key => `${key}=?`).join()}${sql}`,
    ...vals,
    ...params
  )
}
