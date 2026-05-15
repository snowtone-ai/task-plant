import test from "node:test";
import assert from "node:assert/strict";
import {
  calcProgress,
  calcGrowthStage,
  countWeeklyCompletedTasks,
  getWeekStartLocal,
  getSpeciesForMonth,
  getStageLabel,
  PLANT_SPECIES,
  toLocalDateString,
} from "../../../src/lib/domain/plant.ts";

test("calcGrowthStage maps weekly completed count to stages", () => {
  assert.equal(calcGrowthStage(-1), 0);
  assert.equal(calcGrowthStage(0), 0);
  assert.equal(calcGrowthStage(1), 1);
  assert.equal(calcGrowthStage(3), 1);
  assert.equal(calcGrowthStage(4), 2);
  assert.equal(calcGrowthStage(7), 2);
  assert.equal(calcGrowthStage(8), 3);
  assert.equal(calcGrowthStage(12), 3);
  assert.equal(calcGrowthStage(13), 4);
  assert.equal(calcGrowthStage(18), 4);
  assert.equal(calcGrowthStage(19), 5);
});

test("calcProgress maps current stage progress including final stage", () => {
  assert.equal(calcProgress(0, 0), 0);
  assert.equal(calcProgress(2, 1), 67);
  assert.equal(calcProgress(5, 2), 50);
  assert.equal(calcProgress(10, 3), 60);
  assert.equal(calcProgress(-1, 1), 0);
  assert.equal(calcProgress(99, 4), 100);
  assert.equal(calcProgress(19, 5), 100);
});

test("plant species covers all months and required archetypes", () => {
  assert.equal(PLANT_SPECIES.length, 12);
  assert.deepEqual(new Set(PLANT_SPECIES.map((plant) => plant.archetype)), new Set([
    "upright",
    "cherry",
    "hanging",
    "delicate",
  ]));
  assert.equal(getStageLabel(5), "満開");
});

test("getSpeciesForMonth rejects invalid months instead of returning blank UI data", () => {
  assert.equal(getSpeciesForMonth(5).name, "バラ");
  assert.throws(() => getSpeciesForMonth(0), /Invalid plant month/);
});

test("countWeeklyCompletedTasks only includes completed tasks in the current week", () => {
  const now = new Date("2026-05-15T12:00:00.000Z");
  const tasks = [
    { completed: true, completedAt: "2026-05-12T00:00:00.000Z" },
    { completed: true, completedAt: "2026-05-15T11:00:00.000Z" },
    { completed: true, completedAt: "2026-05-08T23:59:59.000Z" },
    { completed: false, completedAt: "2026-05-14T10:00:00.000Z" },
    { completed: true, completedAt: null },
  ];

  assert.equal(countWeeklyCompletedTasks(tasks, now), 2);
});

test("getWeekStartLocal uses Monday as start of week", () => {
  const sunday = new Date("2026-05-17T12:00:00+09:00");
  assert.equal(toLocalDateString(getWeekStartLocal(sunday)), "2026-05-11");

  const monday = new Date("2026-05-18T00:01:00+09:00");
  assert.equal(toLocalDateString(getWeekStartLocal(monday)), "2026-05-18");
});

test("toLocalDateString is timezone-safe for local date extraction", () => {
  const localEarlyMorning = new Date("2026-05-18T00:30:00+09:00");
  assert.equal(toLocalDateString(localEarlyMorning), "2026-05-18");
});
