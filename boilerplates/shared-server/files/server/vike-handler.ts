import { renderPage } from "vike/server";

export async function vikeHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  context?: Context,
): Promise<Response> {
  const pageContextInit = { ...(context ?? {}), urlOriginal: request.url };
  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  return new Response(response?.getReadableWebStream(), {
    status: response?.statusCode,
    headers: response?.headers,
  });
}
