import { testCliFailure } from "./utils.js";

testCliFailure(["solid", "react", "vue"], ["authjs"], "A Server is required when using Auth");
