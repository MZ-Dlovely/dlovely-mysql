# dlovely-mysql

[![NPM Version][npm-version-image]][npm-url] [![NPM License][npm-license-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![NPM Types][npm-types-image]][npm-url] [![Node.js Version][node-image]][node-url]

## 目录

- [安装](#安装)
- [快速上手](#快速上手)
- [建立连接](#建立连接)
  - [一次性连接](#一次性连接)
  - [持续连接](#持续连接)
  - [创建连接池](#创建连接池)
  - [自行连接](#自行连接)
- [数据库连接配置](#数据库连接配置)
- [代理连接配置](#代理连接配置)
  - [debug模式](#debug模式)
  - [设置最高重连次数](#设置最高重连次数)
- [数据库操作](#数据库操作)
  - [INSERT](#insert)
  - [DELETE](#delete)
  - [UPDATE](#update)
  - [SELECT](#select)
  - [ORDER BY](#order-by)
  - [WHERE](#where)
  - [GET](#get)

### 安装

本作目的在于将nodejs的sql查询过程函数化，可以单纯使用`SQL`类创建sql语句，也可以通过本作封装好的数据库连接直接用于查询，目前支持快捷连接的数据库有：

- mysql

为您的项目安装`dlovely-mysql`：

```sh
# 如果使用npm
$ npm i dlovely-mysql --save
# 如果使用yarn
$ yarn add dlovely-mysql
```

### 快速上手

以下提供了一个示例，可以满足一般需求：

```ts
// common.ts
import { MySQLPool } from 'dlovely-mysql'

export const mysql = MySQLPool({
  host     : 'localhost',
  user     : 'my_name',
  password : 'my_secret',
  database : 'my_database'
})
```

```ts
// index.ts
import { mysql } from '../common'

async function query(){
  const sql_insert = await mysql('my_tablename').insert({name: 'Dlovely'}).get()
  /** (typeof sql_insert) OkPacket */
  const sql_delete = await mysql('my_tablename').delete().where({id: 1}).get()
  /** (typeof sql_delete) OkPacket */
  const sql_update = await mysql('my_tablename').update({name: 'Dlovely'}).where({id: 1}).get()
  /** (typeof sql_update) OkPacket */
  const sql_select = await mysql('my_tablename').select().where({id: 1}).get<{ id: number, name: string }>()
  /** (typeof sql_select) { id: number, name: string }[] */
}
```

### 建立连接

#### 一次性连接

查询一次数据库后自动关闭连接

```ts
// common.ts
import { MySQLOnce } from 'dlovely-mysql'

export const mysql = MySQLOnce(options)

mysql('my_tablename').insert({name: 'Dlovely'}).get()
```

#### 持续连接

需要手动连接及关闭

```ts
// common.ts
import { MySQLKeep } from 'dlovely-mysql'

export const mysql = MySQLKeep(options)

mysql.connect()

mysql.query('my_tablename').insert({name: 'Dlovely'}).get()

// When http server stop
// mysql.quit()
```

#### 创建连接池

查询数据库时自动连接与释放

```ts
// common.ts
import { MySQLPool } from 'dlovely-mysql'

export const mysql = MySQLPool(options)

mysql('my_tablename').insert({name: 'Dlovely'}).get()
```

#### 自行连接

[^自行连接]只使用SQL编辑器功能，实例化`SQL`类时需传入查询器，否则只能使用编辑器功能

```ts
// common.ts
import { SQL } from 'dlovely-mysql'
import { createPool } from 'mysql'

const pool = createPool({
  host     : 'localhost',
  user     : 'my_name',
  password : 'my_secret',
  database : 'my_database'
})

const get = sql => new Promise((resolve, reject) => {
  pool.getConnection((err, conn) => {
    if (err) reject(err)
    else conn.query(sql, (err, res) => {
      conn.release()
      err ? reject(err) : resolve(res)
    })
  })
})

export const mysql = tbname => new SQL({ get }).find(tbname)

mysql('my_tablename').insert({name: 'Dlovely'}).get()
```

[^自行连接]:自行连接时如需TS支持请自行阅读源码

### 数据库连接配置

目前模块内提供的函数内，数据库连接参数`options`与[mysql](https://npmjs.org/package/mysql)模块的数据库连接参数一致,如果出现数据库连接上的问题，请到[mysql](https://npmjs.org/package/mysql)模块查看文档寻找原因

### 代理连接配置

除了传入数据库连接配置外，还可以传入代理连接的配置

#### debug模式

目前所有内置连接都支持debug模式

```ts
// common.ts
import { MySQLOnce } from 'dlovely-mysql'

export const mysql = MySQLOnce(options, { debugger: true })

mysql('my_tablename').insert({name: 'Dlovely'}).get()
```

#### 设置最高重连次数

连接池连接目前不支持重连，默认5次

```ts
// common.ts
import { MySQLOnce } from 'dlovely-mysql'

export const mysql = MySQLOnce(options, { maxReconnectTime: 10 })

mysql('my_tablename').insert({name: 'Dlovely'}).get()
```

### 数据库操作

用于修改数据表的数据库操作分为4大类，分别是[增](#insert)、[删](#delete)、[改](#update)、[查](#select)，我们先在公共函数文件中通过模块内置的工厂函数，或者直接导入`SQL`创建好我们的SQL实例并导出，在要应用的场合再导入进来

```ts
// common.ts
import { MySQLPool } from 'dlovely-mysql'

export const mysql = MySQLPool({
  host     : 'localhost',
  user     : 'my_name',
  password : 'my_secret',
  database : 'my_database'
})
// index.ts
import { mysql } from '../common'
/* (typeof mysql) (tbname: string) => SQL */

/* 每次查询时传入表名用mysql函数产生一个新的SQL实例 */
const sql = mysql('my_tablename')
/* (typeof sql) SQL */
```

#### INSERT

- `data`: 要插入到数据表的数据

```ts
/* 提供要插入到数据表的数据，如id=0,name='Dlovely',age=22 */
let data = {
  id: 0,
  name: 'Dlovely',
  age: 22
}
let insert = sql.insert(data)
/* (value insert.SQL)
 * INSERT INTO my_tablename
 * (id, name, age) VALUES
 * (0, 'Dlovely', 22)
 */
```

#### DELETE

```ts
/* 不需要提供参数，但必须使用where定位 */
let delete = sql.delete().where({ name: 'Dlovely' })
/* (value delete.SQL)
 * DELETE FROM my_tablename
 * WHERE name='Dlovely'
 */
```

#### UPDATE

- `data`: 要插入到数据表的数据

```ts
/* 提供要修改的数据，同时需要使用where定位，如需要修改为id=0,name='Dlovely',age=23 */
let data = { age: 23 }
let update = sql.update(data).where({ name: 'Dlovely' })
/* (value update.SQL)
 * UPDATE my_tablename
 * SET age=23
 * WHERE name='Dlovely'
 */
```

#### SELECT

- `distinct`: 是否排除重复数据，仅当keys有传入值时生效
- `keys`: 收集剩余参数作为要获取的列的集合

```ts
/* 查询所有数据 */
let select = sql.select(/* default: true */)
/* (value select.SQL)
 * SELECT * FROM my_tablename
 */
/* 查询所有数据，并排除重复数据，是不可能的啦~ */
let select = sql.select(false)
/* (value select.SQL)
 * SELECT * FROM my_tablename
 */
/* 查询指定列数据 */
let select = sql.select(false, 'name', 'age')
/* (value select.SQL)
 * SELECT name, age FROM my_tablename
 */
/* 查询指定列数据，并排除重复数据 */
let select = sql.select(true, 'name')
/* (value select.SQL)
 * SELECT DISTINCT name FROM my_tablename
 */
```

#### ORDER BY

- `keys`: 收集剩余参数作为要获取的列的集合
  - 传入一般字符串时，如`name`，将作为顺序标志
  - 传入以`&`开头的字符串时，如`'&age'`，将作为逆序标志

```ts
/* 以名称顺序显示 */
let select = sql.select().order('name')
/* (value select.SQL)
 * SELECT * FROM my_tablename ORDER BY 'name' ASC
 */
/* 以年龄逆序显示 */
let select = sql.select().order('&age')
/* (value select.SQL)
 * SELECT * FROM my_tablename ORDER BY 'age' DESC
 */
/* 以名称顺序显示同时以年龄逆序显示 */
let select = sql.select().order('name'，'&age')
/* (value select.SQL)
 * SELECT * FROM my_tablename ORDER BY 'name' ASC, 'age' DESC
 */
```

#### WHERE

- `data`: 用来定位的一组标准
  - `key`:
    - 传入一般字符串时，如`age`，将作为选择性条件
    - 传入以`&`开头的字符串时，如`'&age'`，将作为必要性条件
  - `value`:
    - 传入数字或字符串时，将直接作为`=`判断
    - 传入对象以`min`为键时，将作为`>`判断
    - 传入对象以`emin`为键时，将作为`>=`判断
    - 传入对象以`max`为键时，将作为`<`判断
    - 传入对象以`emax`为键时，将作为`<=`判断
    - 传入对象同时有`min`或`emin`和`max`或`emax`键时，将作为`between`判断，是否相等依据数据库对`between`的处理
    - 传入对象以`val`为键时:
      - 值为数字或字符串时，将直接作为`=`判断
      - 值为数字或字符串构成的数组时，将作为`in`判断

```ts
/* 提供定位 */
let select = sql.select().where({ name: 'Dlovely' })
let select = sql.select().where({
  name: {
    val: 'Dlovely'
  }
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE name='Dlovely'
 */
/* 提供一串定位 */
let select = sql.select().where({
  name: {
    val: ['Dlovely', 'Anna']
  }
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE name IN 'Dlovely', 'Anna'
 */
/* 同时提供多种定位 */
let select = sql.select().where({
  name: 'Dlovely',
  age: 22
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE name='Dlovely' OR age=22
 */
/* 为索引前添加特殊符号& */
let select = sql.select().where({
  name: 'Dlovely',
  '&age': 22
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE name='Dlovely' AND age=22
 */
/* 传入最小值（不包含） */
let select = sql.select().where({
  age: {
    min: 22
  }
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE age>22
 */
/* 传入最大值（包含） */
let select = sql.select().where({
  age: {
    emax: 24
  }
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE age<=24
 */
/* 同时传入最大、最小值 */
let select = sql.select().where({
  age: {
    min: 22,
    max: 24
  }
})
/* (value select.SQL)
 * SELECT * FROM my_tablename WHERE age BETWEEN 22 AND 24
 */
```

#### GET

需要将查询器传入SQL实例后才可以使用`get`方法，否则报错
若不传入参数，将返回一个包含结果的`Promise`对象

- `resolve`: 回调函数，用来处理查询后获取到的数据
- `reject`: 错误回调，在查询器发生错误时将错误返回

```ts
/* 传入回调函数 */
sql.select().get(result => { ... })
/* (typeof result) object[] */
/* 传入回调函数和错误回调 */
sql.select().get(result => { ... },error => { ... })
/* (typeof error) any */
/* 不传入参数 */
let result = sql.select().get()
/* (typeof result) Promise<object[]> */
/* 提供TS类型支持 */
type MyType = { id: number; name: string; age: number }
let result = sql.select().get<MyType>()
/* (typeof result) Promise<{
 *    id: number
 *    name: string
 *    age: number
 * }[]>
 */
/* 提供TS类型限制 */
type MyType = { id: number; name: string; age: number }
let result = sql.select(false, 'id', 'sex').get<MyType>()
/* (typeof result) Promise<{
 *    id: number
 *    name: string
 *    age: number
 *    sex?: any
 * }[]>
 */
```

[npm-url]: https://npmjs.org/package/dlovely-mysql
[npm-version-image]: https://badgen.net/npm/v/dlovely-mysql
[npm-license-image]: https://badgen.net/npm/license/dlovely-mysql
[npm-downloads-image]: https://badgen.net/npm/dm/dlovely-mysql
[npm-types-image]: https://badgen.net/npm/types/dlovely-mysql
[node-url]: https://nodejs.org/en/download
[node-image]: https://badgen.net/npm/node/next
