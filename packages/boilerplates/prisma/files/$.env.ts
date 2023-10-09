import { type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  let envContent = (await props.readfile?.()) ?? "";
  if (envContent.endsWith("\n\n")) {
    // do nothing
  } else if (envContent.endsWith("\n")) {
    envContent = envContent + "\n";
  } else if (envContent) {
    envContent = envContent + "\n\n";
  }

  const prismaContent = `# Prisma

# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
`;

  return envContent + prismaContent;
}
