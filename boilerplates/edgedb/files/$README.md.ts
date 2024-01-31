import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const todo = `
## *EdgeDB*
### Setup
If [EdgeDB CLI](https://www.edgedb.com/docs/cli/index) is not yet installed, execute the following command:
\`\`\`sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh
\`\`\`

Once the CLI is installed, you can initialize a project:
\`\`\`sh
edgedb project init
\`\`\`

Then follow instructions at <https://www.edgedb.com/docs/intro/quickstart#set-up-your-schema>`;

  content.addTodo(todo);

  return content.finalize();
}
