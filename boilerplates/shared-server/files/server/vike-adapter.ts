import { renderPage } from "vike/server";

export async function vikeAdapter<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  context?: Context,
): Promise<Response> {
  const pageContextInit = { urlOriginal: request.url, ...(context ?? {}) };
  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  return new Response(response?.getReadableWebStream(), {
    status: response?.statusCode,
    headers: response?.headers,
  });
}
