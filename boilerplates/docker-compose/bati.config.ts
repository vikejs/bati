import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("docker");
  },
  enforce: "post",
  // Docker deploy skill — yields to Dokploy, which builds on Docker (dependsOn) and owns the 'deploy' skill.
  skills(meta) {
    if (meta.BATI.has("dokploy")) return [];
    return [
      {
        name: "deploy",
        description: "How to build and run this app with Docker. Use when containerizing or deploying via Docker.",
        body: `Ships a multi-stage \`Dockerfile\` and \`docker-compose.yml\`.

- **Build & run:** \`docker compose up --build\` (or \`docker build\` + \`docker run\`).
- **Env vars:** set them in \`docker-compose.yml\` / the container environment; don't bake secrets into the image.

See https://docs.docker.com and \`TODO.md\`.`,
      },
    ];
  },
});
