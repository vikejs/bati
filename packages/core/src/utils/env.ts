export function appendToEnv(envContent: string | undefined | null, key: string, value: unknown, comment?: string) {
  envContent ??= "";
  if (envContent.endsWith("\n\n")) {
    // do nothing
  } else if (envContent.endsWith("\n")) {
    envContent = `${envContent}\n`;
  } else if (envContent) {
    envContent = `${envContent}\n\n`;
  }

  const prefixedComment = comment ? `${comment.replace(/^(.+)/gm, "# $1")}\n` : "";
  const newConf = `${key}=${formatValue(value)}\n`;

  return envContent + prefixedComment + newConf;
}

function formatValue(value: unknown): string {
  let strval = "";
  switch (typeof value) {
    case "string":
      if (value) {
        strval = JSON.stringify(value);
      }
      break;
    case "boolean":
    case "number":
      strval = String(value);
      break;
    case "undefined":
      strval = "";
      break;
    case "object":
      if (value !== null) {
        strval = JSON.stringify(value);
      }
      break;
  }

  return strval;
}
