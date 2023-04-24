export const compareNumber = (num_1: number, num_2: number) =>
  num_1 < num_2 ? [num_1, num_2] : [num_2, num_1]

export const completeQD = (count: number, slot = '?') =>
  new Array(count).fill(slot).join()

export type MergeRecord<T extends Record<PropertyKey, unknown>> =
  T extends Record<PropertyKey, unknown>
    ? {
        [K in keyof T]: T[K]
      }
    : never
