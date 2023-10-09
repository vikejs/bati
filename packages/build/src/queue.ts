export type Task = () => Promise<unknown>;

export function queue() {
  const tasks: Task[] = [];

  return {
    add(task: Task) {
      tasks.push(task);
    },
    async run() {
      let task: Task | undefined;
      while ((task = tasks.pop())) {
        await task();
      }
    },
  };
}
