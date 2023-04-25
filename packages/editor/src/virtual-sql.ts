import { isObject } from '@mysql-manager/shared'

export interface SqlWithParams {
  sql: string
  params: any[]
}
export type Sql = SqlWithParams | SqlWithParams['sql']

export function isSql(sql: unknown): sql is Sql {
  if (typeof sql === 'string') return true
  return isObject(sql) && 'sql' in sql && 'params' in sql
}

export function formatSql(sql: Sql): SqlWithParams {
  if (typeof sql === 'string') return { sql, params: [] }
  return sql
}

export function createSql(sql = '', ...params: any[]): SqlWithParams {
  return { sql, params }
}
