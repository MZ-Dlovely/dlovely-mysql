/*
 * @Author: Dlovely
 * @Date: 2022-03-07 16:41:34
 * @LastEditTime: 2022-06-29 10:37:26
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
	const connection = new MC(config, options)
	return {
		mysql: <T extends string>(tbname: T) => new SQL(connection).find(tbname),
		connection,
	}
}

export function MySQLKeep(config: ConnectionConfig, options?: MCOptions) {
	const connection = new MC(config, options)
	return {
		connect: connection.connect,
		quit: connection.quit,
		query: <T extends string>(tbname: T) =>
			new SQL({ get: sql => connection.query(sql) }).find(tbname),
		connection,
	}
}

export const MySQLPool = (config: ConnectionConfig, options?: MPOptions) => {
	const connection = new MP(config, options)
	return {
		mysql: <T extends string>(tbname: T) => new SQL(connection).find(tbname),
		connection,
	}
}
