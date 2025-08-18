/** biome-ignore-all lint/suspicious/noExplicitAny: types */

export type Values<T> = T extends Record<any, infer T> ? T : never;
export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends (arg: infer I) => void
  ? I
  : never;
