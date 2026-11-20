// The sources view: every source the guides cite, dated, with the coverage
// the data actually gives it — steps and trophies citing it, counted live.
export function renderSources(el, data) {
  const coverage = new Map(data.sources.map((s) => [s.id, { steps: 0, trophies: 0 }]));
  for (const trophy of data.trophies) {
    const perTrophy = new Set();
    for (const step of trophy.steps) {
      for (const id of step.c) {
        coverage.get(id).steps += 1;
        perTrophy.add(id);
      }
    }
    for (const id of perTrophy) coverage.get(id).trophies += 1;
  }
  const readDate = new Date(`${data.sourcesReadOn}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const rows = data.sources.map((s) => {
    const c = coverage.get(s.id);
    return `<tr><td><strong>${s.id}</strong></td><td>${s.name}</td><td>${s.what}
      <br><span class="source-url">${s.url}</span></td>
      <td>${readDate}</td><td>${c.steps} steps</td><td>${c.trophies} trophies</td></tr>`;
  }).join('');
  el.innerHTML = `<p class="roadmap-lede">Every numbered step in every guide carries the id of a
    source below, so any claim in this atlas can be traced to where it was read. Sources were read
    on ${readDate}. Where two sources disagree, the guide shows both versions; where none has
    confirmed a fact, the guide flags it unconfirmed.</p>
    <table class="sources-table"><thead><tr><th>Id</th><th>Source</th><th>What was read</th>
    <th>Read</th><th colspan="2">Coverage in this guide</th></tr></thead><tbody>${rows}</tbody></table>`;
}
