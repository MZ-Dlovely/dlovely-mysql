import { completeQD, hasOwn } from '@dlovely-mysql/shared'
import type { SqlWithParams } from './virtual-sql'

export namespace Insert {
  export interface Options {
    table: string
    datas: Record<string, unknown>[]
    json_key: Map<string, string>
  }
}

interface InsertContext {
  insert_amount: number
  insert_data: Map<string, unknown[]>
}

export const formatInsert = (options: Insert.Options): SqlWithParams => {
  const { table, datas, json_key } = options
  const ctx: InsertContext = { insert_amount: 0, insert_data: new Map() }
  for (const data of datas) {
    formatInsertData.call(ctx, data, json_key)
  }
  const keys = [] as string[]
  const vals = Array.from({ length: ctx.insert_amount }, () => [] as unknown[])
  ctx.insert_data.forEach((val_list, key) => {
    keys.push(key)
    for (const i in val_list) {
      const val = val_list[i]
      vals[i].push(val)
    }
  })
  const params = vals.flat()
  return {
    sql: `INSERT INTO ${table} (${keys.join()}) VALUES ${completeQD(
      ctx.insert_amount,
      completeQD(keys.length)
    )}`,
    params,
  }
}

function formatInsertData(
  this: InsertContext,
  data: Record<string, unknown>,
  json_key: Map<string, string>
): void {
  const need_do = new Set(this.insert_data.keys())
  for (const key in data) {
    if (hasOwn(data, key)) {
      let val = data[key]
      if (val === null || val === undefined) {
        val = json_key.get(key)
      }
      const datas = this.insert_data.get(key)
      if (datas) {
        datas.push(val)
        need_do.delete(key)
      } else {
        const datas = new Array(this.insert_amount).fill(null)
        datas.push(val)
        this.insert_data.set(key, datas)
      }
    }
  }
  for (const key of need_do) {
    this.insert_data.get(key)?.push(null)
  }
  this.insert_amount += 1
}
