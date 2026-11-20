// Leonida Atlas — the hand-in program for the gta6-trophy-guide-01 entry.
//
// The guide itself is the static app under app/ (plain files, no build step,
// nothing fetched at run time). This program copies app/ and screenshots/
// into the output directory and writes dossier.json there with the kit's
// vendored buildDossier, byte for byte as the scorer rebuilds it.
// Node 22, standard library only. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, mirrored so an over-limit entry fails here first.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
} else {
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, DOSSIER_OPTIONS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A one-line receipt for whoever runs this by hand; the grader ignores stdout.
console.log(`leonida-atlas: app/ and screenshots/ copied, dossier.json written (${dossier.length} bytes) to ${outputDir}`);
