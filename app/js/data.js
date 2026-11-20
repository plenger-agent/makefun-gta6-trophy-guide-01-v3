// Loads the atlas data files (trophies + sources) and indexes them for the feature modules.
export async function loadAtlasData() {
  const [trophyFile, sourceFile] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/sources.json').then((r) => r.json()),
  ]);
  const sourcesById = new Map(sourceFile.sources.map((s) => [s.id, s]));
  const trophiesById = new Map(trophyFile.trophies.map((t) => [t.id, t]));
  return {
    game: trophyFile.game,
    platform: trophyFile.platform,
    stages: trophyFile.stages,
    trophies: trophyFile.trophies,
    sources: sourceFile.sources,
    sourcesReadOn: sourceFile.readOn,
    sourcesById,
    trophiesById,
  };
}

// Roadmap order: by stage, then by the official list order (id).
export function trophiesInRoadmapOrder(data) {
  return [...data.trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
}

export function stageName(data, n) {
  const stage = data.stages.find((s) => s.n === n);
  return stage ? stage.name : `Stage ${n}`;
}

// Every distinct source id a trophy's steps cite, in citation order.
export function sourcesCitedByTrophy(trophy) {
  const seen = [];
  for (const step of trophy.steps) {
    for (const id of step.c) {
      if (!seen.includes(id)) seen.push(id);
    }
  }
  return seen;
}
