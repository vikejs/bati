export function lazyGetter<T, K extends string, U>(
  obj: T,
  key: K,
  getter: () => U
): asserts obj is T & { [k in K]: U } {
  Object.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    get(): U {
      delete this[key];
      this[key] = getter();
      return this[key];
    },
  });
}

type MapGetter<T extends Record<string, () => any>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export function lazyfy<T extends Record<string, () => any>>(obj: T): MapGetter<T> {
  const ret = {};
  for (const [k, getter] of Object.entries(obj)) {
    lazyGetter(ret, k, getter);
  }

  return ret as MapGetter<T>;
}
