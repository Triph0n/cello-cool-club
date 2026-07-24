import { isClubCard, reviewStatuses, sortCards } from "./card-utils.mjs";

export function parseArgs(values) {
  const parsed = {};
  const positionals = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  parsed._ = positionals;
  return parsed;
}

export function parseNow(value) {
  if (!value) return new Date();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid --now date: ${value}`);
  }

  return date;
}

export function isCompleteForRelease(card) {
  return reviewStatuses.has(card.status);
}

export function releaseReadinessProblems(card) {
  const problems = [];

  if (!isCompleteForRelease(card)) {
    problems.push(`status is "${card.status}", expected ready_for_review, approved, scheduled, or posted`);
  }

  if (card.status === "ready_for_review") {
    problems.push("card still needs approval");
  }

  if (card.status === "posted") {
    problems.push("card is already posted");
  }

  return problems;
}

// The 3-day release cadence and social posting cover the club deck only.
// Kids deck cards go public via export + QR print, never via run-release.
export function selectNextRelease(cards, now = new Date()) {
  return sortCards(cards).find((card) => {
    if (!isClubCard(card)) return false;
    if (card.status === "approved" && !card.publishAt) return true;
    if (!["approved", "scheduled"].includes(card.status)) return false;
    if (!card.publishAt) return false;

    const publishAt = new Date(card.publishAt);
    if (Number.isNaN(publishAt.getTime())) return false;

    return publishAt <= now;
  });
}

export function findCard(cards, idOrSlug) {
  return cards.find((card) => card.id === idOrSlug || card.slug === idOrSlug || `${card.id}-${card.slug}` === idOrSlug);
}

export function getReleaseConfig(env = process.env) {
  return {
    timeZone: env.RELEASE_TIME_ZONE || "Asia/Jerusalem",
    hour: Number(env.RELEASE_HOUR || 7),
    minute: Number(env.RELEASE_MINUTE || 30),
    cadenceDays: Number(env.RELEASE_CADENCE_DAYS || 3)
  };
}

export function getNextReleaseWindow(cards, now = new Date(), config = getReleaseConfig()) {
  const postedCards = sortCards(cards)
    .filter((card) => isClubCard(card) && card.status === "posted" && card.publishAt)
    .map((card) => ({ card, date: new Date(card.publishAt) }))
    .filter((entry) => !Number.isNaN(entry.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const lastPosted = postedCards.at(-1);
  const nowParts = getZonedParts(now, config.timeZone);
  let targetParts;

  if (lastPosted) {
    const lastParts = getZonedParts(lastPosted.date, config.timeZone);
    targetParts = addLocalDays(
      {
        year: lastParts.year,
        month: lastParts.month,
        day: lastParts.day,
        hour: config.hour,
        minute: config.minute,
        second: 0
      },
      config.cadenceDays
    );
  } else {
    targetParts = {
      year: nowParts.year,
      month: nowParts.month,
      day: nowParts.day,
      hour: config.hour,
      minute: config.minute,
      second: 0
    };

    const todayRelease = zonedDateFromParts(targetParts, config.timeZone);
    if (todayRelease < now) {
      targetParts = addLocalDays(targetParts, 1);
    }
  }

  const releaseAt = zonedDateFromParts(targetParts, config.timeZone);

  return {
    releaseAt,
    releaseAtLocal: formatLocalTimestamp(targetParts, config.timeZone),
    isDue: now >= releaseAt,
    lastPosted: lastPosted?.card || null,
    config
  };
}

export function selectApprovedCardForRelease(cards) {
  return sortCards(cards).find((card) => isClubCard(card) && card.status === "approved");
}

export function formatLocalTimestamp(parts, timeZone) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second || 0).padStart(2, "0")} ${timeZone}`;
}

function addLocalDays(parts, days) {
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, parts.hour, parts.minute, parts.second || 0));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second || 0
  };
}

function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function zonedDateFromParts(parts, timeZone) {
  const desiredLocal = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0);
  let guess = new Date(desiredLocal);

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedParts(guess, timeZone);
    const actualLocal = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second || 0);
    const diff = desiredLocal - actualLocal;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}
