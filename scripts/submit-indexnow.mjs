import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "niagaraautorepair.com";
const key = "2349e7fd2e361ec2af90dc7f07097858";
const keyLocation = `https://${host}/${key}.txt`;
const keyContents = (await readFile(path.join(projectRoot, `${key}.txt`), "utf8")).trim();

if (keyContents !== key) {
  throw new Error("The IndexNow verification file does not match the configured key.");
}

const sitemap = await readFile(path.join(projectRoot, "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);

if (urlList.length === 0 || urlList.some((url) => new URL(url).host !== host)) {
  throw new Error("The sitemap does not contain valid URLs for the configured IndexNow host.");
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList })
});

if (![200, 202].includes(response.status)) {
  const detail = (await response.text()).slice(0, 500);
  throw new Error(`IndexNow rejected the submission with HTTP ${response.status}: ${detail}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`);
