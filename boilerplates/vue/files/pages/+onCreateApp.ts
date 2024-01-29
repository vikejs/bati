import type { OnCreateAppSync } from "vike-vue/types";
import VueGtag from "vue-gtag";

// BATI.has("google-analytics")
export const onCreateApp: OnCreateAppSync = (pageContext): ReturnType<OnCreateAppSync> => {
  const { app } = pageContext;

  // See https://matteo-gabriele.gitbook.io/vue-gtag/
  app.use(VueGtag, {
    config: {
      id: import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS,
    },
  });
};
