import { isArray, isNumber } from '@mysql-manager/shared'
import { createSql } from './virtual-sql'
import type { Sql, SqlWithParams } from './virtual-sql'
import { type Where, formatWhereOptions } from './where'

export namespace Select {
  export interface Options {
    table: string
    distinct?: boolean
    columns?: string[]
    where?: Sql | Where.Options
    order_by?: Record<string, OrderByType>
    range?: Range
  }

  export type OrderByType = boolean | 'desc' | 'asc'
  export type Range =
    | number
    | [number, number]
    | { limit: number; offset: number }
}

export const formatSelect = (options: Select.Options): SqlWithParams => {
  const { table, columns, distinct, order_by, where, range } = options
  const distinct_sql = formatDistinct(distinct)
  const columns_sql = formatColums(columns)
  const { sql: where_sql, params: where_params } = formatWhereOptions(where)
  const order_by_sql = formatOrderBy(order_by)
  const { sql: range_sql, params: range_params } = formatRange(range)
  return createSql(
    `SELECT${distinct_sql}${columns_sql}${table}${where_sql}${order_by_sql}${range_sql}`,
    ...where_params,
    ...range_params
  )
}

function formatColums(columns?: Select.Options['columns']): string {
  if (!columns || !columns.length) return ' *'
  return ` ${columns.join()}`
}

function formatDistinct(distinct?: Select.Options['distinct']): string {
  return distinct ? ' DISTINCT' : ''
}

function formatOrderBy(order_by?: Select.Options['order_by']): string {
  if (!order_by) return ''
  const _order_by = Object.entries(order_by)
  if (!_order_by.length) return ''
  return ` ORDER BY ${_order_by
    .map(([key, desc]) => `${key} ${formatOrderByType(desc).toUpperCase()}`)
    .join()}`
}

function formatOrderByType(type: Select.OrderByType) {
  if (typeof type === 'string') return type
  return type ? 'desc' : 'asc'
}

function formatRange(range?: Select.Range): SqlWithParams {
  if (!range) return createSql()
  if (isNumber(range)) return createSql(` LIMIT ?`, range)
  if (isArray(range)) return { sql: ` LIMIT ? OFFSET ?`, params: range }
  const { limit, offset } = range
  return createSql(` LIMIT ? OFFSET ?`, limit, offset)
}
