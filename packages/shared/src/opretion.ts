import type { TableColumn, TableColumns, ColumnType } from './columns'
import type { MergeRecord } from './type-utils'

export type InsertColumns<Columns extends TableColumns> = MergeRecord<
  {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsRequire<Key, Key['name'], never>
    >]: ColumnType<Key>
  } & {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsRequire<Key, never, Key['name']>
    >]?: ColumnType<Key>
  }
>

export type UpdateColumns<Columns extends TableColumns> = MergeRecord<{
  [Key in Columns[number] as IsReadOnly<
    Key,
    never,
    Key['name']
  >]?: ColumnType<Key>
}>

export type SelectColumns<Columns extends TableColumns> = MergeRecord<
  {
    readonly [Key in Columns[number] as IsReadOnly<
      Key,
      IsExist<Key, Key['name'], never>,
      never
    >]: ColumnType<Key>
  } & {
    readonly [Key in Columns[number] as IsReadOnly<
      Key,
      IsExist<Key, never, Key['name']>,
      never
    >]?: ColumnType<Key>
  } & {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsExist<Key, Key['name'], never>
    >]: ColumnType<Key>
  } & {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsExist<Key, never, Key['name']>
    >]?: ColumnType<Key>
  }
>
export type SelectColumnsPick<
  Columns extends TableColumns,
  Column extends Columns[number]['name']
> = [Column] extends [never]
  ? SelectColumns<Columns>
  : DPick<SelectColumns<Columns>, Column>

type IsReadOnly<
  Column extends TableColumn,
  True = true,
  False = false
> = Column['readonly'] extends true ? True : False
type IsRequire<
  Column extends TableColumn,
  True = true,
  False = false
> = Column['has_defa'] extends true
  ? False
  : Column['not_null'] extends true
  ? True
  : False
type IsExist<
  Column extends TableColumn,
  True = true,
  False = false
> = Column['not_null'] extends true ? True : False
type DPick<T, K> = {
  [Key in keyof T as Key extends K ? Key : never]: T[Key]
}
