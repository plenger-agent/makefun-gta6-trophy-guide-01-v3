// Leonida Atlas — boot: load the data, build the store, wire the header
// (progress, spoiler switch, export/import), the tabs and the hash routes,
// and render. Every state change flows back through refresh().
import { loadAtlasData } from './data.js';
import { createProgressStore } from './store.js';
import { renderAuditStrip } from './audit.js';
import { overallProgress, renderNextUp } from './planner.js';
import {
  displayName, downloadProgressFile, initTracker, readProgressFile, renderTracker,
} from './tracker.js';
import { renderRoadmap } from './roadmap.js';
import { renderMissables } from './missables.js';
import { renderSources } from './sources.js';

const els = {
  progress: document.getElementById('progress-count-earned-of-55'),
  audit: document.getElementById('audit-strip-computed-from-data'),
  nextUp: document.getElementById('next-up-in-roadmap-order'),
  spoilers: document.getElementById('show-spoilers-checkbox'),
  spoilerState: document.getElementById('spoiler-state-label'),
  tabs: [...document.querySelectorAll('#view-tabs-tracker-roadmap-missables-sources .tab')],
  views: {
    tracker: document.getElementById('view-tracker'),
    roadmap: document.getElementById('view-roadmap'),
    missables: document.getElementById('view-missables'),
    sources: document.getElementById('view-sources'),
  },
  chips: document.getElementById('filters-with-counts'),
  list: document.getElementById('tracker-list-grouped-by-roadmap-stage'),
  detail: document.getElementById('trophy-detail-with-cited-steps'),
  search: document.getElementById('search-trophies-by-name'),
  hideEarned: document.getElementById('hide-earned-checkbox'),
  gradeSelect: document.getElementById('grade-filter-select'),
  exportPanel: document.getElementById('export-progress-button'),
  importPanel: document.getElementById('import-progress-input'),
  resetPanel: document.getElementById('reset-progress-button'),
  saveStatus: document.getElementById('save-status-line'),
  roadmap: document.getElementById('roadmap-stages-with-progress'),
  missables: document.getElementById('missables-levels-watch-and-disputes'),
  sources: document.getElementById('sources-dated-table-with-coverage'),
};

const store = createProgressStore();
const ui = { selectedId: 17, kind: 'all', grade: 'all', query: '', view: 'tracker' };
let data = null;

function applyHashRoute() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (params.has('view') && els.views[params.get('view')]) ui.view = params.get('view');
  if (params.has('t')) {
    const id = Number(params.get('t'));
    if (data.trophiesById.has(id)) ui.selectedId = id;
  }
}

function showView(view) {
  ui.view = view;
  for (const [key, section] of Object.entries(els.views)) section.hidden = key !== view;
  for (const tab of els.tabs) tab.classList.toggle('active', tab.dataset.view === view);
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  params.set('view', view);
  history.replaceState(null, '', `#${params.toString()}`);
}

function refresh() {
  const progress = overallProgress(data, store);
  els.progress.textContent = `${progress.earned} of ${progress.total} earned`;
  els.spoilers.checked = store.state.settings.showSpoilers;
  els.spoilerState.textContent = store.state.settings.showSpoilers
    ? 'Spoilers shown — hidden trophies revealed'
    : 'Hidden trophies covered until earned';
  renderAuditStrip(els.audit, data);
  renderNextUp(els.nextUp, data, store, (t) => displayName(t, store));
  if (ui.view === 'tracker') renderTracker(ctx);
  if (ui.view === 'roadmap') renderRoadmap(els.roadmap, data, store);
  if (ui.view === 'missables') renderMissables(els.missables, data, store);
  if (ui.view === 'sources') renderSources(els.sources, data);
}

const ctx = { data: null, store, ui, els, refresh };

async function boot() {
  data = await loadAtlasData();
  ctx.data = data;
  store.applyHashSeed(location.hash);
  applyHashRoute();
  initTracker(ctx);
  for (const tab of els.tabs) {
    tab.addEventListener('click', () => {
      showView(tab.dataset.view);
      refresh();
    });
  }
  els.spoilers.addEventListener('change', () => {
    store.setSetting('showSpoilers', els.spoilers.checked);
    refresh();
  });
  document.getElementById('export-progress-header-button').addEventListener('click', () => {
    downloadProgressFile(store);
  });
  document.getElementById('import-progress-header-input').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (file) readProgressFile(store, file, (ok) => { if (ok) refresh(); });
  });
  // Deep links are live routes: a pasted or edited hash re-stages the view,
  // the open trophy and any seeded progress it carries.
  window.addEventListener('hashchange', () => {
    store.applyHashSeed(location.hash);
    applyHashRoute();
    showView(ui.view);
    refresh();
  });
  showView(ui.view);
  refresh();
}

boot();
