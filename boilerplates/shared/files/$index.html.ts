import { type TransformerProps } from "@batijs/core";
import { features } from "@batijs/features";

const frameworkFeatures = features.filter((f) => f.category === "Framework").map((f) => f.flag);

export default function createDefaultIndexHtml(props: TransformerProps) {
  if (Array.from(props.meta.BATI).some((m) => frameworkFeatures.includes(m))) return null;

  return `<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>My App</title>
</head>
<body>
<h1>Created with Bâti</h1>
</body>
</html>`;
}
