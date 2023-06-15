import { type MaybeContentGetter, type VikeMeta } from "@batijs/core";

export default function createDefaultIndexHtml(_currentContent: MaybeContentGetter, meta: VikeMeta) {
  if (meta.BATI_MODULES?.some((m) => m.startsWith("framework:"))) return null;

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
