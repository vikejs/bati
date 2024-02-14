import type { FlagMatrix } from "./types.js";

export function combinate<O extends FlagMatrix>(obj: O) {
  let combos: string[][] = [];
  if (obj.length === 0) return [[]];

  for (const val of obj) {
    const values = Array.isArray(val) ? val : [val];
    const all: string[][] = [];
    for (const x of values) {
      if (combos.length === 0) {
        all.push([x].filter(Boolean));
      } else {
        for (let j = 0; j < combos.length; j++) {
          all.push([...combos[j], x].filter(Boolean));
        }
      }
    }
    combos = all;
  }
  return combos;
}
