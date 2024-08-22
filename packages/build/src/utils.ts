export function orderBy<T, U>(array: T[], getter: (item: T) => U): T[] {
  return array.slice().sort((a, b) => {
    const valueA = getter(a);
    const valueB = getter(b);

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });
}
