import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps): Promise<unknown> {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## Dokploy

1. **Push your repository** to a Git provider (GitHub, GitLab, Bitbucket, etc.)

2. **Install Dokploy** on your VPS if you haven't already:
   \`\`\`sh
   curl -sSL https://dokploy.com/install.sh | sudo sh
   \`\`\`

3. **Open Dokploy** at \`http://<your-server-ip>:3000\` and complete the initial setup.

4. **Create a new application** in the Dokploy dashboard and connect it to your repository.

5. **Set environment variables** in the application's Environment tab. At minimum:
   - \`NODE_ENV=production\`
   - \`PORT=3000\`

6. **Deploy** — Dokploy will use the \`docker-compose.yml\` at the root of your repository to build and start your application.

See also: https://docs.dokploy.com
`;

  content.addMarkdownFeature(todo, "dokploy");

  return content;
}
