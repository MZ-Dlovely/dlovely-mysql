import { isSql, formatSql, createSql } from '../src/virtual-sql'

describe('virtual-sql', () => {
  it('isSql', () => {
    expect(isSql('test')).toBe(true)
    expect(isSql({})).toBe(false)
    expect(isSql({ sql: 'test' })).toBe(false)
    expect(isSql({ sql: 'test', params: [] })).toBe(true)
  })

  it('formatSql', () => {
    expect(formatSql('test')).toEqual({ sql: 'test', params: [] })
    expect(formatSql({ sql: 'test', params: [] })).toEqual({
      sql: 'test',
      params: [],
    })
  })

  it('formatSql', () => {
    expect(createSql('test')).toEqual({ sql: 'test', params: [] })
    expect(createSql('test', 1, 'a')).toEqual({
      sql: 'test',
      params: [1, 'a'],
    })
  })
})
