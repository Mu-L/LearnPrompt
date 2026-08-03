import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const repositoryDirectory = join(scriptDirectory, "..", "..");
const vercelConfig = JSON.parse(
  await readFile(join(repositoryDirectory, "vercel.json"), "utf8")
);

const expectedRedirects = [
  {
    source: "/zh-Hans/docs/:path*/",
    destination: "https://v1.learnprompt.pro/zh-Hans/docs/:path*/",
    statusCode: 301,
  },
  {
    source: "/zh-Hans/docs/:path*",
    destination: "https://v1.learnprompt.pro/zh-Hans/docs/:path*",
    statusCode: 301,
  },
  {
    source: "/docs/:path*/",
    destination: "https://v1.learnprompt.pro/docs/:path*/",
    statusCode: 301,
  },
  {
    source: "/docs/:path*",
    destination: "https://v1.learnprompt.pro/docs/:path*",
    statusCode: 301,
  },
];

for (const expected of expectedRedirects) {
  const actual = (vercelConfig.redirects || []).find(
    (redirect) => redirect.source === expected.source
  );
  if (
    !actual ||
    actual.destination !== expected.destination ||
    actual.statusCode !== expected.statusCode
  ) {
    throw new Error(`Missing legacy redirect: ${expected.source}`);
  }
}

const legacyPathnames = [
  "/zh-Hans/docs/llm-agents/ai-town/",
  "/zh-Hans/docs/stable-diffusion/installation/",
  "/docs/stable-diffusion/sd-prompt-syntax/",
  "/zh-Hans/docs/prompt-engineering/reducing-gpt-hallucinations/",
];

for (const pathname of legacyPathnames) {
  const expectedPrefix = pathname.startsWith("/zh-Hans/docs/")
    ? "/zh-Hans/docs/"
    : "/docs/";
  const redirect = expectedRedirects.find(
    (item) => item.source === `${expectedPrefix}:path*/`
  );
  const preservedPath = pathname.slice(expectedPrefix.length, -1);
  const destination = redirect.destination.replace(
    ":path*",
    preservedPath
  );
  if (destination !== `https://v1.learnprompt.pro${pathname}`) {
    throw new Error(`Legacy path does not preserve its content path: ${pathname}`);
  }
}

console.log("Legacy documentation redirects are configured.");
