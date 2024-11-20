import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: BATI.has("vue")
    ? [
        "./components/**/*.{js,jsx,ts,tsx,vue}",
        "./layouts/**/*.{js,jsx,ts,tsx,vue}",
        "./pages/**/*.{js,jsx,ts,tsx,vue}",
        "./src/**/*.{js,jsx,ts,tsx,vue}",
      ]
    : [
        "./components/**/*.{js,jsx,ts,tsx}",
        "./layouts/**/*.{js,jsx,ts,tsx}",
        "./pages/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
      ],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {},
  },

  // The output directory for your css system
  outdir: "styled-system",
});
