import assert from "node:assert/strict";
import test from "node:test";

import { handleFormConfig } from "../functions/api/form-config.js";
import { handleServiceRequest } from "../functions/api/request.js";

function makeEnvironment(emailCalls = []) {
  return {
    TURNSTILE_SITE_KEY: "test-site-key",
    TURNSTILE_SECRET_KEY: "test-secret-key",
    TURNSTILE_HOSTNAME: "example.com",
    EMAIL_FROM: "website@example.com",
    EMAIL_TO: "babbalautorepair@gmail.com",
    EMAIL: {
      async send(message) {
        emailCalls.push(message);
        return { messageId: "test-message-id" };
      }
    }
  };
}

const environment = makeEnvironment();

const validSubmission = {
  name: "Alex Driver",
  phone: "(905) 555-0100",
  reply: "Text",
  vehicle: "2017 Honda Civic",
  location: "Niagara Falls",
  help: "The car will not start in my driveway.",
  website: "",
  turnstileToken: "verified-test-token"
};

function makeRequest(body = validSubmission, options = {}) {
  return new Request("https://example.com/api/request", {
    method: options.method || "POST",
    headers: {
      "Content-Type": options.contentType || "application/json",
      Origin: options.origin || "https://example.com",
      ...(options.headers || {})
    },
    body: (options.method || "POST") === "GET" ? undefined : JSON.stringify(body)
  });
}

function successfulFetch(calls) {
  return async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json({ success: true, action: "service_request", hostname: "example.com" });
  };
}

async function responseJson(response) {
  return { status: response.status, body: await response.json() };
}

test("valid request verifies the visitor and sends one email", async () => {
  const fetchCalls = [];
  const emailCalls = [];
  const response = await handleServiceRequest(
    { request: makeRequest(), env: makeEnvironment(emailCalls) },
    { fetchFn: successfulFetch(fetchCalls) }
  );
  const result = await responseJson(response);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0].url, /turnstile\/v0\/siteverify$/);
  assert.equal(emailCalls.length, 1);

  const email = emailCalls[0];
  assert.equal(email.to, "babbalautorepair@gmail.com");
  assert.deepEqual(email.from, { email: "website@example.com", name: "Babbal website" });
  assert.match(email.text, /Alex Driver/);
  assert.match(email.subject, /2017 Honda Civic/);
});

test("WhatsApp is accepted as a preferred reply method", async () => {
  const fetchCalls = [];
  const emailCalls = [];
  const request = makeRequest({ ...validSubmission, reply: "WhatsApp" });
  const response = await handleServiceRequest(
    { request, env: makeEnvironment(emailCalls) },
    { fetchFn: successfulFetch(fetchCalls) }
  );

  assert.equal(response.status, 200);
  assert.equal(emailCalls.length, 1);
  assert.match(emailCalls[0].text, /Preferred reply: WhatsApp/);
});

test("email HTML escapes customer-provided markup", async () => {
  const fetchCalls = [];
  const emailCalls = [];
  const request = makeRequest({ ...validSubmission, help: "Please check <script>alert('x')</script> now." });
  const response = await handleServiceRequest(
    { request, env: makeEnvironment(emailCalls) },
    { fetchFn: successfulFetch(fetchCalls) }
  );

  assert.equal(response.status, 200);
  const email = emailCalls[0];
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
});

test("invalid fields are rejected before any external request", async () => {
  let fetchCount = 0;
  const response = await handleServiceRequest(
    { request: makeRequest({ ...validSubmission, phone: "abc" }), env: environment },
    { fetchFn: async () => { fetchCount += 1; } }
  );
  const result = await responseJson(response);

  assert.equal(result.status, 422);
  assert.equal(result.body.code, "invalid_request");
  assert.equal(fetchCount, 0);
});

test("honeypot submissions receive a generic success without sending email", async () => {
  let fetchCount = 0;
  const response = await handleServiceRequest(
    { request: makeRequest({ ...validSubmission, website: "spam.example" }), env: {} },
    { fetchFn: async () => { fetchCount += 1; } }
  );
  const result = await responseJson(response);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(fetchCount, 0);
});

test("failed Turnstile verification blocks email delivery", async () => {
  let fetchCount = 0;
  const response = await handleServiceRequest(
    { request: makeRequest(), env: environment },
    {
      fetchFn: async () => {
        fetchCount += 1;
        return Response.json({ success: false, action: "service_request", hostname: "example.com" });
      }
    }
  );
  const result = await responseJson(response);

  assert.equal(result.status, 422);
  assert.equal(result.body.code, "verification_failed");
  assert.equal(fetchCount, 1);
});

test("a mismatched Turnstile hostname is rejected", async () => {
  const response = await handleServiceRequest(
    { request: makeRequest(), env: environment },
    {
      fetchFn: async () => Response.json({
        success: true,
        action: "service_request",
        hostname: "attacker.example"
      })
    }
  );

  assert.equal(response.status, 422);
});

test("email provider failure returns a retry-safe response", async () => {
  const failingEnvironment = makeEnvironment();
  failingEnvironment.EMAIL.send = async () => {
    throw new Error("email unavailable");
  };
  const response = await handleServiceRequest(
    { request: makeRequest(), env: failingEnvironment },
    {
      fetchFn: async () => Response.json({
        success: true,
        action: "service_request",
        hostname: "example.com"
      })
    }
  );
  const result = await responseJson(response);

  assert.equal(result.status, 502);
  assert.equal(result.body.code, "delivery_failed");
});

test("oversized bodies are rejected", async () => {
  const response = await handleServiceRequest(
    { request: makeRequest({ ...validSubmission, help: "x".repeat(17_000) }), env: environment },
    { fetchFn: async () => { throw new Error("should not be called"); } }
  );

  assert.equal(response.status, 413);
});

test("cross-origin requests are rejected", async () => {
  const response = await handleServiceRequest(
    { request: makeRequest(validSubmission, { origin: "https://attacker.example" }), env: environment },
    { fetchFn: async () => { throw new Error("should not be called"); } }
  );

  assert.equal(response.status, 403);
});

test("unsupported methods and media types are rejected", async () => {
  const getResponse = await handleServiceRequest({
    request: makeRequest(validSubmission, { method: "GET" }),
    env: environment
  });
  const textResponse = await handleServiceRequest({
    request: makeRequest(validSubmission, { contentType: "text/plain" }),
    env: environment
  });

  assert.equal(getResponse.status, 405);
  assert.equal(textResponse.status, 415);
});

test("form config exposes only the public site key", async () => {
  const response = await handleFormConfig({
    request: new Request("https://example.com/api/form-config"),
    env: environment
  });
  const result = await responseJson(response);

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { siteKey: "test-site-key" });
  assert.doesNotMatch(JSON.stringify(result.body), /secret|token/i);
});

test("form config fails closed when it is not configured", async () => {
  const response = await handleFormConfig({
    request: new Request("https://example.com/api/form-config"),
    env: {}
  });

  assert.equal(response.status, 503);
});
