"use client";

import { useCallback, useEffect, useState } from "react";
import { getDb, type PlantState } from "@/lib/db";
import {
  calcGrowthStage,
  getWeekStartLocal,
  getCurrentSpecies,
  toLocalDateString,
  type GrowthStage,
  type PlantSpecies,
} from "@/lib/domain/plant";

function getWeekStart(): string {
  return toLocalDateString(getWeekStartLocal(new Date()));
}

async function loadPlantState(): Promise<PlantState> {
  const db = getDb();
  const weekStart = getWeekStart();
  const now = new Date().toISOString();
  const existing = await db.plantState.get(1);

  if (!existing) {
    const created = {
      id: 1,
      weeklyCompleted: 0,
      lifetimeCompleted: 0,
      weekStartDate: weekStart,
      lastUpdated: now,
    };
    await db.plantState.put(created);
    return created;
  }

  if (existing.weekStartDate < weekStart) {
    const reset = {
      ...existing,
      weeklyCompleted: 0,
      weekStartDate: weekStart,
      lastUpdated: now,
    };
    await db.plantState.put(reset);
    return reset;
  }

  return existing;
}

async function changeCompleted(delta: 1 | -1): Promise<PlantState | null> {
  const db = getDb();
  return db.transaction("rw", db.plantState, async () => {
    const current = await loadPlantState();
    if (delta < 0 && current.weeklyCompleted <= 0) return current;

    const updated = {
      ...current,
      weeklyCompleted: current.weeklyCompleted + delta,
      lifetimeCompleted: Math.max(0, current.lifetimeCompleted + delta),
      lastUpdated: new Date().toISOString(),
    };
    await db.plantState.put(updated);
    return updated;
  });
}

export function usePlant() {
  const [state, setState] = useState<PlantState | null>(null);
  const species: PlantSpecies = getCurrentSpecies();
  const stage: GrowthStage = state ? calcGrowthStage(state.weeklyCompleted) : 0;

  useEffect(() => {
    loadPlantState()
      .then(setState)
      .catch((err) => console.error("[plant] load failed:", err));
  }, []);

  const incrementCompleted = useCallback(async () => {
    const updated = await changeCompleted(1);
    if (updated) setState(updated);
  }, []);

  const decrementCompleted = useCallback(async () => {
    const updated = await changeCompleted(-1);
    if (updated) setState(updated);
  }, []);

  return { state, species, stage, incrementCompleted, decrementCompleted };
}
