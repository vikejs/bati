import { testCliFailure } from "./utils";

testCliFailure(["solid", "react", "vue"], ["authjs"], "A Server is mandatory when using Auth");
