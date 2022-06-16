/*
 * @Author: Dlovely
 * @Date: 2022-03-08 00:21:47
 * @LastEditTime: 2022-06-16 17:26:01
 * @LastEditors: Dlovely
 * @FilePath: \mysql\src\pool.ts
 * @Description: 池化连接MySQL
 */
import { createPool, ConnectionConfig, OkPacket } from 'mysql'
import { conStyle, con_style } from './common'

export interface MPOptions {
	debugger?: boolean
}

export class MySQLPool {
	private _pool
	private readonly _log
	private readonly _warn
	private readonly _error
	constructor(config: ConnectionConfig, options?: MPOptions) {
		this._pool = createPool({
			host: 'localhost',
			port: 3306,
			connectTimeout: 30000,
			...config,
		})
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
	}

	get<T extends object = never>(sql: string) {
		return new Promise<keyof T extends string ? T[] : OkPacket>(
			(resolve, reject) => {
				this._log(`正在获取连接池连接`)
				this._pool.getConnection((err, conn) => {
					if (err) {
						this._error('连接池连接失败', err.sqlMessage)
						return reject(err)
					}
					conn.query(sql, (err, res) => {
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
						this._log(`正在释放连接池连接`)
						conn.release()
					})
				})
			},
		)
	}
}
