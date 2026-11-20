// The tracker: a stage-grouped checklist with filters that carry counts, a
// spoiler shield that masks hidden story trophies until they are earned,
// progress steppers for counted trophies, and a detail pane whose guide is
// numbered steps, every one cited, with a per-trophy notes field.
import { stageName, sourcesCitedByTrophy, trophiesInRoadmapOrder } from './data.js';

// --- The spoiler system -------------------------------------------------
// A PSN-hidden trophy the player has not earned is masked everywhere while
// the Show spoilers switch is off: its name becomes "Hidden trophy" and its
// description "Story trophy — covered until earned". Earning it, or turning
// the switch on, reveals it.
export function isMasked(trophy, store) {
  return trophy.hidden && !store.isEarned(trophy.id) && !store.state.settings.showSpoilers;
}
export function displayName(trophy, store) {
  return isMasked(trophy, store) ? 'Hidden trophy' : trophy.name;
}
export function displayDescription(trophy, store) {
  return isMasked(trophy, store) ? 'Story trophy — covered until earned' : trophy.description;
}

const KIND_FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'story', label: 'Story', test: (t) => t.kinds.includes('story') },
  { key: 'missable', label: 'Missable', test: (t) => t.missable !== 'no' },
  { key: 'collectibles', label: 'Collectibles', test: (t) => t.kinds.includes('collectibles') },
  { key: 'activities', label: 'Activities', test: (t) => t.kinds.includes('activities') },
  { key: 'secret', label: 'Secret', test: (t) => t.hidden },
];

function esc(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function gradeChip(trophy) {
  return `<span class="grade-chip grade-${trophy.grade}">${trophy.grade}</span>`;
}
function levelChip(trophy) {
  if (trophy.missable === 'yes') return '<span class="level-chip">missable</span>';
  if (trophy.missable === 'watch') return '<span class="level-chip watch">watch</span>';
  return '';
}
function stepperHtml(trophy, store, cls) {
  const n = store.countOf(trophy.id);
  return `<span class="${cls}" data-stepper="${trophy.id}">
    <button type="button" data-step="-1" aria-label="Decrease count">−</button>
    <span class="count-text">${n}/${trophy.count}</span>
    <button type="button" data-step="1" aria-label="Increase count">+</button>
  </span>`;
}

function matchesFilters(trophy, ctx) {
  const { ui, store } = ctx;
  const kind = KIND_FILTERS.find((f) => f.key === ui.kind) || KIND_FILTERS[0];
  if (!kind.test(trophy)) return false;
  if (ui.grade !== 'all' && trophy.grade !== ui.grade) return false;
  if (store.state.settings.hideEarned && store.isEarned(trophy.id)) return false;
  if (ui.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.tags.join(' ')}`.toLowerCase();
    if (!hay.includes(ui.query.toLowerCase())) return false;
  }
  return true;
}

function renderFilterChips(ctx) {
  const { data, els } = ctx;
  els.chips.innerHTML = KIND_FILTERS.map((f) => {
    const n = data.trophies.filter((t) => f.test(t)).length;
    const active = ctx.ui.kind === f.key ? ' active' : '';
    return `<button type="button" class="filter-chip${active}" data-kind="${f.key}">${f.label} <span class="chip-count">${n}</span></button>`;
  }).join('');
}

function renderList(ctx) {
  const { data, store, els } = ctx;
  const visible = trophiesInRoadmapOrder(data).filter((t) => matchesFilters(t, ctx));
  if (visible.length === 0) {
    els.list.innerHTML = '<p class="empty-note">No trophies match these filters.</p>';
    return;
  }
  let html = '';
  let lastStage = null;
  for (const trophy of visible) {
    if (trophy.stage !== lastStage) {
      lastStage = trophy.stage;
      html += `<div class="stage-group"><h3>Stage ${lastStage} — ${esc(stageName(data, lastStage))}</h3>`;
    }
    const masked = isMasked(trophy, store);
    const earned = store.isEarned(trophy.id);
    const selected = ctx.ui.selectedId === trophy.id ? ' selected' : '';
    const note = store.noteOf(trophy.id) ? '<span class="note-marker">note</span>' : '';
    const stepper = trophy.count ? stepperHtml(trophy, store, 'row-stepper') : '';
    html += `<button type="button" class="trophy-row${earned ? ' earned' : ''}${masked ? ' masked-row' : ''}${selected}" data-row="${trophy.id}">
      <span class="row-check">${earned ? '✓' : '○'}</span>
      <span class="row-main"><span class="row-name">${esc(displayName(trophy, store))}</span>
      <span class="row-desc">${esc(displayDescription(trophy, store))}</span></span>
      ${note}${levelChip(trophy)}${stepper}${gradeChip(trophy)}
    </button>`;
    const nextStage = visible[visible.indexOf(trophy) + 1]?.stage;
    if (nextStage !== lastStage) html += '</div>';
  }
  els.list.innerHTML = html;
}

function disputeHtml(trophy, data) {
  if (!trophy.disputes || trophy.disputes.length === 0) return '';
  return trophy.disputes.map((d) => {
    const a = data.sourcesById.get(d.a.s);
    const b = data.sourcesById.get(d.b.s);
    return `<div class="dispute-box"><h4>Sources disagree — both ways shown</h4>
      <p><strong>${esc(d.q)}</strong></p>
      <p>${esc(a ? a.name : d.a.s)}: ${esc(d.a.t)}</p>
      <p>${esc(b ? b.name : d.b.s)}: ${esc(d.b.t)}</p></div>`;
  }).join('');
}

function renderDetail(ctx) {
  const { data, store, els } = ctx;
  const trophy = data.trophiesById.get(ctx.ui.selectedId) || data.trophies[0];
  const earned = store.isEarned(trophy.id);
  if (isMasked(trophy, store)) {
    els.detail.innerHTML = `<div class="covered-box">
      <p class="covered-title">Hidden trophy</p>
      <p>Story trophy — covered until earned.</p>
      <p>${gradeChip(trophy)} <span class="detail-tag">Stage ${trophy.stage} — ${esc(stageName(data, trophy.stage))}</span></p>
      <p>Its name, description and guide stay covered while <strong>Show spoilers</strong> is off.
      Earn it in the game, or flip the switch in the header, to reveal everything.</p>
      <button type="button" class="earned-button${earned ? ' is-earned' : ''}" data-earned="${trophy.id}">${earned ? 'Earned ✓ (tap to undo)' : 'Mark as earned'}</button>
    </div>`;
    return;
  }
  const cited = sourcesCitedByTrophy(trophy);
  const tags = [
    ...trophy.kinds.map((k) => `<span class="detail-tag">${esc(k)}</span>`),
    `<span class="detail-tag">Stage ${trophy.stage} — ${esc(stageName(data, trophy.stage))}</span>`,
    trophy.hidden ? '<span class="detail-tag">PSN-hidden</span>' : '',
    trophy.missable === 'yes' ? '<span class="detail-tag warn">possibly missable</span>' : '',
    trophy.missable === 'watch' ? '<span class="detail-tag watch">missable: on watch</span>' : '',
    trophy.confirm === 'unconfirmed' ? '<span class="detail-tag warn">unconfirmed — flagged, not guessed</span>' : '',
    `<span class="detail-tag">${cited.length} source${cited.length === 1 ? '' : 's'} cited</span>`,
  ].join('');
  const steps = trophy.steps.map((step, i) => {
    const cites = step.c.map((id) => `<span class="cite-tag">${esc(id)}</span>`).join('');
    return `<li>${esc(step.t)}${cites}</li>`;
  }).join('');
  const stepper = trophy.count
    ? `<div class="detail-stepper"><span>Progress</span>${stepperHtml(trophy, store, 'detail-stepper-inner')}<span class="count-text">${store.countOf(trophy.id)} of ${trophy.count} — the trophy lands on the target</span></div>`
    : '';
  els.detail.innerHTML = `
    ${gradeChip(trophy)}
    <h2>${esc(trophy.name)}</h2>
    <p class="detail-desc">${esc(trophy.description)}</p>
    <div class="detail-tags">${tags}</div>
    <button type="button" class="earned-button${earned ? ' is-earned' : ''}" data-earned="${trophy.id}">${earned ? 'Earned ✓ (tap to undo)' : 'Mark as earned'}</button>
    ${stepper}
    <p class="guide-summary">${esc(trophy.guide)}</p>
    <div id="notes-per-trophy">
      <label for="trophy-notes-textarea">Your notes for this trophy</label>
      <textarea id="trophy-notes-textarea" data-notes="${trophy.id}" placeholder="Your own notes — saved in this browser, and carried by export/import.">${esc(store.noteOf(trophy.id))}</textarea>
    </div>
    <h3 class="steps-heading">How, step by step — every step cited</h3>
    <ol class="cited-steps">${steps}</ol>
    ${disputeHtml(trophy, data)}`;
}

// --- Save & settings helpers (shared with the header buttons) -----------
export function downloadProgressFile(store) {
  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-atlas-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}
export function readProgressFile(store, file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      store.importJson(String(reader.result));
      done(true);
    } catch {
      done(false);
    }
  };
  reader.readAsText(file);
}

export function initTracker(ctx) {
  const { els, store } = ctx;
  els.search.addEventListener('input', () => {
    ctx.ui.query = els.search.value;
    renderList(ctx);
  });
  els.gradeSelect.addEventListener('change', () => {
    ctx.ui.grade = els.gradeSelect.value;
    renderList(ctx);
  });
  els.hideEarned.addEventListener('change', () => {
    store.setSetting('hideEarned', els.hideEarned.checked);
    ctx.refresh();
  });
  els.chips.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-kind]');
    if (!chip) return;
    ctx.ui.kind = chip.dataset.kind;
    renderFilterChips(ctx);
    renderList(ctx);
  });
  els.list.addEventListener('click', (ev) => {
    const stepBtn = ev.target.closest('[data-step]');
    const row = ev.target.closest('[data-row]');
    if (!row) return;
    const trophy = ctx.data.trophiesById.get(Number(row.dataset.row));
    if (stepBtn) {
      ev.stopPropagation();
      store.setCount(trophy.id, store.countOf(trophy.id) + Number(stepBtn.dataset.step), trophy.count);
      ctx.refresh();
      return;
    }
    ctx.ui.selectedId = trophy.id;
    renderList(ctx);
    renderDetail(ctx);
  });
  els.detail.addEventListener('click', (ev) => {
    const stepBtn = ev.target.closest('[data-step]');
    if (stepBtn) {
      const wrap = ev.target.closest('[data-stepper]');
      const trophy = ctx.data.trophiesById.get(Number(wrap.dataset.stepper));
      store.setCount(trophy.id, store.countOf(trophy.id) + Number(stepBtn.dataset.step), trophy.count);
      ctx.refresh();
      return;
    }
    const earnBtn = ev.target.closest('[data-earned]');
    if (earnBtn) {
      store.toggleEarned(Number(earnBtn.dataset.earned));
      ctx.refresh();
    }
  });
  els.detail.addEventListener('input', (ev) => {
    const area = ev.target.closest('[data-notes]');
    if (area) store.setNote(Number(area.dataset.notes), area.value);
  });
  els.exportPanel.addEventListener('click', () => {
    downloadProgressFile(store);
    els.saveStatus.textContent = 'Progress exported — keep the file to restore or move your save.';
  });
  els.importPanel.addEventListener('change', () => {
    const file = els.importPanel.files[0];
    if (file) readProgressFile(store, file, (ok) => {
      els.saveStatus.textContent = ok ? 'Progress imported.' : 'That file is not an atlas save.';
      if (ok) ctx.refresh();
    });
  });
  els.resetPanel.addEventListener('click', () => {
    store.reset();
    els.saveStatus.textContent = 'Progress reset.';
    ctx.refresh();
  });
}

export function renderTracker(ctx) {
  ctx.els.hideEarned.checked = ctx.store.state.settings.hideEarned;
  renderFilterChips(ctx);
  renderList(ctx);
  renderDetail(ctx);
}
