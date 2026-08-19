import { handleFormConfig } from "./functions/api/form-config.js";
import { handleServiceRequest } from "./functions/api/request.js";

const apiHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function apiNotFound() {
  return new Response(JSON.stringify({ ok: false, code: "not_found" }), {
    status: 404,
    headers: apiHeaders
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/form-config") {
      return handleFormConfig({ request, env });
    }

    if (pathname === "/api/request") {
      return handleServiceRequest({ request, env });
    }

    if (pathname.startsWith("/api/")) {
      return apiNotFound();
    }

    return env.ASSETS.fetch(request);
  }
};
