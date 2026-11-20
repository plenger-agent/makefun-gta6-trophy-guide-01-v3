// The audit strip: every number on it is computed from the data at run time,
// never typed by hand, so the strip can only say what the data actually holds.
import { sourcesCitedByTrophy } from './data.js';

export function computeGuideAudit(data) {
  let totalSteps = 0;
  let citedSteps = 0;
  let guidesCiting = 0;
  let multiBacked = 0;
  let disputes = 0;
  for (const trophy of data.trophies) {
    const cited = sourcesCitedByTrophy(trophy);
    if (cited.length > 0) guidesCiting += 1;
    if (cited.length >= 2) multiBacked += 1;
    disputes += (trophy.disputes || []).length;
    for (const step of trophy.steps) {
      totalSteps += 1;
      if (step.c && step.c.length > 0) citedSteps += 1;
    }
  }
  const byGrade = (g) => data.trophies.filter((t) => t.grade === g).length;
  return {
    total: data.trophies.length,
    hidden: data.trophies.filter((t) => t.hidden).length,
    platinum: byGrade('platinum'),
    gold: byGrade('gold'),
    silver: byGrade('silver'),
    bronze: byGrade('bronze'),
    totalSteps,
    citedSteps,
    guidesCiting,
    multiBacked,
    disputes,
    missableYes: data.trophies.filter((t) => t.missable === 'yes').length,
    missableWatch: data.trophies.filter((t) => t.missable === 'watch').length,
    unconfirmed: data.trophies.filter((t) => t.confirm === 'unconfirmed').length,
    sourceCount: data.sources.length,
    readOn: data.sourcesReadOn,
  };
}

function chip(html) {
  return `<span class="audit-chip">${html}</span>`;
}

export function renderAuditStrip(el, data) {
  const a = computeGuideAudit(data);
  const readDate = new Date(`${a.readOn}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  el.innerHTML = [
    chip(`<strong>${a.total}/${a.total}</strong> official name, description, grade`),
    chip(`<strong>${a.platinum}P · ${a.gold}G · ${a.silver}S · ${a.bronze}B</strong> · ${a.hidden} PSN-hidden`),
    chip(`<strong>${a.citedSteps}/${a.totalSteps}</strong> guide steps cited`),
    chip(`<strong>${a.guidesCiting}/${a.total}</strong> guides cite sources`),
    chip(`<strong>${a.multiBacked}</strong> backed by 2+ sources`),
    chip(`<strong>${a.sourceCount} sites</strong>, read ${readDate}`),
    chip(`<strong>${a.missableYes}</strong> possibly missable · <strong>${a.missableWatch}</strong> on watch`),
    chip(`<strong>${a.unconfirmed}</strong> unconfirmed · <strong>${a.disputes}</strong> disputes shown both ways`),
  ].join('');
}
