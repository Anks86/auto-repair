const MAX_BODY_BYTES = 16_384;
const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "service_request";
const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

class RequestError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new RequestError("request_too_large", 413);
  }

  if (!request.body) throw new RequestError("invalid_request", 400);

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RequestError("request_too_large", 413);
    }
    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();

  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid-object");
    }
    return parsed;
  } catch {
    throw new RequestError("invalid_request", 400);
  }
}

function cleanText(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim() : "";
}

function isSingleLine(value, min, max) {
  return value.length >= min && value.length <= max && !/[\r\n\u0000-\u001f\u007f]/u.test(value);
}

function validateSubmission(input) {
  const submission = {
    name: cleanText(input.name),
    phone: cleanText(input.phone),
    reply: cleanText(input.reply),
    vehicle: cleanText(input.vehicle),
    location: cleanText(input.location),
    help: cleanText(input.help).replace(/\r\n?/g, "\n"),
    website: cleanText(input.website),
    turnstileToken: cleanText(input.turnstileToken)
  };

  const phoneDigits = submission.phone.replace(/\D/g, "");
  const phoneIsValid = isSingleLine(submission.phone, 7, 30)
    && /^[+()0-9.\-\s]+$/u.test(submission.phone)
    && phoneDigits.length >= 7
    && phoneDigits.length <= 15;
  const helpIsValid = submission.help.length >= 5
    && submission.help.length <= 1200
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(submission.help);

  const valid = isSingleLine(submission.name, 2, 80)
    && phoneIsValid
    && ["Call", "Text", "WhatsApp"].includes(submission.reply)
    && isSingleLine(submission.vehicle, 2, 120)
    && isSingleLine(submission.location, 2, 120)
    && helpIsValid
    && submission.website.length <= 200
    && submission.turnstileToken.length > 0
    && submission.turnstileToken.length <= 2048;

  if (!valid) throw new RequestError("invalid_request", 422);
  return submission;
}

function requiredEnvironment(env) {
  const names = [
    "TURNSTILE_SECRET_KEY",
    "EMAIL_FROM",
    "EMAIL_TO"
  ];

  for (const name of names) {
    if (!env[name]) throw new RequestError("form_unavailable", 503);
  }

  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    throw new RequestError("form_unavailable", 503);
  }
}

async function fetchWithTimeout(fetchFn, url, options, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyTurnstile(submission, request, env, fetchFn) {
  const verificationBody = {
    secret: env.TURNSTILE_SECRET_KEY,
    response: submission.turnstileToken,
    idempotency_key: crypto.randomUUID()
  };
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) verificationBody.remoteip = remoteIp;

  let response;
  try {
    response = await fetchWithTimeout(fetchFn, TURNSTILE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verificationBody)
    });
  } catch {
    throw new RequestError("verification_unavailable", 503);
  }

  if (!response.ok) throw new RequestError("verification_unavailable", 503);

  let result;
  try {
    result = await response.json();
  } catch {
    throw new RequestError("verification_unavailable", 503);
  }

  const hostnameMatches = !env.TURNSTILE_HOSTNAME || result.hostname === env.TURNSTILE_HOSTNAME;
  return result.success === true && result.action === TURNSTILE_ACTION && hostnameMatches;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function buildEmail(submission, env, requestId) {
  const subjectVehicle = submission.vehicle.replace(/\s+/g, " ").slice(0, 70);
  const text = [
    "New website service request",
    "",
    `Name: ${submission.name}`,
    `Phone: ${submission.phone}`,
    `Preferred reply: ${submission.reply}`,
    `Vehicle: ${submission.vehicle}`,
    `Municipality or postal code: ${submission.location}`,
    "",
    "Help requested:",
    submission.help,
    "",
    `Request reference: ${requestId}`
  ].join("\n");
  const htmlHelp = escapeHtml(submission.help).replace(/\n/g, "<br>");
  const html = [
    "<h1>New website service request</h1>",
    `<p><strong>Name:</strong> ${escapeHtml(submission.name)}<br>`,
    `<strong>Phone:</strong> ${escapeHtml(submission.phone)}<br>`,
    `<strong>Preferred reply:</strong> ${escapeHtml(submission.reply)}<br>`,
    `<strong>Vehicle:</strong> ${escapeHtml(submission.vehicle)}<br>`,
    `<strong>Municipality or postal code:</strong> ${escapeHtml(submission.location)}</p>`,
    `<p><strong>Help requested:</strong><br>${htmlHelp}</p>`,
    `<p><small>Request reference: ${requestId}</small></p>`
  ].join("");

  return {
    to: env.EMAIL_TO,
    from: {
      email: env.EMAIL_FROM,
      name: "Babbal website"
    },
    subject: `New service request, ${subjectVehicle}`,
    text,
    html
  };
}

async function sendEmail(submission, env, requestId) {
  try {
    await env.EMAIL.send(buildEmail(submission, env, requestId));
  } catch {
    throw new RequestError("delivery_failed", 502);
  }
}

function requestIsSameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function handleServiceRequest({ request, env }, dependencies = {}) {
  const fetchFn = dependencies.fetchFn || fetch;
  const requestId = crypto.randomUUID();

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405);
  }

  if (!requestIsSameOrigin(request)) {
    return jsonResponse({ ok: false, code: "invalid_origin" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ ok: false, code: "unsupported_media_type" }, 415);
  }

  try {
    const input = await readJsonBody(request);

    if (cleanText(input.website)) {
      return jsonResponse({ ok: true, reference: requestId });
    }

    const submission = validateSubmission(input);
    requiredEnvironment(env);

    const verified = await verifyTurnstile(submission, request, env, fetchFn);
    if (!verified) throw new RequestError("verification_failed", 422);

    await sendEmail(submission, env, requestId);
    return jsonResponse({ ok: true, reference: requestId });
  } catch (error) {
    const knownError = error instanceof RequestError;
    const code = knownError ? error.code : "internal_error";
    const status = knownError ? error.status : 500;

    console.error(JSON.stringify({ event: "service_request_failed", requestId, code, status }));
    return jsonResponse({ ok: false, code }, status);
  }
}

export const onRequest = handleServiceRequest;
