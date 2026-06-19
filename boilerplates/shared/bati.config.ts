import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  enforce: "pre",
  knip: {
    ignore: ["*.spec.ts"],
    ignoreDependencies: ["@batijs/tests-utils", "turbo"],
  },
  // Always-present Vike-core skills (SKILLS_PLAN.md §6.B) — the framework conventions agents most
  // often get wrong. Kept lean and pointed at vike.dev so they're cheap to keep current.
  skills(meta) {
    const pageFile = meta.BATI.has("vue") ? "+Page.vue" : "+Page.tsx";
    const uiPkg = meta.BATI.has("vue") ? "vike-vue" : meta.BATI.has("solid") ? "vike-solid" : "vike-react";

    return [
      {
        name: "vike-routing",
        description:
          "How to add pages and routes in this Vike app. Use when creating a page, adding a route, route parameters, a layout, or an error page.",
        body: `Routing is file-based under \`pages/\`.

- A route is a directory containing a \`${pageFile}\` component, e.g. \`pages/about/${pageFile}\` → \`/about\`.
- The index route is \`pages/index/${pageFile}\` → \`/\`.
- **Parameterized routes:** add a \`+route.ts\` exporting a Route String (e.g. \`"/product/@id"\`); read the value from \`pageContext.routeParams\`.
- **Layouts / wrappers:** add \`+Layout.*\` (nested layout) or \`+Wrapper.*\` beside or above a page.
- **Error page:** \`pages/_error/+Page.*\` renders 404s and runtime errors.

See https://vike.dev/routing.`,
      },
      {
        name: "vike-data-fetching",
        description:
          "How to load data for a page in this Vike app. Use when a page needs server or client data, or you're working with +data / useData.",
        body: `- Add a \`+data.ts\` beside the page's component and export a \`data()\` function. It runs on the server (and on the client during client-side navigation) and receives \`pageContext\`.
- Read the result in the component with \`useData<DataType>()\` (from \`${uiPkg}\`).
- Only values listed in the \`passToClient\` config are serialized to the client; \`+data\` results are passed automatically.
- For request-time logic such as auth checks or redirects, use a \`+guard.ts\`.

See https://vike.dev/data.`,
      },
      {
        name: "vike-config",
        description:
          "How Vike configuration works in this app. Use when changing global or per-route config, the page title/head, prerendering, or SSR settings.",
        body: `- \`+config.ts\` files configure Vike. A \`+config.ts\` directly under \`pages/\` is global; one inside a route directory applies to that route and its descendants.
- Set the document title and meta tags via \`+Head.*\`, \`+title\`, and \`+description\`.
- UI-framework integration is provided by \`${uiPkg}\` (already configured).
- Toggle SSR / prerendering via the \`ssr\` / \`prerender\` settings in \`+config.ts\`.

See https://vike.dev/config.`,
      },
      {
        name: "vike-navigation",
        description:
          "How to navigate between pages in this Vike app. Use when adding links, redirecting, navigating programmatically, or prefetching.",
        body: `- **Links:** plain \`<a href="/...">\` works — Vike intercepts it for client-side navigation. Highlight the active link by comparing \`pageContext.urlPathname\` (see the \`vike-pagecontext\` skill).
- **Programmatic:** \`import { navigate } from "vike/client/router"\`, then \`await navigate("/path", { keepScrollPosition })\`.
- **Redirect:** in a \`+guard.ts\` or \`+data.ts\`, \`import { redirect } from "vike/abort"\`, then \`throw redirect("/login")\`.
- **Prefetch:** set \`+prefetchStaticAssets\` to \`"hover"\` / \`"viewport"\` in config, or call \`prefetch("/path")\` from \`vike/client/router\`.

See https://vike.dev/navigate.`,
      },
      {
        name: "vike-render-modes",
        description:
          "How rendering modes work in this Vike app (SSR / SSG / SPA / streaming). Use when changing how a page is rendered or pre-rendered.",
        body: `Set these in a \`+config.ts\` (global under \`pages/\`, or per-route):
- **\`ssr\`** — \`true\` (default) renders on the server then hydrates; \`false\` makes the page client-only (SPA).
- **\`prerender\`** — \`true\` builds the page to static HTML at build time (SSG). For parameterized routes (\`/movie/@id\`), add a \`+onBeforePrerenderStart.ts\` returning the list of URLs to pre-render.
- **\`stream\`** — toggle HTML streaming.

See https://vike.dev/pre-rendering.`,
      },
      {
        name: "vike-pagecontext",
        description:
          "How to use pageContext in this Vike app. Use when reading request/route info in a component or passing custom values to the client.",
        body: `\`pageContext\` carries request + render info — common props: \`routeParams\`, \`urlPathname\` / \`urlParsed\`, \`data\` (from \`+data\`), \`isClientSide\`.
- **Read it in a component:** \`import { usePageContext } from "${uiPkg}/usePageContext"\`, then \`const pageContext = usePageContext()\`.
- **Custom values:** set them on \`pageContext\` from a hook (\`+onBeforeRender\` or \`+data\`), and add their names to \`+passToClient\` so they reach the browser.
- **Types:** \`PageContext\` / \`PageContextServer\` / \`PageContextClient\` from \`vike/types\`.

See https://vike.dev/pageContext.`,
      },
      {
        name: "vike-hooks",
        description:
          "The Vike hook system in this app. Use when you need a lifecycle hook — data orchestration, page-transition effects, post-hydration setup, or global init.",
        body: `Hooks are \`+<name>.ts\` files (or keys in \`+config.ts\`) placed beside a page or globally under \`pages/\`. App-level hooks:
- **\`+onBeforeRender\`** (server) — advanced data orchestration; can set any \`pageContext\` prop.
- **\`+onPageTransitionStart\` / \`+onPageTransitionEnd\`** (client) — run around client-side navigation (e.g. a loading indicator); \`pageContext.isBackwardNavigation\` is available.
- **\`+onHydrationEnd\`** (client) — runs once after the first page hydrates; good for third-party / DOM-only init.
- **\`+onCreateGlobalContext\`** (server & client) — runs once when the global context is created; global / auth / store init.
- \`+data\` and \`+guard\` are the common data/auth hooks (see the \`vike-data-fetching\` skill); \`+onBeforePrerenderStart\` lists URLs for SSG (see \`vike-render-modes\`).
- \`+onRenderHtml\` / \`+onRenderClient\` / \`+onCreateApp\` are provided by \`${uiPkg}\` — you rarely write these.

See https://vike.dev/hooks.`,
      },
      {
        name: "vike-error-pages",
        description:
          "How error pages work in this Vike app. Use when handling 404s, access errors, or rendering an error page by status code.",
        body: `The error page is \`pages/_error/${pageFile}\` — Vike renders it for 404s and uncaught errors.
- **Trigger it:** \`import { render } from "vike/abort"\`, then \`throw render(404)\` (or \`401\` / \`403\` / \`500\`), optionally \`throw render(403, "Forbidden")\` to pass a reason. Use \`throw redirect("/login")\` (from \`vike/abort\`) to redirect instead.
- **Read the error** in \`_error\`: \`const { abortStatusCode, abortReason, is404 } = usePageContext()\` (from \`${uiPkg}/usePageContext\`).
- **Custom reason type:** augment \`Vike.PageContext\` with \`abortReason\` in a \`.d.ts\`.
- Pre-rendering emits the error page as \`dist/client/404.html\`.

See https://vike.dev/error-page.`,
      },
    ];
  },
});
