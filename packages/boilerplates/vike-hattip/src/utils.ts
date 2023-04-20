export async function loadJsonFile(currentContent: (() => string | Promise<string>) | undefined) {
  const content = await currentContent?.();

  if (typeof content !== "string") {
    throw new Error("TODO");
  }

  return JSON.parse(content);
}
