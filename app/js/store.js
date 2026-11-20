// The progress store: earned trophies, counters, per-trophy notes and settings,
// persisted to localStorage, with export/import and shareable hash seeds.
const STORAGE_KEY = 'leonida-atlas-progress-v1';

function emptyState() {
  return {
    earned: [],
    counts: {},
    notes: {},
    settings: { showSpoilers: false, hideEarned: false },
  };
}

export function createProgressStore() {
  let state = emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    state = emptyState();
  }

  const store = {
    get state() {
      return state;
    },
    isEarned(id) {
      return state.earned.includes(id);
    },
    toggleEarned(id) {
      state.earned = store.isEarned(id)
        ? state.earned.filter((x) => x !== id)
        : [...state.earned, id];
      store.save();
    },
    countOf(id) {
      return state.counts[id] || 0;
    },
    setCount(id, value, target) {
      const clamped = Math.max(0, target ? Math.min(value, target) : value);
      state.counts[id] = clamped;
      if (target && clamped >= target && !store.isEarned(id)) state.earned.push(id);
      store.save();
    },
    noteOf(id) {
      return state.notes[id] || '';
    },
    setNote(id, text) {
      if (text) state.notes[id] = text;
      else delete state.notes[id];
      store.save();
    },
    setSetting(key, value) {
      state.settings[key] = value;
      store.save();
    },
    reset() {
      state = emptyState();
      store.save();
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage full or unavailable: the session still works */
      }
    },
    exportJson() {
      return JSON.stringify({ app: 'leonida-atlas', version: 1, ...state }, null, 2);
    },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.earned)) throw new Error('not an atlas save');
      state = {
        earned: parsed.earned.filter((x) => Number.isInteger(x)),
        counts: parsed.counts || {},
        notes: parsed.notes || {},
        settings: { ...emptyState().settings, ...(parsed.settings || {}) },
      };
      store.save();
    },
    // A hash seed (#earned=3,4&counts=17:23&notes=17:text&spoilers=1) stages a
    // shared or screenshot view: it replaces the saved state for this load.
    applyHashSeed(hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      if (!params.has('earned') && !params.has('counts') && !params.has('spoilers')) return false;
      const seeded = emptyState();
      if (params.has('earned')) {
        seeded.earned = params.get('earned').split(',').map(Number).filter(Number.isInteger);
      }
      if (params.has('counts')) {
        for (const pair of params.get('counts').split(',')) {
          const [id, n] = pair.split(':');
          seeded.counts[Number(id)] = Number(n);
        }
      }
      if (params.has('notes')) {
        const [id, ...rest] = params.get('notes').split(':');
        seeded.notes[Number(id)] = rest.join(':');
      }
      if (params.has('spoilers')) seeded.settings.showSpoilers = params.get('spoilers') === '1';
      state = seeded;
      store.save();
      return true;
    },
  };
  return store;
}
