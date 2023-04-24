import { formatWhere, formatWhereOptions } from '../src/where'

describe('where', () => {
  it('single', () => {
    expect(formatWhere({ key: 'id', val: 10, type: '=' })).toEqual({
      sql: ` WHERE id=?`,
      params: [10],
    })
    expect(formatWhere({ key: 'id', like: '%C' })).toEqual({
      sql: ` WHERE id LIKE ?`,
      params: ['%C'],
    })
    expect(formatWhere({ key: 'id', min: 10, max: 20 })).toEqual({
      sql: ` WHERE id BETWEEN ? AND ?`,
      params: [10, 20],
    })
    expect(formatWhere({ key: 'id', min: 20, max: 10 })).toEqual({
      sql: ` WHERE id BETWEEN ? AND ?`,
      params: [10, 20],
    })
    expect(formatWhere({ key: 'id', vals: [1, 2, 3] })).toEqual({
      sql: ` WHERE id IN (?,?,?)`,
      params: [1, 2, 3],
    })
  })

  it('unions', () => {
    expect(
      formatWhere([
        'and',
        { key: 'id', val: 10, type: '=' },
        { key: 'age', min: 20, max: 10 },
      ])
    ).toEqual({
      sql: ` WHERE id=? AND age BETWEEN ? AND ?`,
      params: [10, 10, 20],
    })
    expect(
      formatWhere([
        'and',
        { key: 'name', like: '%C' },
        [
          'or',
          { key: 'id', val: 10, type: '=' },
          { key: 'age', min: 20, max: 10 },
        ],
      ])
    ).toEqual({
      sql: ` WHERE name LIKE ? AND (id=? OR age BETWEEN ? AND ?)`,
      params: ['%C', 10, 10, 20],
    })
  })

  it('format', () => {
    expect(formatWhereOptions()).toEqual({ sql: '', params: [] })
    expect(formatWhereOptions(' WHERE id=1')).toEqual({
      sql: ' WHERE id=1',
      params: [],
    })
    expect(
      formatWhereOptions({
        sql: ' WHERE id=?',
        params: [1],
      })
    ).toEqual({
      sql: ' WHERE id=?',
      params: [1],
    })
    expect(
      formatWhereOptions({
        key: 'id',
        val: 1,
        type: '=',
      })
    ).toEqual({
      sql: ' WHERE id=?',
      params: [1],
    })
  })
})
