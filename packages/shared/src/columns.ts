export type TableColumns = readonly TableColumn[]
export type TableColumn =
  | NumberColumn
  | StringColumn
  | DateColumn
  | JsonColumn
  | CharColumn
  | EnumColumn

export interface BaseColumn {
  readonly name: string
  readonly not_null: boolean
  readonly has_defa: boolean
  readonly readonly: boolean
}
export interface NumberColumn extends BaseColumn {
  readonly type:
    | 'int'
    | 'tinyint'
    | 'smallint'
    | 'mediumint'
    | 'bigint'
    | 'bool'
}
export interface StringColumn extends BaseColumn {
  readonly type:
    | 'text'
    | 'tinytext'
    | 'mediumtext'
    | 'longtext'
    | 'blob'
    | 'tinyblob'
    | 'mediumblob'
    | 'longblob'
}
export interface DateColumn extends BaseColumn {
  readonly type: 'date' | 'datetime' | 'timestamp'
}
export interface JsonColumn extends BaseColumn {
  readonly type: 'json'
  readonly default: string
}
export interface CharColumn extends BaseColumn {
  readonly type: 'char' | 'varchar'
  readonly length: number
}
export interface EnumColumn extends BaseColumn {
  readonly type: 'enum' | 'set'
  readonly enum: any[]
}
