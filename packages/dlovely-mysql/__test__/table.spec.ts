import { createDataBase, createTable } from '../src'

describe('Table', () => {
  const config = {
    host: 'localhost',
    user: 'root',
    password: 'Hxd12345679',
    database: 'clockin',
  }
  const clockin = createDataBase(config, false)
  const account_columns = [
    {
      name: 'id',
      read_only: true,
      not_null: true,
      has_default: false,
      type: 'int',
    },
    {
      name: 'create_time',
      read_only: true,
      not_null: true,
      has_default: true,
      type: 'timestamp',
    },
    {
      name: 'update_time',
      read_only: true,
      not_null: true,
      has_default: true,
      type: 'timestamp',
    },
    {
      name: 'reviser',
      read_only: false,
      not_null: false,
      has_default: false,
      type: 'int',
    },
  ] as const
  const account = createTable(clockin, 'account', account_columns)

  it.skip('Select', async ({ expect }) => {
    const result = await account.select([], undefined, { range: 1 })
    console.log(result)
    expect(result.length).toBe(1)
    expectTypeOf(result[0]).toEqualTypeOf<{
      readonly id: number
      readonly create_time: Date
      readonly update_time: Date
      reviser?: number
    }>()
  })
})
