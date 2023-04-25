export function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    return;
  }
  throw new Error(message);
}
