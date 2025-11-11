import { loadMarkdown, type TransformerProps } from "@batijs/core";
import { todoIntro } from "../const";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);

  content.addMarkdown(todoIntro, {
    wrapper: {
      section: "intro",
    },
  });
  content.addMarkdown("", {
    position: "after",
    filter: {
      section: "document",
    },
    wrapper: {
      section: "features",
    },
  });

  return content;
}
