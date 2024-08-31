<template>
  <div>
    <h1>Sentry Test Page</h1>
    <div v-if="!isSentryClientInitialized" style="color: red">
      Sentry Client is not initialized! Vite Mode: {{ isProdMode ? "PROD" : "DEV" }}
    </div>

    <div>
      <button @click="throwError">Throw Javascript Error</button>
    </div>
  </div>
</template>

<script>
import * as Sentry from "@sentry/vue";
export default {
  data() {
    return {
      isSentryClientInitialized: false,
      isProdMode: import.meta.env.PROD,
    };
  },
  mounted() {
    this.isSentryClientInitialized = !!Sentry.getClient();
  },
  methods: {
    throwError() {
      const mode = import.meta.env.DEV ? "DEV Mode" : "PROD Mode";
      throw new Error(`This is a Vue SENTRY Browser Vue Test! [${mode}]`);
    },
  },
};
</script>
