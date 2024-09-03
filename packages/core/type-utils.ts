/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */

export type Values<T> = T extends Record<any, infer T> ? T : never;
export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends (arg: infer I) => void
  ? I
  : never;
