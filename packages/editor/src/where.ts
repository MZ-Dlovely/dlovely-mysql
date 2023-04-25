import { compareNumber, completeQD, isArray } from '@mysql-manager/shared'
import { createSql, formatSql, isSql } from './virtual-sql'
import type { Sql, SqlWithParams } from './virtual-sql'

export namespace Where {
  export type Options = Single | Unions

  export type CompareType = '=' | '<>' | '<' | '<=' | '>' | '>='
  export interface Compare {
    key: string
    val: any
    type: CompareType
  }

  export interface Like {
    key: string
    like: string
  }

  export interface Between {
    key: string
    min: number
    max: number
  }

  export interface In {
    key: string
    vals: any[]
  }

  export type Single = Compare | Like | Between | In

  export type UnionType = 'and' | 'or'
  export type Unions = [UnionType, Options, Options]
}

interface WhereSql extends SqlWithParams {
  is_union?: boolean
}

export const formatWhere = (options: Where.Options): SqlWithParams => {
  const { sql, params } = formatUnknownWhere(options)
  return { sql: ` WHERE ${sql}`, params }
}

export const formatWhereOptions = (
  options?: Where.Options | Sql
): SqlWithParams =>
  options
    ? isSql(options)
      ? formatSql(options)
      : formatWhere(options)
    : createSql()

function formatUnknownWhere(options: Where.Options): WhereSql {
  return isArray(options)
    ? formatUnionsWhere(options)
    : formatSingleWhere(options)
}

function formatUnionsWhere(options: Where.Unions): WhereSql {
  const [type, left, right] = options
  const { sql: left_sql, params: left_params } = formatUnionsSql(
    formatUnknownWhere(left)
  )
  const { sql: right_sql, params: right_params } = formatUnionsSql(
    formatUnknownWhere(right)
  )
  return {
    sql: `${left_sql} ${type.toUpperCase()} ${right_sql}`,
    params: [...left_params, ...right_params],
    is_union: true,
  }
}

function formatUnionsSql(options: WhereSql): SqlWithParams {
  const { sql, params, is_union } = options
  return { sql: is_union ? `(${sql})` : sql, params }
}

function formatSingleWhere(options: Where.Single): WhereSql {
  let sql = createSql()
  if ('val' in options && 'type' in options) {
    const { key, val, type } = options
    sql = createSql(`${key}${type}?`, val)
  } else if ('like' in options) {
    const { key, like } = options
    sql = createSql(`${key} LIKE ?`, like)
  } else if ('min' in options && 'max' in options) {
    const { key, min, max } = options
    const [lmin, lmax] = compareNumber(min, max)
    sql = createSql(`${key} BETWEEN ? AND ?`, lmin, lmax)
  } else if ('vals' in options) {
    const { key, vals } = options
    sql = { sql: `${key} IN (${completeQD(vals.length)})`, params: vals }
  }
  ;(sql as WhereSql).is_union = false
  return sql as WhereSql
}

// TODO 给一个额外的编辑器
class Where {}
