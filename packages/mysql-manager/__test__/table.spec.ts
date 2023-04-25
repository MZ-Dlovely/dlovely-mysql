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
      readonly: true,
      not_null: true,
      has_defa: false,
      type: 'int',
    },
    {
      name: 'create_time',
      readonly: true,
      not_null: true,
      has_defa: true,
      type: 'timestamp',
    },
    {
      name: 'update_time',
      readonly: true,
      not_null: true,
      has_defa: true,
      type: 'timestamp',
    },
    {
      name: 'reviser',
      readonly: false,
      not_null: false,
      has_defa: false,
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
