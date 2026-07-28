import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const expectedBase = (process.env.EXPECTED_BASE || "").replace(/\/$/, "");
const dist = new URL("../dist/", import.meta.url);
const distDirectory = fileURLToPath(dist);
const englishRoutes = [
  "/en/",
  "/en/start-here/",
  "/en/start-here/ai-practice-map/",
  "/en/start-here/context-task-verification/",
];
const chineseRoutes = [
  "/",
  "/start-here/",
  "/start-here/ai-practice-map/",
  "/start-here/context-task-verification/",
];

const routeFile = (route) =>
  new URL(`${route.replace(/^\//, "")}index.html`, dist);

const assertFile = async (url, label) => {
  try {
    const info = await stat(url);
    if (!info.isFile()) throw new Error();
  } catch {
    throw new Error(`Missing ${label}: ${url.pathname}`);
  }
};

const allEnglishFiles = [];
const collectIndexFiles = async (directory) => {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = join(directory, entry.name);
    if (entry.isDirectory()) await collectIndexFiles(child);
    if (entry.isFile() && entry.name === "index.html") allEnglishFiles.push(child);
  }
};

await collectIndexFiles(join(distDirectory, "en"));
const actualEnglishRoutes = allEnglishFiles
  .map((file) => `/${file.split("/dist/")[1].replace(/index\.html$/, "")}`)
  .sort();
const expectedEnglishRoutes = [...englishRoutes].sort();
if (JSON.stringify(actualEnglishRoutes) !== JSON.stringify(expectedEnglishRoutes)) {
  throw new Error(
    `English route allowlist mismatch.\nExpected: ${expectedEnglishRoutes.join(", ")}\nActual: ${actualEnglishRoutes.join(", ")}`
  );
}

for (const route of chineseRoutes) await assertFile(routeFile(route), `Chinese route ${route}`);

for (const route of englishRoutes) {
  const file = routeFile(route);
  await assertFile(file, `English route ${route}`);
  const html = await readFile(file, "utf8");
  if (!/<html[^>]*lang="en"/.test(html)) throw new Error(`Missing lang=en: ${route}`);

  const prose = html.replaceAll("中文原文", "").replaceAll("中文", "");
  if (/[\u4e00-\u9fff]/.test(prose)) throw new Error(`Unexpected Chinese fallback content: ${route}`);

  const internalUrls = [...html.matchAll(/\b(?:href|src)="(\/[^"]*)"/g)].map((match) => match[1]);
  const badUrls = expectedBase
    ? internalUrls.filter((url) => !url.startsWith(`${expectedBase}/`))
    : internalUrls.filter((url) => url.startsWith("//"));
  if (badUrls.length) {
    throw new Error(`Base URL mismatch in ${route}: ${[...new Set(badUrls)].join(", ")}`);
  }
}

console.log(
  `i18n slice PASS: ${englishRoutes.length} English routes, ${chineseRoutes.length} Chinese regressions, base=${expectedBase || "/"}`
);
