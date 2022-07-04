/*
 * @Author: Dlovely
 * @Date: 2022-03-07 16:42:09
 * @LastEditTime: 2022-07-04 19:13:37
 * @LastEditors: Dlovely
 * @FilePath: \mysql\src\connect.ts
 * @Description: 直接连接MySQL
 */
import { createConnection, Connection, ConnectionConfig, OkPacket } from 'mysql'
import { createToast } from './common'

export interface MCOptions {
	debugger?: boolean
	maxReconnectTime?: number
}

export class MySQLConnect {
	private readonly _db
	private readonly toast
	constructor(config: ConnectionConfig, options?: MCOptions) {
		this._db = {
			host: 'localhost',
			port: 3306,
			connectTimeout: 30000,
			...config,
		}
		this.toast = createToast('MySQL', options?.debugger)
		MySQLConnect.maxReconnectTime = options?.maxReconnectTime ?? 5
	}

	private connection?: Connection
	private _connect() {
		return new Promise<Connection>((resolve, reject) => {
			const connection = createConnection(this._db)
			connection.connect(err => (err ? reject(err) : resolve(connection)))
		})
	}
	static maxReconnectTime = 5
	async connect() {
		const max = MySQLConnect.maxReconnectTime
		if (max) {
			let err: any
			for (let i = 0; i < max; i++) {
				try {
					const server = `服务器${this._db.host}:${this._db.port}${
						this._db.database ? `@${this._db.database}` : ''
					}`
					this.toast.log(`正在连接${server}...`)
					this.connection = await this._connect()
					this.toast.log(`已连接${server}`)
					return this.connection
				} catch (e) {
					err = e
				}
			}
			this.toast.error('服务器连接失败', err.sqlMessage)
			return Promise.reject(err)
		} else {
			return this._connect()
		}
	}

	query<T extends object = never>(sql: string) {
		return new Promise<T extends never ? OkPacket : T[]>((resolve, reject) => {
			if (!this.connection) {
				this.toast.error('未找到连接')
				return reject(new ReferenceError('未找到连接'))
			}
			if (sql) {
				this.connection.query(sql, (err, res) => {
					if (err) {
						this.toast.error('数据库操作错误', err.sqlMessage)
						reject(err)
					} else {
						'fieldCount' in res
							? this.toast.log(`数据库操作成功：${res.fieldCount}
								影响行数：${res.affectedRows}
								修改行数：${res.changedRows}`)
							: this.toast.log(
									`数据库查询成功：${
										res.length
											? `查找到${
													res.length
											  }行\r\n\t|首行数据如下：\r\n${Object.entries(res[0])
													.map(val => `${val[0]}:\t|${val[1]}`)
													.join('\r\n')}`
											: '未查找到数据'
									}`,
							  )
						resolve(res)
					}
				})
			} else {
				this.toast.error('未找到sql语句')
				reject('未找到sql语句')
			}
		})
	}

	quit() {
		return new Promise<void>((resolve, reject) => {
			if (!this.connection) {
				this.toast.error('未找到连接')
				return reject(new ReferenceError('未找到连接'))
			}
			this.connection.end(err => {
				if (err) {
					this.toast.error('数据库断开失败', err.sqlMessage)
					reject(err)
				} else {
					this.toast.log('数据库断开成功')
					resolve()
				}
			})
		})
	}

	async get<T extends object = never>(sql: string) {
		await this.connect()
		const res = await this.query<T>(sql)
		await this.quit()
		return res
	}
}
