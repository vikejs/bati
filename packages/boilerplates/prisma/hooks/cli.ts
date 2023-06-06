import { withIcon } from "@batijs/core";
import { blueBright, bold, dim, gray, underline } from "colorette";

export default function oncli() {
  const arrow0 = withIcon("→", blueBright);
  const dot1 = withIcon("•", blueBright, 1);
  const cmd3 = withIcon("$", gray, 3);

  console.log("\n" + bold(arrow0(`Next steps: ${underline("Prisma")}`)));
  console.log(dim(dot1(`setup Prisma`)));
  console.log(cmd3("pnpx prisma init"));
  console.log(
    dim(
      dot1(
        "then follow instructions at https://www.prisma.io/docs/getting-started/quickstart#2-model-your-data-in-the-prisma-schema"
      )
    )
  );
}
