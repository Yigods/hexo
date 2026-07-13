+"use strict";

const fs = require("fs");
const path = require("path");

const publicDir = path.resolve(__dirname, "..", "public");

function walkHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(absolutePath);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolutePath] : [];
  });
}

function localTargetExists(url) {
  const cleanUrl = url.split(/[?#]/, 1)[0];
  if (!cleanUrl || !cleanUrl.startsWith("/") || cleanUrl.startsWith("//")) return true;

  let decoded;
  try {
    decoded = decodeURIComponent(cleanUrl);
  } catch {
    decoded = cleanUrl;
  }

  const relativePath = decoded.replace(/^\/+/, "");
  const directPath = path.join(publicDir, relativePath);
  return fs.existsSync(directPath) || fs.existsSync(path.join(directPath, "index.html"));
}

const errors = [];
for (const htmlPath of walkHtml(publicDir)) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const relativeHtmlPath = path.relative(publicDir, htmlPath);
  const attributePattern = /\b(?:href|src)=(?:"([^"]+)"|'([^']+)')/g;
  for (const match of html.matchAll(attributePattern)) {
    const url = match[1] || match[2];
    if (!localTargetExists(url)) errors.push(`${relativeHtmlPath}: missing ${url}`);
  }

  if (relativeHtmlPath === path.join("essays", "index.html")) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) errors.push(`${relativeHtmlPath}: duplicate ids ${[...new Set(duplicates)].join(", ")}`);
  }
}

const essaysBundlePath = path.join(publicDir, "js/build/layouts/essays.js");
const essaysBundle = fs.readFileSync(essaysBundlePath, "utf8");
for (const marker of ["essay-filter-button", "essay-archive-panel", "bindEssayArchiveNav"]) {
  if (!essaysBundle.includes(marker)) errors.push(`stale essays bundle: missing ${marker}`);
}

if (fs.existsSync(path.join(publicDir, "1970"))) errors.push("unexpected 1970 archive was generated");

if (errors.length) {
  console.error(`Generated-site check failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Generated-site check passed.");
