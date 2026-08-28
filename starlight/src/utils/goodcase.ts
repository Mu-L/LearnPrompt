/**
 * Cross-link helpers for goodcase.ai (the AI-case evidence library that
 * LearnPrompt is the top-of-funnel course site for).
 *
 * Category values (`image` | `video` | `web`) match GoodCase's own
 * `?filter=` query param on /cases — confirmed by reading
 * goodcaseai/src/app/[lang]/cases/page.tsx (`normalizeFilter`), NOT by
 * guessing. Note the param key is `filter`, not `category` — see the PR
 * description for why this deviates from the original brief.
 */

export type GoodCaseCategory = "image" | "video" | "web";

/**
 * Maps a top-level LearnPrompt docs directory (the first path segment of a
 * Starlight route id, after stripping any `en/` locale prefix) to a
 * GoodCase.ai case category.
 *
 * Conservative/explicit mapping only: directories are included here only
 * when they match one of the three concrete examples given in the brief
 * (image tools, video tools, or Claude Code / Codex coding tools). Adjacent
 * agent-engineering / agent-skills / knowledge-workflow topics are treated
 * as "other" and fall back to the unfiltered /cases page rather than being
 * guessed into `web`.
 */
const DIRECTORY_TO_CATEGORY: Record<string, GoodCaseCategory> = {
  "stable-diffusion": "image",
  "ai-video": "video",
  "ai-coding": "web",
  "claude-code": "web",
  codex: "web",
};

const GOODCASE_CASES_URL = "https://goodcase.ai/cases";

export interface GoodCaseLinkOptions {
  /** Starlight route id, e.g. "ai-video/capcut-ai-video-workflow" or "en/codex/codex-cli-workflow". */
  routeId: string;
}

/**
 * Builds the goodcase.ai/cases link (with filter + UTM params) for a given
 * Starlight doc route. Falls back to the unfiltered cases page for topics
 * that don't map cleanly to an image/video/web category.
 */
export function buildGoodCaseCourseFooterLink({ routeId }: GoodCaseLinkOptions): string {
  const topicPath = routeId.replace(/^en\//, "");
  const topic = topicPath.split("/")[0] ?? "";
  const category = DIRECTORY_TO_CATEGORY[topic];

  const params = new URLSearchParams();
  if (category) params.set("filter", category);
  params.set("utm_source", "learnprompt");
  params.set("utm_medium", "course_footer");
  params.set("utm_campaign", topic || "general");

  return `${GOODCASE_CASES_URL}?${params.toString()}`;
}
