export type TodoItem = { text: string };

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  return `http://localhost:${port}`;
}

export async function fetchTodos(): Promise<TodoItem[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/todo`);
  if (!response.ok) {
    throw new Error("Failed to fetch todos");
  }
  return response.json();
}

export async function createTodo(text: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/todo/create`, {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to create todo");
  }
}
