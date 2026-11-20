// The missables view: the missable levels, the watch list, the unconfirmed
// trophies flagged instead of guessed, and every source disagreement shown
// both ways. Names obey the same spoiler shield as the tracker.
import { displayDescription, displayName, isMasked } from './tracker.js';

function esc(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function card(trophy, store, cls, heading) {
  const masked = isMasked(trophy, store);
  const body = masked
    ? 'Covered until earned — flip Show spoilers in the header to read its guide here.'
    : esc(trophy.guide);
  return `<div class="miss-card ${cls}"><h4>${esc(displayName(trophy, store))} <small>(${esc(heading)})</small></h4><p>${body}</p></div>`;
}

export function renderMissables(el, data, store) {
  const yes = data.trophies.filter((t) => t.missable === 'yes');
  const watch = data.trophies.filter((t) => t.missable === 'watch');
  const unconfirmed = data.trophies.filter((t) => t.confirm === 'unconfirmed');
  const disputed = data.trophies.filter((t) => (t.disputes || []).length > 0);
  const section = (title, trophies, cls, heading) => `
    <div class="miss-group"><h3>${title} (${trophies.length})</h3>
    ${trophies.map((t) => card(t, store, cls, heading)).join('') || '<p class="empty-note">None.</p>'}</div>`;
  const disputes = disputed.map((t) => t.disputes.map((d) => {
    const a = data.sourcesById.get(d.a.s);
    const b = data.sourcesById.get(d.b.s);
    return `<div class="dispute-box"><h4>${esc(displayName(t, store))} — sources disagree</h4>
      <p><strong>${esc(d.q)}</strong></p>
      <p>${esc(a ? a.name : d.a.s)}: ${esc(d.a.t)}</p>
      <p>${esc(b ? b.name : d.b.s)}: ${esc(d.b.t)}</p></div>`;
  }).join('')).join('');
  el.innerHTML =
    section('Possibly missable — bank these before the finale', yes, '', 'missable level: yes') +
    section('On watch — availability narrows late in the story', watch, 'watch', 'missable level: watch') +
    section('Unconfirmed — flagged, not guessed', unconfirmed, 'unconfirmed', 'no source has confirmed the trigger yet') +
    `<div class="miss-group"><h3>Where sources disagree — shown both ways (${disputed.reduce((n, t) => n + t.disputes.length, 0)})</h3>${disputes}</div>`;
}
