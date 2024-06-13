import { initContract } from "@ts-rest/core";

const c = initContract();

export const contract = c.router({
  demo: {
    method: "GET",
    path: BATI.has("express") || BATI.has("fastify") ? "/api/demo" : "/demo",
    responses: {
      200: c.type<{ demo: boolean }>(),
    },
  },
  createTodo: {
    method: "POST",
    path: BATI.has("express") || BATI.has("fastify") ? "/api/todo/create" : "/todo/create",
    body: c.type<{ text: string }>(),
    responses: {
      200: c.type<{ status: string }>(),
    },
    summary: "Create a Todo",
  },
});
