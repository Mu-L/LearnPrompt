import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const repositoryDirectory = join(scriptDirectory, "..", "..");
const vercelConfig = JSON.parse(
  await readFile(join(repositoryDirectory, "vercel.json"), "utf8")
);

const canonicalRedirects = [
  {
    source: "/zh-Hans/docs/llm-agents/ai-town/",
    destination: "/llm-agents/ai-town/",
    statusCode: 301,
  },
  {
    source: "/zh-Hans/docs/llm-agents/ai-town",
    destination: "/llm-agents/ai-town/",
    statusCode: 301,
  },
  {
    source: "/zh-Hans/docs/stable-diffusion/installation/",
    destination: "/stable-diffusion/installation/",
    statusCode: 301,
  },
  {
    source: "/zh-Hans/docs/stable-diffusion/installation",
    destination: "/stable-diffusion/installation/",
    statusCode: 301,
  },
  {
    source: "/docs/stable-diffusion/sd-prompt-syntax/",
    destination: "/stable-diffusion/sd-prompt-syntax/",
    statusCode: 301,
  },
  {
    source: "/docs/stable-diffusion/sd-prompt-syntax",
    destination: "/stable-diffusion/sd-prompt-syntax/",
    statusCode: 301,
  },
  {
    source: "/zh-Hans/docs/prompt-engineering/reducing-gpt-hallucinations/",
    destination: "/prompt-engineering/reducing-gpt-hallucinations/",
    statusCode: 301,
  },
  {
    source: "/zh-Hans/docs/prompt-engineering/reducing-gpt-hallucinations",
    destination: "/prompt-engineering/reducing-gpt-hallucinations/",
    statusCode: 301,
  },
];

const archiveRedirects = [
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

const expectedRedirects = [...canonicalRedirects, ...archiveRedirects];

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

const legacyCanonicalPairs = [
  ["/zh-Hans/docs/llm-agents/ai-town/", "/llm-agents/ai-town/"],
  ["/zh-Hans/docs/stable-diffusion/installation/", "/stable-diffusion/installation/"],
  ["/docs/stable-diffusion/sd-prompt-syntax/", "/stable-diffusion/sd-prompt-syntax/"],
  [
    "/zh-Hans/docs/prompt-engineering/reducing-gpt-hallucinations/",
    "/prompt-engineering/reducing-gpt-hallucinations/",
  ],
];

for (const [source, destination] of legacyCanonicalPairs) {
  const redirect = (vercelConfig.redirects || []).find(
    (item) => item.source === source
  );
  if (!redirect || redirect.destination !== destination) {
    throw new Error(`Legacy topic does not redirect to its canonical page: ${source}`);
  }
  const archiveSource = source.startsWith("/zh-Hans/docs/")
    ? "/zh-Hans/docs/:path*/"
    : "/docs/:path*/";
  if (
    (vercelConfig.redirects || []).findIndex((item) => item.source === source) >=
    (vercelConfig.redirects || []).findIndex(
      (item) => item.source === archiveSource
    )
  ) {
    throw new Error(
      `Canonical redirect must precede archive fallback for ${source}`
    );
  }
}

for (const archive of archiveRedirects) {
  const actual = (vercelConfig.redirects || []).find(
    (item) => item.source === archive.source
  );
  if (!actual || actual.destination !== archive.destination) {
    throw new Error(`Archive fallback changed: ${archive.source}`);
  }
}

console.log("Legacy documentation redirects are configured.");
