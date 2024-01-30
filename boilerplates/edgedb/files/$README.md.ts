import { loadReadme, markdown as m, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  const todo = `${m.h2(m.italic("EdgeDB"))}
${m.h3("Setup")}
If ${m.link("https://www.edgedb.com/docs/cli/index", "EdgeDB CLI")} is not yet installed, execute the following command:
${m.code("curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh", "sh")}

Once the CLI is installed, you can initialize a project:
${m.code("edgedb project init", "sh")}

Then follow instructions at ${m.link("https://www.edgedb.com/docs/intro/quickstart#set-up-your-schema")}`;

  content.addTodo(todo);

  return content.finalize();
}
