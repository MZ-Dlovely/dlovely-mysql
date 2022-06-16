/*
 * @Author: Dlovely
 * @Date: 2022-03-07 17:09:57
 * @LastEditors: Dlovely
 * @LastEditTime: 2022-06-16 17:20:09
 * @Description: 编辑SQL语句
 * @FilePath: \mysql\src\editsql.ts
 * Copyright (c) 2022 by Dlovely, All Rights Reserved.
 */
import { O } from 'ts-toolbelt'
import { OkPacket } from 'mysql'

type obj<T = any> = O.Record<string, T>
type NumorStr = string | number
type orArray<T> = T | T[]

enum Methods {
	'select',
	'insert',
	'update',
	'delete',
}
export type SQLMethods = keyof typeof Methods
type SQLOptions = {
	data: Map<string, NumorStr>
	where: {
		key: string
		val: SQLWhere
		merge: number
	}[]
	row: {
		keys: Set<string>
		distinct: boolean
	}
	order: {
		key: string
		desc: boolean
	}[]
}

type orMin = { min: number } | { emin: number }
type orMax = { max: number } | { emax: number }
type orBet = orMin & orMax
export type SQLWhere =
	| orArray<NumorStr>
	| orMin
	| orMax
	| orBet
	| { val: orArray<NumorStr> }

function editOrString<S extends NumorStr>(orStr: S): `${S}` | `'${S}'` {
	return typeof orStr === 'number' ? `${orStr}` : `'${orStr}'`
}

function editWhere(where: SQLOptions['where']) {
	return where.reduce((pre, { key, val, merge }, i) => {
		let dir = ''
		if (Array.isArray(val)) {
			dir = ' IN '
			val = val.reduce((pre, val) => {
				return pre + editOrString(val)
			}, '')
		} else if (typeof val === 'number' || typeof val === 'string') {
			dir = '='
			val = editOrString(val)
		} else if ('min' in val) {
			if ('max' in val) {
				dir = ' BETWEEN '
				val = `${val.min} AND ${val.max}`
			} else if ('emax' in val) {
				dir = ' BETWEEN '
				val = `${val.min} AND ${val.emax}`
			} else {
				dir = '>'
				val = val.min
			}
		} else if ('emin' in val) {
			if ('max' in val) {
				dir = ' BETWEEN '
				val = `${val.emin} AND ${val.max}`
			} else if ('emax' in val) {
				dir = ' BETWEEN '
				val = `${val.emin} AND ${val.emax}`
			} else {
				dir = '>='
				val = val.emin
			}
		} else if ('max' in val) {
			dir = '<'
			val = val.max
		} else if ('emax' in val) {
			dir = '<='
			val = val.emax
		} else if (Array.isArray(val.val)) {
			dir = ' IN '
			val = val.val.reduce((pre, val) => {
				return pre + editOrString(val)
			}, '')
		} else {
			dir = '='
			val = editOrString(val.val)
		}
		if ((dir === '=' && /[%_]/.test('' + val)) || /\[.*\]/.test('' + val))
			dir = ' LIKE '
		return pre + (i ? ` ${merge ? 'AND' : 'OR'} ` : ``) + key + dir + val
	}, '')
}
function editData(data: SQLOptions['data'], type: 0 | 1) {
	if (type) {
		let keys = '',
			vals = ''
		for (const [key, val] of data) {
			keys += `,${key}`
			vals += `,${editOrString(val)}`
		}
		keys = keys.replace(',', '')
		vals = vals.replace(',', '')
		return `(${keys}) VALUES (${vals})`
	} else {
		return Array.from(data)
			.map(([key, val]) => `${key}=` + editOrString(val))
			.join()
	}
}

export class SQL<
	TableName extends string = never,
	Method extends SQLMethods = never,
	Data extends obj<NumorStr> = never,
	Where extends obj<SQLWhere> = never,
	Row extends string = never,
> {
	constructor(conn: { get: (sql: string) => Promise<any> }) {
		this.conn = conn
	}

	private _tbname: string = ''
	private _methods: Methods = 0
	private _options = {} as SQLOptions
	/**
	 * 获取当前已编辑的SQL语句
	 * @return { string } SQL语句
	 */
	get SQL(): string {
		if (!this._tbname) throw new Error('未找到表名')
		const { where, row, data, order } = this._options
		switch (this._methods) {
			case 0:
				const Row = row?.keys?.size
					? `${row.distinct ? 'DISTINCT ' : ''}${Array.from(row.keys).join()}`
					: '*'
				const Order = order?.length
					? ` ORDER BY ${order
							.map(({ key, desc }) => `${key} ${desc ? 'DESC' : 'ASC'}`)
							.join()}`
					: ''
				return `SELECT ${Row} FROM ${this._tbname} ${
					where ? `WHERE ${editWhere(where)}` : ''
				}${Order}`
			case 1:
				return `INSERT INTO ${this._tbname} ${editData(data, 1)}`
			case 2:
				return `UPDATE ${this._tbname} SET ${editData(
					data,
					0,
				)} WHERE ${editWhere(where)}`
			case 3:
				return `DELETE FROM ${this._tbname} WHERE ${editWhere(where)}`
			default:
				throw new Error('检索方法错误')
		}
	}

	/**
	 * 选择要搜索的表名，不传入将报错
	 * @param { string } tbname 表名
	 * @return { SQL } SQL编辑器，接下来选择操作方式(select、insert、update、delete)
	 */
	find<T extends string>(
		tbname: T,
	): T extends '' ? void : Pick<SQL<T>, SQLMethods> {
		if (tbname === '') throw new Error('传入表名不能为空')
		else {
			this._tbname = tbname
			return this as any
		}
	}

	/**
	 * SELECT 表
	 * @param { boolean } [distinct = false] 是否进行去重
	 * @param { ...string } keys 选择要筛选的列
	 * @return { SQL } SQL编辑器，接下来选择操作方式(where、order、get)
	 */
	select<T extends string = never>(
		distinct: boolean = false,
		...keys: T[]
	): Pick<
		SQL<TableName, 'select', Data, Where, Exclude<T, ''>>,
		'where' | 'order' | 'get'
	> {
		this._methods = 0
		this._options.row = { keys: new Set(keys.filter(v => v)), distinct }
		return this as any
	}
	/**
	 * INSERT 表
	 * @param { Object } data 要插入的数据
	 * @returns { SQL } SQL编辑器，接下来选择操作方式(get)
	 */
	insert<T extends obj<NumorStr>>(
		data: T,
	): Pick<SQL<TableName, 'insert', T>, 'get'> {
		this._methods = 1
		this._options.data = new Map(Object.entries(data || {}))
		return this as any
	}
	// TODO: 能连续插入多组数据
	/**
	 * UPDATE 表
	 * @param { Object } data 要更新的数据
	 * @returns { SQL } SQL编辑器，接下来选择操作方式(where)
	 */
	update<T extends obj<NumorStr>>(
		data: T,
	): Pick<SQL<TableName, 'update', T>, 'where'> {
		this._methods = 2
		this._options.data = new Map(Object.entries(data || {}))
		return this as any
	}
	/**
	 * DELETE 表
	 * @returns { SQL } SQL编辑器，接下来选择操作方式(where)
	 */
	delete(): Pick<SQL<TableName, 'delete'>, 'where'> {
		this._methods = 3
		return this as any
	}

	/**
	 * 规定检索的列
	 * @param { ...string } keys 要筛选的列的名称
	 * @return { SQL } SQL编辑器，接下来选择操作方式(where、get)
	 */
	order(...keys: string[]): Pick<SQL, 'where' | 'get'> {
		keys.forEach(str => {
			const key = { key: '', desc: false }
			if (str.charAt(0) === '+') key.key = str.replace('+', '')
			else if (str.charAt(0) === '-') {
				key.key = str.replace('-', '')
				key.desc = true
			} else key.key = str
			this._options.order.push(key)
		})
		return this as any
	}
	/**
	 * 传递 WHERE 定位
	 * @param { Object } data 传入定位方式,如果有多个串联条件，键名需要添加&，值可以传入number、string或特定对象，详见示例
	 * @example 定位方式的键
	 * // 单个定位条件
	 * { id: 1 }
	 * // 多个并联定位条件
	 * { id: 1, name: 'Dlovely' }
	 * // 多个串联定位条件
	 * { id: 1, '&name': 'Dlovely' }
	 * @example 定位方式的值
	 * // number或string
	 * { id: 1 }
	 * { name: 'Dlovely' }
	 * // object格式下也可以
	 * { id: { val: 1 } }
	 * // object格式下甚至可以同时传入多个可能的值
	 * { name: { val: ['Dlovely', 'Anlice'] } }
	 * // 可以判断数字的大小范围
	 * { id: { min: 1 } } // id > 1
	 * { id: { emin: 1 } } // id >= 1
	 * { id: { max: 100 } } // id < 100
	 * { id: { emax: 100 } } // id <= 100
	 * { id: { min: 1, emax: 100 } } // 1 < id <= 100
	 * // 优先使用不闭区间的判断(事实上同时传入时ts会报错，但js不会)
	 * { id: { min: 1, emin: 2 } } // id > 1
	 * // 甚至可以使用通配符
	 * { name: 'Dl%' }
	 * { name: '_lovely' }
	 * { name: '_[ln]%' }
	 * @returns { SQL } SQL编辑器，接下来选择操作方式(get)
	 */
	where<T extends obj<SQLWhere>>(
		data: T,
	): Pick<
		SQL<
			TableName,
			Method,
			Data,
			{
				[K in rmStr<keyof T, '&'>]: K extends keyof T
					? T[K]
					: K extends string
					? `&${K}` extends keyof T
						? T[`&${K}`]
						: never
					: never
			},
			Row
		>,
		'get'
	> {
		this._options.where = []
		for (const [key, val] of Object.entries(data)) {
			const w = {
				key,
				val,
				merge: 0,
			}
			if (key.charAt(0) === '&') {
				w.merge = 1
				w.key = w.key.replace('&', '')
			}
			this._options.where.push(w)
		}
		return this as any
	}

	private conn
	/**
	 * 执行结束操作
	 * @return { Promise<Result | OkPacket> } 执行操作后返回的结果
	 */
	get<Result extends O.Record<Row, unknown, ['?', 'W']>>(): Promise<
		Method extends 'select'
			? O.Merge<Result, O.Record<Row, unknown, ['?', 'W']>>[]
			: OkPacket
	>
	/**
	 * 执行结束操作
	 * @param { onfulfilled } [resolve] 用于处理返回数据的回调函数
	 * @param { onrejected } [reject] 用于处理出现的错误的回调函数
	 */
	get<Result extends O.Record<Row, unknown, ['?', 'W']>>(
		/**
		 * 用于处理返回数据的回调函数
		 * @param { Result } result 执行操作后返回的结果
		 */
		resolve: (
			result: Method extends 'select'
				? O.Merge<Result, O.Record<Row, unknown, ['?', 'W']>>[]
				: OkPacket,
		) => void,
		/**
		 * 用于处理出现的错误的回调函数
		 * @param { Error } [error] 执行操作时出现的错误
		 */
		reject?: (error: any) => void,
	): void
	get(resolve?: any, reject?: any): any {
		if (this.conn) {
			if (resolve) this.conn.get(this.SQL).then(resolve, reject)
			else return this.conn.get(this.SQL)
		} else {
			throw new Error('未传入处理器')
		}
	}
}

type rmStr<
	S extends string | number | symbol,
	R extends string = '',
> = S extends `${R}${infer P}` ? P : S
