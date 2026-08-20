import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "dist");
const htmlFiles = [];
const errors = [];
let internalLinksChecked = 0;

function collectHtml(directory) {
  for (const name of fs.readdirSync(directory)) {
    const file = path.join(directory, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) collectHtml(file);
    else if (name.endsWith(".html")) htmlFiles.push(file);
  }
}

function resolveInternalTarget(currentFile, href) {
  const [beforeFragment, fragment = ""] = href.split("#");
  const rawPath = beforeFragment.split("?")[0];
  let target = currentFile;

  if (rawPath.startsWith("/")) target = path.join(publicRoot, rawPath);
  else if (rawPath) target = path.resolve(path.dirname(currentFile), rawPath);

  if (target.endsWith(path.sep) || !path.extname(target)) {
    target = path.join(target, "index.html");
  }

  return { target, fragment };
}

collectHtml(publicRoot);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relativeFile = path.relative(publicRoot, file);

  if (/[–—]/.test(html)) errors.push(`${relativeFile}: contains a prohibited dash character`);
  if (/\$50|\$100/.test(html)) errors.push(`${relativeFile}: contains an outdated price`);
  if (html.includes("Spam protection could not load")) {
    errors.push(`${relativeFile}: contains the removed spam warning`);
  }

  const whatsappLinks = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map((match) => match[1]);
  if (whatsappLinks.length === 0) {
    errors.push(`${relativeFile}: missing a WhatsApp contact option`);
  }
  if (whatsappLinks.some((href) => !href.startsWith("https://wa.me/12899313791"))) {
    errors.push(`${relativeFile}: contains an unexpected WhatsApp number`);
  }
  if (["index.html", "fr/index.html"].includes(relativeFile)) {
    if (html.includes("Read what Niagara drivers say") || html.includes("Lire ce que disent les conducteurs de Niagara")) {
      errors.push(`${relativeFile}: contains the removed Meet Babbal review link`);
    }
    const preparedWhatsAppLinks = whatsappLinks.filter((href) => href.startsWith("https://wa.me/12899313791?text="));
    if (preparedWhatsAppLinks.length < 6) {
      errors.push(`${relativeFile}: expected at least 6 prepared WhatsApp contact links, found ${preparedWhatsAppLinks.length}`);
    }
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${relativeFile}: contains duplicate IDs`);

  const h1Count = [...html.matchAll(/<h1(?:\s|>)/g)].length;
  if (h1Count !== 1) errors.push(`${relativeFile}: expected one h1, found ${h1Count}`);

  for (const imageTag of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="[^"]*"/.test(imageTag[0])) {
      errors.push(`${relativeFile}: image without alt text`);
    }
  }

  for (const hrefMatch of html.matchAll(/href="([^"]+)"/g)) {
    const href = hrefMatch[1];
    if (/^(https?:|tel:|sms:|mailto:)/.test(href)) continue;
    internalLinksChecked += 1;

    const { target, fragment } = resolveInternalTarget(file, href);
    if (!fs.existsSync(target)) {
      errors.push(`${relativeFile}: missing target ${href}`);
      continue;
    }

    if (fragment) {
      const targetHtml = fs.readFileSync(target, "utf8");
      if (!targetHtml.includes(`id="${fragment}"`)) {
        errors.push(`${relativeFile}: missing fragment ${href}`);
      }
    }
  }
}

const securityHeaders = fs.readFileSync(path.join(projectRoot, "_headers"), "utf8");
let structuredDataFiles = 0;

for (const relativeFile of ["index.html", "fr/index.html"]) {
  const file = path.join(publicRoot, relativeFile);
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) {
    errors.push(`${relativeFile}: missing structured data`);
    continue;
  }

  structuredDataFiles += 1;
  const structuredData = JSON.parse(match[1]);
  if (structuredData.legalName !== "Babbal Auto Repair Inc.") {
    errors.push(`${relativeFile}: structured data is missing the confirmed legalName`);
  }
  if (Object.hasOwn(structuredData, "legalNom")) {
    errors.push(`${relativeFile}: contains the invalid translated legalNom property`);
  }
  if (relativeFile === "fr/index.html") {
    if (html.includes('content="Babbal Auto Repair, 24/7 mobile service"')) {
      errors.push(`${relativeFile}: social image alternative text was not localized`);
    }
    if (html.includes('content="Mobile roadside and maintenance help across the Niagara Region, day or night."')) {
      errors.push(`${relativeFile}: Twitter description was not localized`);
    }
  }
  const hash = `sha256-${crypto.createHash("sha256").update(match[1]).digest("base64")}`;
  if (!securityHeaders.includes(hash)) {
    errors.push(`${relativeFile}: structured-data hash is missing from the security policy`);
  }
}

const sitemap = fs.readFileSync(path.join(publicRoot, "sitemap.xml"), "utf8");
const sitemapUrlCount = [...sitemap.matchAll(/<url>/g)].length;
const sitemapLastmodCount = [...sitemap.matchAll(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g)].length;
if (sitemapLastmodCount !== sitemapUrlCount) {
  errors.push(`sitemap.xml: expected ${sitemapUrlCount} valid lastmod values, found ${sitemapLastmodCount}`);
}

const indexNowKey = "2349e7fd2e361ec2af90dc7f07097858";
const indexNowKeyFile = path.join(publicRoot, `${indexNowKey}.txt`);
if (!fs.existsSync(indexNowKeyFile) || fs.readFileSync(indexNowKeyFile, "utf8").trim() !== indexNowKey) {
  errors.push("IndexNow: public verification file is missing or invalid");
}

const result = {
  htmlPages: htmlFiles.length,
  internalLinksChecked,
  structuredDataFiles,
  errors
};

console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
