const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

export async function handleFormConfig({ request, env }) {
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405);
  }

  if (!env.TURNSTILE_SITE_KEY) {
    return jsonResponse({ ok: false, code: "form_unavailable" }, 503);
  }

  return jsonResponse({ siteKey: env.TURNSTILE_SITE_KEY });
}

export const onRequest = handleFormConfig;
