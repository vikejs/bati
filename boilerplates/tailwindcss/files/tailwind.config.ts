import daisyui from "daisyui";
import type { Config } from "tailwindcss";

export default {
  content: ["./{pages,layouts,components,src}/**/*.{html,js,jsx,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: BATI.has("daisyui") ? [daisyui] : [],
} satisfies Config;
