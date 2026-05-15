/** Plant growth domain logic — pure functions, no side effects. */

export interface PlantSpecies {
  month: number;
  name: string;
  nameEn: string;
  color: string;
  accentColor: string;
  archetype: "upright" | "cherry" | "hanging" | "delicate";
}

export interface CompletedTaskRecord {
  completed: boolean;
  completedAt: string | null;
}

export const PLANT_SPECIES: PlantSpecies[] = [
  { month: 1,  name: "梅",       nameEn: "plum",        color: "#f8b4c8", accentColor: "#e8a0b4", archetype: "cherry" },
  { month: 2,  name: "蝋梅",     nameEn: "wintersweet", color: "#ffe066", accentColor: "#f5c842", archetype: "cherry" },
  { month: 3,  name: "桜",       nameEn: "sakura",      color: "#ffb7c5", accentColor: "#f090a8", archetype: "cherry" },
  { month: 4,  name: "藤",       nameEn: "wisteria",    color: "#c5a0e8", accentColor: "#a07acc", archetype: "hanging" },
  { month: 5,  name: "バラ",     nameEn: "rose",        color: "#e83a3a", accentColor: "#c02020", archetype: "upright" },
  { month: 6,  name: "紫陽花",   nameEn: "hydrangea",   color: "#7b9fe8", accentColor: "#5a7ed4", archetype: "hanging" },
  { month: 7,  name: "ひまわり", nameEn: "sunflower",   color: "#ffd700", accentColor: "#e6b800", archetype: "upright" },
  { month: 8,  name: "朝顔",     nameEn: "morning_glory", color: "#6a8ed4", accentColor: "#4a6ec0", archetype: "delicate" },
  { month: 9,  name: "コスモス", nameEn: "cosmos",      color: "#f4a0c8", accentColor: "#e07aaa", archetype: "delicate" },
  { month: 10, name: "金木犀",   nameEn: "osmanthus",   color: "#f5a623", accentColor: "#e08010", archetype: "delicate" },
  { month: 11, name: "菊",       nameEn: "chrysanthemum", color: "#f0f0f0", accentColor: "#d0d0d0", archetype: "upright" },
  { month: 12, name: "シクラメン", nameEn: "cyclamen",  color: "#e84080", accentColor: "#c02060", archetype: "upright" },
];

export type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5;

const THRESHOLDS = [0, 3, 7, 12, 18, Infinity] as const;

/** Map weekly completed count to a growth stage (0-5). */
export function calcGrowthStage(weeklyCompleted: number): GrowthStage {
  const completed = Math.max(0, weeklyCompleted);
  const stage = THRESHOLDS.findIndex((threshold) => completed <= threshold);
  return Math.max(0, stage) as GrowthStage;
}

/** Progress percentage toward the next growth stage. */
export function calcProgress(weeklyCompleted: number, stage: GrowthStage): number {
  const hi = THRESHOLDS[stage];
  if (stage === 0) return 0;
  if (hi === Infinity) return 100;

  const lo = THRESHOLDS[stage - 1];
  const completed = Math.max(0, weeklyCompleted);
  const progress = Math.round(((completed - lo) / (hi - lo)) * 100);
  return Math.min(100, Math.max(0, progress));
}

export function getCurrentSpecies(): PlantSpecies {
  const month = new Date().getMonth() + 1; // 1-12
  return getSpeciesForMonth(month);
}

export function getSpeciesForMonth(month: number): PlantSpecies {
  const species = PLANT_SPECIES.find((plantSpecies) => plantSpecies.month === month);
  if (!species) throw new Error(`Invalid plant month: ${month}`);
  return species;
}

export function countWeeklyCompletedTasks(
  tasks: CompletedTaskRecord[],
  now: Date
): number {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  return tasks.filter((task) => {
    if (!task.completed || !task.completedAt) return false;
    const completedAt = new Date(task.completedAt);
    return completedAt >= weekStart && completedAt <= now;
  }).length;
}

const STAGE_LABELS = ["種", "芽吹き", "葉が出た", "つぼみ", "開花中", "満開"] as const;

export function getStageLabel(stage: GrowthStage): string {
  return STAGE_LABELS[stage];
}
