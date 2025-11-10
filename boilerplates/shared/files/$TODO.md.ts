import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);

  content.addMarkdown("The following steps need to be performed before starting your application.", {
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
