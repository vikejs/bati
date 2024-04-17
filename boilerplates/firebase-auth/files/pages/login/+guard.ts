// https://vike.dev/guard
import { redirect } from "vike/abort";
import type { GuardAsync } from "vike/types";

const guard: GuardAsync = async (pageContext): ReturnType<GuardAsync> => {
  if (pageContext.user) {
    throw redirect("/");
  }
};

export { guard };
