import type { Color } from "colorette";

export function withIcon(icon: string, iconColor: Color, indentLevel = 0) {
  const pre = `${" ".repeat(indentLevel * 2)}${iconColor(icon)}`;
  return (str: string) => `${pre} ${str}`;
}
