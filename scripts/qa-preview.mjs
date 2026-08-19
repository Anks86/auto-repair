import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "dist");
const port = Number(process.env.QA_PORT || 4173);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".webp", "image/webp"]
]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(body));
}

async function readBody(request, limit = 16_384) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > limit) throw new Error("too-large");
  }
  return JSON.parse(body);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/form-config") {
    sendJson(response, 200, { siteKey: "1x00000000000000000000AA" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/request") {
    try {
      const body = await readBody(request);
      const required = ["name", "phone", "reply", "vehicle", "location", "help", "turnstileToken"];
      if (!required.every((field) => typeof body[field] === "string" && body[field].trim())) {
        sendJson(response, 422, { ok: false, code: "invalid_request" });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
      sendJson(response, 200, { ok: true, reference: "local-qa-only" });
    } catch {
      sendJson(response, 400, { ok: false, code: "invalid_request" });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405).end();
    return;
  }

  const requestedPath = url.pathname === "/"
    ? "index.html"
    : url.pathname.endsWith("/")
      ? `${url.pathname.replace(/^\/+/, "")}index.html`
      : url.pathname.replace(/^\/+/, "");
  const filePath = path.resolve(publicRoot, requestedPath);
  if (!filePath.startsWith(`${publicRoot}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }

  try {
    const details = await stat(filePath);
    if (!details.isFile()) throw new Error("not-file");
    response.writeHead(200, {
      "Content-Length": details.size,
      "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    const notFoundPath = path.join(publicRoot, url.pathname.startsWith("/fr/") ? "fr/404.html" : "404.html");
    const details = await stat(notFoundPath);
    response.writeHead(404, {
      "Content-Length": details.size,
      "Content-Type": "text/html; charset=utf-8"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(notFoundPath).pipe(response);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`QA preview ready at http://127.0.0.1:${port}`);
  console.log("This preview simulates delivery locally and never sends or stores a request.");
});
