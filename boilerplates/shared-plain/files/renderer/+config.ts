// Environment: config

/**
 * @see {@link https://vike.dev/render-modes#html-only}
 */
export default {
  meta: {
    Page: {
      env: { server: true, client: false }, // HTML-only for all pages
    },
  },
};
