import { NoHydration } from "solid-js/web";

export default function Head() {
  return (
    <NoHydration>
      <meta
        name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
      />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />

      <meta property="og:title" content="Bati" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://raw.githubusercontent.com/batijs/bati/main/doc/bati.png" />
      <meta property="og:url" content="https://batijs.github.io" />
      <meta
        property="og:description"
        content="Next-gen scaffolder. Get started with fully-functional apps, and choose any tool you want."
      />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="batijs.github.io" />
      <meta property="twitter:url" content="https://batijs.github.io" />
      <meta name="twitter:title" content="Bati" />
      <meta
        name="twitter:description"
        content="Next-gen scaffolder. Get started with fully-functional apps, and choose any tool you want."
      />
      <meta name="twitter:image" content="https://raw.githubusercontent.com/batijs/bati/main/doc/bati.png" />
    </NoHydration>
  );
}
