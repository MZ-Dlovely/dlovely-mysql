/*
 * @Author: Dlovely
 * @Date: 2022-03-07 16:42:09
 * @LastEditTime: 2022-06-16 17:03:02
 * @LastEditors: Dlovely
 * @FilePath: \mysql\src\connect.ts
 * @Description: 直接连接MySQL
 */
import { createConnection, Connection, ConnectionConfig, OkPacket } from 'mysql'
import { conStyle, con_style } from './common'

export interface MCOptions {
	debugger?: boolean
	maxReconnectTime?: number
}

export class MySQLConnect {
	private readonly _db
	private readonly _log
	private readonly _warn
	private readonly _error
	constructor(config: ConnectionConfig, options?: MCOptions) {
		this._db = {
			host: 'localhost',
			port: 3306,
			connectTimeout: 30000,
			...config,
		}
		if (options?.debugger) {
			const con =
				(
					type: 'log' | 'warn' | 'error',
					title: keyof typeof con_style,
					time: keyof typeof con_style,
				) =>
				(...message: any[]) =>
					console[type](
						conStyle('[MySQL]', title),
						conStyle(`[${new Date().toLocaleString()}]`, time),
						...message.map(msg => conStyle(msg, 'white')),
					)

			this._log = con('log', 'green', 'blue')
			this._warn = con('warn', 'yellow', 'cyan')
			this._error = con('error', 'red', 'magenta')
		} else this._log = this._warn = this._error = () => {}
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
					this._log(
						`正在连接服务器${this._db.host}:${this._db.port}${
							this._db.database ? `@${this._db.database}` : ''
						}`,
					)
					this.connection = await this._connect()
					this._log(
						`已连接服务器${this._db.host}:${this._db.port}${
							this._db.database ? `@${this._db.database}` : ''
						}`,
					)
					return this.connection
				} catch (e) {
					err = e
				}
			}
			this._error('服务器连接失败', err.sqlMessage)
			return Promise.reject(err)
		} else {
			return this._connect()
		}
	}

	query<T extends object | string>(sql: string) {
		return new Promise<keyof T extends string ? T[] : OkPacket>(
			(resolve, reject) => {
				if (!this.connection) {
					this._error('未找到连接')
					return reject(new ReferenceError('未找到连接'))
				}
				if (sql) {
					this.connection.query(sql, (err, res) => {
						if (err) {
							this._error('数据库操作错误', err.sqlMessage)
							reject(err)
						} else {
							res.fieldCount
								? this._log(`数据库操作成功：${res.fieldCount}
								影响行数：${res.affectedRows}
								修改行数：${res.changedRows}`)
								: this._log(
										`数据库查询成功：${
											res.length
												? `查找到${res.length}行
												首行数据如下：
												${Object.entries(res[0])
													.map(val => `${val[0]}:\t${val[1]}`)
													.join('\r')}`
												: '未查找到数据'
										}`,
								  )
							resolve(res)
						}
					})
				} else {
					this._error('未找到sql语句')
					reject('未找到sql语句')
				}
			},
		)
	}

	quit() {
		return new Promise<void>((resolve, reject) => {
			if (!this.connection) {
				this._error('未找到连接')
				return reject(new ReferenceError('未找到连接'))
			}
			this.connection.end(err => {
				if (err) {
					this._error('数据库断开失败', err.sqlMessage)
					reject(err)
				} else {
					this._log('数据库断开成功')
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
