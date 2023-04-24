import { createMysqlServer, ConnectionOptions } from '../src'

describe('Mysql', () => {
  const config: ConnectionOptions = {
    host: 'localhost',
    user: 'root',
    password: 'Hxd12345679',
  }

  it('MysqlServer', async ({ expect }) => {
    const server = createMysqlServer(config)
    const { connection, release } = await server.getConnection()
    const [result] = await connection.query<any[]>('select json_array(1,2,3)')
    expect(result[0]['json_array(1,2,3)']).toEqual([1, 2, 3])
    release()
  })
})
