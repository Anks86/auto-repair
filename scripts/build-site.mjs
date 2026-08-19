import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFrenchSite } from "./french-site.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");
const publicFiles = [
  "index.html",
  "privacy.html",
  "accessibility.html",
  "404.html",
  "styles.css",
  "script.js",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "2349e7fd2e361ec2af90dc7f07097858.txt",
  "_headers"
];

if (path.dirname(outputDirectory) !== projectRoot || path.basename(outputDirectory) !== "dist") {
  throw new Error("Refusing to clean an unexpected output directory.");
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(projectRoot, file), path.join(outputDirectory, file));
}

await cp(path.join(projectRoot, "assets"), path.join(outputDirectory, "assets"), { recursive: true });
await buildFrenchSite(projectRoot, outputDirectory);
console.log(`Built public site in ${outputDirectory}`);
