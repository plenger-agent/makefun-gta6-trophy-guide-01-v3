// The roadmap view: five stages to the platinum, each with its own progress,
// and the manual-save warnings the missable flags demand.
import { stageProgress } from './planner.js';
import { displayName, isMasked } from './tracker.js';

export function renderRoadmap(el, data, store) {
  const lede = `<p class="roadmap-lede">One playthrough, no online trophies. The story itself is the
    short part; the long pole is the 100% counter and the big activity quotas, so the roadmap banks
    every missable-flagged and one-off trophy as it passes, and keeps a manual save at the start of
    each chapter — the endgame choice trophy (Actions Speak Louder) is the one thing a careless
    save can cost you.</p>`;
  const cards = data.stages.map((stage) => {
    const progress = stageProgress(data, store, stage.n);
    const pct = progress.total ? Math.round((progress.earned / progress.total) * 100) : 0;
    const chips = progress.trophies.map((t) => {
      const done = store.isEarned(t.id) ? ' done' : '';
      const masked = isMasked(t, store) ? ' masked' : '';
      return `<span class="stage-trophy${done}${masked}">${escapeHtml(displayName(t, store))}</span>`;
    }).join('');
    return `<article class="stage-card">
      <h3>Stage ${stage.n} — ${escapeHtml(stage.name)} · ${progress.earned}/${progress.total} earned</h3>
      <p class="stage-note">${escapeHtml(stage.note)}</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="stage-trophies">${chips}</div>
    </article>`;
  }).join('');
  el.innerHTML = lede + cards;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
