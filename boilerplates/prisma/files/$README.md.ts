import { loadReadme, markdown as m, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  const todo = `${m.h2(m.italic("Prisma"))}
${m.h3("Setup")}
Run the following command once:
${m.code("pnpx prisma init", "sh")}

then follow instructions at ${m.link("https://www.prisma.io/docs/getting-started/quickstart#2-model-your-data-in-the-prisma-schema")}`;

  content.addTodo(todo);

  return content.finalize();
}
