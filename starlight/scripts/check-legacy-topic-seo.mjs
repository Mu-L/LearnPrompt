import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const expectedBase = (process.env.EXPECTED_BASE || "").replace(/\/$/, "");
const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const projectDirectory = join(scriptDirectory, "..");
const distDirectory = join(projectDirectory, "dist");

const topics = [
  {
    route: "/llm-agents/ai-town/",
    links: ["/agent-engineering/orchestration-layer/", "/agent-frameworks/openclaw-architecture-guide/"],
  },
  {
    route: "/stable-diffusion/installation/",
    links: ["/stable-diffusion/sd-prompt-syntax/"],
  },
  {
    route: "/stable-diffusion/sd-prompt-syntax/",
    links: ["/stable-diffusion/installation/"],
  },
  {
    route: "/prompt-engineering/reducing-gpt-hallucinations/",
    links: ["/start-here/context-task-verification/", "/agent-engineering/feedback-loop/"],
  },
  {
    route: "/ai-video/capcut-ai-video-workflow/",
    links: ["/start-here/context-task-verification/", "/ai-coding/project-checklist/"],
  },
  {
    route: "/ai-video/zhipu-qingying-ai-video/",
    links: ["/start-here/context-task-verification/", "/stable-diffusion/sd-prompt-syntax/"],
  },
];

const routeFile = (route) =>
  join(distDirectory, route.replace(/^\/|\/$/g, ""), "index.html");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sitemap = await readFile(join(distDirectory, "sitemap-0.xml"), "utf8");
const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => {
  const pathname = new URL(url).pathname;
  return expectedBase && pathname.startsWith(`${expectedBase}/`)
    ? pathname.slice(expectedBase.length)
    : pathname;
});

for (const { route, links } of topics) {
  for (const localeRoute of [route, `/en${route}`]) {
    const html = await readFile(routeFile(localeRoute), "utf8");
    for (const marker of [
      'name="description"',
      'rel="canonical"',
      'property="og:image"',
      'type="application/ld+json"',
    ]) {
      assert(html.includes(marker), `Missing ${marker} on ${localeRoute}`);
    }
    assert(sitemapRoutes.includes(localeRoute), `Missing sitemap route: ${localeRoute}`);
  }

  const sourceFile = `${route.replace(/^\/|\/$/g, "")}.mdx`;
  const chineseSource = await readFile(
    join(projectDirectory, "src", "content", "docs", sourceFile),
    "utf8"
  );
  const englishSource = await readFile(
    join(projectDirectory, "src", "content", "docs", "en", sourceFile),
    "utf8"
  );
  for (const link of links) {
    assert(chineseSource.includes(`](${link})`), `Missing Chinese internal link: ${link}`);
    assert(
      englishSource.includes(`](/en${link})`),
      `Missing English internal link: /en${link}`
    );
  }
}

for (const legacyRoute of ["/docs/", "/zh-Hans/docs/"]) {
  assert(
    !sitemapRoutes.some((route) => route.startsWith(legacyRoute)),
    `Redirect-only legacy route leaked into sitemap: ${legacyRoute}`
  );
}

console.log(`Legacy topic SEO PASS: ${topics.length} bilingual canonical topics`);
