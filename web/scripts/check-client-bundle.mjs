// Fails when any paid text reaches the browser bundle (dist/client).
// Run after `pnpm build`. Checks every dataset text and every portrait chapter.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const SAMPLE_LENGTH = 40;

function files(directory) {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

const datasetTexts = ['showcase', 'abilities', 'ideal_job', 'life_path'].flatMap((name) =>
  Object.values(JSON.parse(readFileSync(path.join(root, 'data', `${name}.json`), 'utf8'))));
// Chapter bodies are the long single-quoted strings in portrait-chapters.ts.
const chapterTexts = [...readFileSync(path.join(root, 'lib', 'portrait-chapters.ts'), 'utf8').matchAll(/'([^'\n]{60,})'/g)].map((match) => match[1]);
const samples = [...datasetTexts, ...chapterTexts]
  .flatMap((text) => String(text).split(/\n\s*\n/))
  .map((part) => part.replace(/\s+/g, ' ').trim().slice(0, SAMPLE_LENGTH))
  .filter((part) => part.length === SAMPLE_LENGTH);

const bundle = files(path.join(root, 'dist', 'client'))
  .filter((file) => /\.(js|mjs|html|json|txt)$/.test(file))
  .map((file) => [file, readFileSync(file, 'utf8').replace(/\s+/g, ' ')]);
const leaks = samples.flatMap((sample) => bundle.filter(([, content]) => content.includes(sample)).map(([file]) => `${path.relative(root, file)}: ${sample}`));

if (bundle.length === 0) throw new Error('No client bundle found: run pnpm build first.');
if (chapterTexts.length < 30 || samples.length < 100) throw new Error(`Too few texts to check (${chapterTexts.length} chapters, ${samples.length} samples).`);
if (leaks.length) {
  console.error(`Paid text found in the client bundle:\n${leaks.slice(0, 20).join('\n')}`);
  process.exit(1);
}
console.log(`Client bundle clean: ${samples.length} texts checked across ${bundle.length} files.`);
