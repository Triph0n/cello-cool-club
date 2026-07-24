import test from "node:test";
import assert from "node:assert/strict";
import {
  findCard,
  getNextReleaseWindow,
  parseArgs,
  selectApprovedCardForRelease,
  selectNextRelease
} from "../scripts/release-utils.mjs";

const config = { timeZone: "Asia/Jerusalem", hour: 7, minute: 30, cadenceDays: 3 };

test("parseArgs handles flags, values, and positionals", () => {
  const parsed = parseArgs(["002", "--confirm", "--now", "2026-06-07T05:00:00Z"]);
  assert.deepEqual(parsed._, ["002"]);
  assert.equal(parsed.confirm, true);
  assert.equal(parsed.now, "2026-06-07T05:00:00Z");
});

test("findCard matches by id, slug, and combined form", () => {
  const cards = [{ id: "001", slug: "the-clock" }];
  assert.equal(findCard(cards, "001"), cards[0]);
  assert.equal(findCard(cards, "the-clock"), cards[0]);
  assert.equal(findCard(cards, "001-the-clock"), cards[0]);
  assert.equal(findCard(cards, "missing"), undefined);
});

test("selectNextRelease picks approved card without publishAt", () => {
  const cards = [
    { number: 1, status: "posted", publishAt: "2026-06-01T05:00:00Z" },
    { number: 2, status: "approved" }
  ];
  assert.equal(selectNextRelease(cards), cards[1]);
});

test("selectNextRelease skips scheduled cards that are not due yet", () => {
  const now = new Date("2026-06-05T00:00:00Z");
  const cards = [{ number: 1, status: "scheduled", publishAt: "2026-06-10T05:00:00Z" }];
  assert.equal(selectNextRelease(cards, now), undefined);
});

test("selectApprovedCardForRelease picks lowest-numbered approved card", () => {
  const cards = [
    { number: 3, status: "approved" },
    { number: 1, status: "posted" },
    { number: 2, status: "approved" }
  ];
  assert.equal(selectApprovedCardForRelease(cards).number, 2);
});

test("release selection ignores kids deck cards", () => {
  const cards = [
    { number: 1, deck: "kids", status: "approved" },
    { number: 2, status: "approved" }
  ];
  assert.equal(selectNextRelease(cards).number, 2);
  assert.equal(selectApprovedCardForRelease(cards).number, 2);
  assert.equal(selectNextRelease([cards[0]]), undefined);
});

test("getNextReleaseWindow cadence ignores posted kids cards", () => {
  const cards = [
    { number: 1, status: "posted", publishAt: "2026-06-01T04:30:00Z" },
    { number: 2, deck: "kids", status: "posted", publishAt: "2026-06-03T04:30:00Z" }
  ];
  const now = new Date("2026-06-02T00:00:00Z");
  const window = getNextReleaseWindow(cards, now, config);
  assert.equal(window.releaseAt.toISOString(), "2026-06-04T04:30:00.000Z");
  assert.equal(window.lastPosted.number, 1);
});

test("getNextReleaseWindow schedules cadence days after last posted card", () => {
  const cards = [
    { number: 1, status: "posted", publishAt: "2026-06-01T04:30:00Z" }
  ];
  const now = new Date("2026-06-02T00:00:00Z");
  const window = getNextReleaseWindow(cards, now, config);

  // 2026-06-01 07:30 Jerusalem (UTC+3) + 3 days = 2026-06-04 07:30 = 04:30 UTC
  assert.equal(window.releaseAt.toISOString(), "2026-06-04T04:30:00.000Z");
  assert.equal(window.isDue, false);
  assert.equal(window.lastPosted.number, 1);
});

test("getNextReleaseWindow is due when the slot has passed", () => {
  const cards = [
    { number: 1, status: "posted", publishAt: "2026-06-01T04:30:00Z" }
  ];
  const now = new Date("2026-06-04T05:00:00Z");
  const window = getNextReleaseWindow(cards, now, config);
  assert.equal(window.isDue, true);
});

test("getNextReleaseWindow with no posted cards targets today or tomorrow", () => {
  const now = new Date("2026-06-05T10:00:00Z");
  const window = getNextReleaseWindow([], now, config);

  // 07:30 Jerusalem already passed at 10:00 UTC, so next slot is tomorrow.
  assert.equal(window.releaseAt.toISOString(), "2026-06-06T04:30:00.000Z");
  assert.equal(window.lastPosted, null);
});
