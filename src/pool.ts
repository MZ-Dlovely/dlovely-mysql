/*
 * @Author: Dlovely
 * @Date: 2022-03-08 00:21:47
 * @LastEditTime: 2022-07-04 21:12:58
 * @LastEditors: Dlovely
 * @FilePath: \mysql\src\pool.ts
 * @Description: 池化连接MySQL
 */
import { createPool, ConnectionConfig, OkPacket } from 'mysql'
import { createToast } from './common'

export interface MPOptions {
	debugger?: boolean
}

export class MySQLPool {
	private _pool
	private readonly toast
	constructor(config: ConnectionConfig, options?: MPOptions) {
		this._pool = createPool({
			host: 'localhost',
			port: 3306,
			connectTimeout: 30000,
			...config,
		})
		this.toast = createToast('MySQL', options?.debugger)
		this.toast.log(
			`已连接服务器${config.host || 'localhost'}:${config.port || 3306}${
				config.database ? `@${config.database}` : ''
			}`,
		)
	}

	get<T extends object = never>(sql: string) {
		return new Promise<keyof T extends string ? T[] : OkPacket>(
			(resolve, reject) => {
				this.toast.log(`正在获取连接池连接...`)
				this._pool.getConnection((err, conn) => {
					if (err) {
						this.toast.error('连接池连接失败', err.sqlMessage)
						return reject(err)
					}
					conn.query(sql, (err, res) => {
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
						this.toast.log(`正在释放连接池连接...`)
						conn.release()
					})
				})
			},
		)
	}
}
