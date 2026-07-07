import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getPublicSiteUrl, getSitePath, loadLocalEnv } from "./card-utils.mjs";

// Stages only the public file set (no PRD, source folders, previews or local
// scripts) into a temp folder and pushes it to Cloudflare Pages via wrangler.

await loadLocalEnv();

const projectName = process.env.CF_PAGES_PROJECT || "cello-cool-club";
const sitePath = getSitePath();

if (!getPublicSiteUrl()) {
  console.warn("Warning: PUBLIC_SITE_URL is not set — deploying a site with relative og:/RSS links and no sitemap.");
}

const publicEntries = [
  "index.html",
  "styles.css",
  "script.js",
  "feed.xml",
  "robots.txt",
  "sitemap.xml",
  path.join("data", "cards.json"),
  "cards",
  "p",
  "assets"
];

const stageDir = await fs.mkdtemp(path.join(os.tmpdir(), "ccc-pages-"));

try {
  for (const entry of publicEntries) {
    const source = path.join(sitePath, entry);
    try {
      await fs.access(source);
    } catch {
      if (entry === "sitemap.xml") continue;
      throw new Error(`Missing public file: ${source} — run "npm run build" first.`);
    }
    const target = path.join(stageDir, entry);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.cp(source, target, { recursive: true });
  }

  const accountFlag = process.env.CLOUDFLARE_ACCOUNT_ID
    ? { CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID }
    : {};

  console.log(`Deploying ${stageDir} to Cloudflare Pages project "${projectName}"...`);
  const result = spawnSync(
    `npx --yes wrangler pages deploy "${stageDir}" --project-name ${projectName} --branch main --commit-dirty=true`,
    { shell: true, stdio: "inherit", env: { ...process.env, ...accountFlag } }
  );

  process.exitCode = result.status ?? 1;
} finally {
  await fs.rm(stageDir, { recursive: true, force: true });
}
