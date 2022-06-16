/*
 * @Author: Dlovely
 * @Date: 2022-03-07 16:41:34
 * @LastEditTime: 2022-06-16 17:25:01
 * @LastEditors: Dlovely
 * @FilePath: \mysql\src\index.ts
 * @Description: 封装常用方法
 */
import { ConnectionConfig } from 'mysql'
import { MySQLConnect as MC, MCOptions } from './connect'
export type { MCOptions }
import { MySQLPool as MP, MPOptions } from './pool'
export type { MPOptions }
import { SQL } from './editsql'
export type { SQL }

export const MySQLOnce = (config: ConnectionConfig, options?: MCOptions) => {
	const conn = new MC(config, options)
	return <T extends string>(tbname: T) => new SQL(conn).find(tbname)
}

export function MySQLKeep(config: ConnectionConfig, options?: MCOptions) {
	const mysql = new MC(config, options)
	return {
		connect: mysql.connect,
		quit: mysql.quit,
		query: <T extends string>(tbname: T) =>
			new SQL({ get: sql => mysql.query(sql) }).find(tbname),
	}
}

export const MySQLPool = (config: ConnectionConfig, options?: MPOptions) => {
	const conn = new MP(config, options)
	return <T extends string>(tbname: T) => new SQL(conn).find(tbname)
}
