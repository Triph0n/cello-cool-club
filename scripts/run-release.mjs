import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  engineRoot,
  loadLocalEnv,
  readCards,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { buildGenericSocialPost } from "./social-utils.mjs";
import {
  getNextReleaseWindow,
  getReleaseConfig,
  parseArgs,
  parseNow,
  selectApprovedCardForRelease
} from "./release-utils.mjs";

const options = parseArgs(process.argv.slice(2));
await loadLocalEnv();

const now = parseNow(options.now || options._?.[0]);
const config = getReleaseConfig();
const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Release runner stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const window = getNextReleaseWindow(cards, now, config);
const approvedCard = selectApprovedCardForRelease(cards);

console.log(`Release check at: ${now.toISOString()}`);
console.log(`Next release slot: ${window.releaseAtLocal} (${window.releaseAt.toISOString()})`);
console.log(`Cadence: every ${config.cadenceDays} day(s) at ${String(config.hour).padStart(2, "0")}:${String(config.minute).padStart(2, "0")} ${config.timeZone}`);
console.log(`Last posted: ${window.lastPosted ? `${window.lastPosted.id} - ${window.lastPosted.title}` : "none"}`);

if (!window.isDue) {
  console.log("No release due yet.");
  process.exit(0);
}

if (!approvedCard) {
  console.error("Release is due, but no card has status approved. Nothing was published.");
  process.exit(1);
}

const socialPost = buildGenericSocialPost(approvedCard);

if (!options.confirm) {
  console.log(`Dry run: would release ${approvedCard.id} - ${approvedCard.title}`);
  console.log("");
  console.log(socialPost.text);
  console.log("");
  console.log("Run again with --confirm to mark the card posted and export the public website.");
  process.exit(0);
}

const previousStatus = approvedCard.status;
const previousPublishAt = approvedCard.publishAt;

approvedCard.status = "posted";
approvedCard.publishAt = window.releaseAt.toISOString();
approvedCard.releaseLog = approvedCard.releaseLog || [];
approvedCard.releaseLog.push({
  releasedAt: new Date().toISOString(),
  scheduledFor: window.releaseAt.toISOString(),
  timeZone: config.timeZone,
  mode: "local-confirm"
});

await writeCards(sortCards(cards));
await writeSocialDraft(approvedCard, socialPost);

try {
  await runNodeScript("export-public-site.mjs");
} catch (error) {
  approvedCard.status = previousStatus;
  approvedCard.publishAt = previousPublishAt;
  approvedCard.releaseLog.pop();
  await writeCards(sortCards(cards));

  console.error(`Public website export failed: ${error.message}`);
  console.error(`Card ${approvedCard.id} was rolled back to status "${previousStatus}". Nothing was released.`);
  process.exit(1);
}

console.log(`Released ${approvedCard.id} - ${approvedCard.title}`);
console.log("Public website export completed.");

async function writeSocialDraft(card, post) {
  const outputDir = path.join(engineRoot, "exports", "release");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, `${card.id}-${card.slug}.txt`), `${post.text}\n`, "utf8");
  await fs.writeFile(path.join(outputDir, `${card.id}-${card.slug}.json`), `${JSON.stringify(post, null, 2)}\n`, "utf8");
}

function runNodeScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(engineRoot, "scripts", scriptName)], {
      cwd: engineRoot,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} exited with code ${code}`));
      }
    });
  });
}
