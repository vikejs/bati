export type Task = () => Promise<unknown>;

export function queue() {
  const tasks: Task[] = [];

  return {
    add(task: Task) {
      tasks.push(task);
    },
    async run() {
      let task: Task | undefined;
      // biome-ignore lint/suspicious/noAssignInExpressions: ignored
      while ((task = tasks.shift())) {
        await task();
      }
    },
  };
}
