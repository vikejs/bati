import type { MantineThemeOverride } from "@mantine/core";
import { createTheme } from "@mantine/core";

const theme: MantineThemeOverride = createTheme({
  /** Put your mantine theme override here */
  primaryColor: "violet",
});

export default theme;
