import assert from "node:assert/strict";
import test from "node:test";

import worker from "../worker.js";

function makeEnvironment(assetCalls = []) {
  return {
    TURNSTILE_SITE_KEY: "public-test-key",
    ASSETS: {
      async fetch(request) {
        assetCalls.push(request);
        return new Response("asset response", { status: 200 });
      }
    }
  };
}

test("Worker exposes the public form configuration endpoint", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/form-config"),
    makeEnvironment()
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { siteKey: "public-test-key" });
});

test("Worker rejects unknown API routes with JSON", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/unknown"),
    makeEnvironment()
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.deepEqual(await response.json(), { ok: false, code: "not_found" });
});

test("Worker delegates non-API requests to static assets", async () => {
  const assetCalls = [];
  const request = new Request("https://example.com/fr/");
  const response = await worker.fetch(request, makeEnvironment(assetCalls));

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset response");
  assert.deepEqual(assetCalls, [request]);
});
