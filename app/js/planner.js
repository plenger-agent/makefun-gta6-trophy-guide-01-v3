// The planner: what to do next, in roadmap order, and per-stage progress.
import { trophiesInRoadmapOrder } from './data.js';

// The next unearned trophy in roadmap order — the one the player should chase.
export function nextUpTrophy(data, store) {
  return trophiesInRoadmapOrder(data).find((t) => !store.isEarned(t.id)) || null;
}

export function stageProgress(data, store, stageNumber) {
  const inStage = data.trophies.filter((t) => t.stage === stageNumber);
  const earned = inStage.filter((t) => store.isEarned(t.id)).length;
  return { earned, total: inStage.length, trophies: inStage };
}

export function overallProgress(data, store) {
  const earned = data.trophies.filter((t) => store.isEarned(t.id)).length;
  return { earned, total: data.trophies.length };
}

export function renderNextUp(el, data, store, displayName) {
  const next = nextUpTrophy(data, store);
  if (!next) {
    el.textContent = 'Platinum earned — the list is complete.';
    return;
  }
  el.innerHTML = `Next up in roadmap order: <strong></strong>`;
  el.querySelector('strong').textContent = displayName(next);
}
