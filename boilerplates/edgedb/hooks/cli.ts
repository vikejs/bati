import { which, withIcon } from "@batijs/core";
import { blueBright, bold, cyanBright, dim, gray, greenBright, underline, yellowBright } from "colorette";

export default function oncli() {
  const found = which.sync("edgedb", { nothrow: true });
  const arrow0 = withIcon("→", blueBright);
  const dot1 = withIcon("•", blueBright, 1);
  const cmd3 = withIcon("$", gray, 3);

  console.log("\n" + bold(arrow0(`Next steps: ${underline("EdgeDB")}`)));

  if (found === null) {
    console.log(dim(dot1(`${yellowBright("edgedb")} command not found`)));
    console.log(cmd3("curl https://sh.edgedb.com --proto '=https' -sSf1 | sh"));
  } else {
    console.log(dim(dot1(`${greenBright("edgedb")} command found at ${cyanBright(found)}`)));
  }

  console.log(dim(dot1(`initialize a project`)));
  console.log(cmd3("edgedb project init"));
  console.log(dim(dot1("then follow instructions at https://www.edgedb.com/docs/intro/quickstart#set-up-your-schema")));
}
