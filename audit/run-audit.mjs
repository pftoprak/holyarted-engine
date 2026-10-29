// Report audit: runs the real calculation for every synthetic persona, prints
// the exact texts they would receive and scans the datasets for content risks.
// Read-only over data/: nothing in the datasets is changed.
//
//   node audit/run-audit.mjs
//
// Writes audit/output/persona-outputs.md and audit/output/scan.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { calculateCoreProfile } from '../web/lib/calculation-core.ts';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const { referenceDate, personas } = read('audit/personas.json');

const sections = [
  { id: 'showcase', file: 'showcase', label: 'Vitrin', key: 'doğum günü' },
  { id: 'abilities', file: 'abilities', label: 'Yetenekler', key: 'sesli harf toplamı' },
  { id: 'idealJob', file: 'ideal_job', label: 'İdeal iş', key: 'isim toplamı' },
  { id: 'lifePath', file: 'life_path', label: 'Hayat yolu', key: 'tarih toplamı' },
];
const data = Object.fromEntries(sections.map((s) => [s.id, read(`data/${s.file}.json`)]));

const PLACEHOLDER = /^(n\/?a|-|tbd|todo|\s*)$/i;
const patterns = {
  hedge: /\b(bazen|zaman zaman|kimi zaman|ara sıra|çoğu zaman|genellikle|bazı durumlarda|bazı insanlar)\b/giu,
  universal: /\b(herkes gibi|her insan|çoğu insan|birçok insan|insanların çoğu)\b/giu,
  gendered: /\b(kadın|erkek|bayan|hanım|beyefendi|hanımefendi|anne|baba|annelik|babalık|kocan|karın|kız arkadaş|erkek arkadaş|delikanlı)\w*/giu,
  heteronormative: /\b(evlilik|evlili|eşin|eşinle|eşine|eşinin|karşı cins)\w*/giu,
  lifeStage: /\b(emekli|torun|çocukların|çocuklarına|yaşlılık|orta yaş|gençliğin|okul yılların|kariyerinin sonu)\w*/giu,
  relational: /\b(ilişki|partner|sevgili|aşk|eş\b|eşin|yakınlık|bağlanma|çatışma|sınır|güven|duygusal|iletişim|aile)\w*/giu,
};

function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 25);
}
function words(text) {
  return text.toLocaleLowerCase('tr').match(/\p{L}+/gu) ?? [];
}
function matches(text, regex) {
  return [...text.matchAll(regex)].map((m) => m[0].toLocaleLowerCase('tr'));
}
function ageOn(birthDate) {
  const [y, m, d] = birthDate.split('-').map(Number);
  const [ry, rm, rd] = referenceDate.split('-').map(Number);
  return ry - y - (rm < m || (rm === m && rd < d) ? 1 : 0);
}

// 1. Persona outputs
const results = personas.map((persona) => {
  const core = calculateCoreProfile(persona.firstName, persona.lastName, persona.birthDate);
  const out = sections.map((s) => {
    const key = core.contentKeys[s.id];
    const text = data[s.id][key];
    const problem = text === undefined ? 'METİN YOK (anahtar veride bulunmuyor)' : PLACEHOLDER.test(text.trim()) ? `YER TUTUCU METİN: "${text}"` : null;
    return { ...s, key, text: text ?? '', problem };
  });
  return { persona, age: ageOn(persona.birthDate), core, out };
});

// 2. Dataset scans (every text, not only the ones personas hit)
const scan = { generatedFor: referenceDate, datasets: {} };
const sentenceOwners = new Map();
for (const s of sections) {
  const entries = Object.entries(data[s.id]);
  const perKey = {};
  for (const [key, text] of entries) {
    const w = words(text);
    const per1000 = (n) => Math.round((n / Math.max(w.length, 1)) * 10000) / 10;
    const found = Object.fromEntries(Object.entries(patterns).map(([name, regex]) => [name, matches(text, regex)]));
    perKey[key] = {
      words: w.length,
      placeholder: PLACEHOLDER.test(text.trim()),
      hedgePer1000: per1000(found.hedge.length),
      relationalPer1000: per1000(found.relational.length),
      gendered: [...new Set(found.gendered)],
      heteronormative: [...new Set(found.heteronormative)],
      lifeStage: [...new Set(found.lifeStage)],
      universal: [...new Set(found.universal)],
      formatting: [/\n \n/.test(text) && 'boşluklu satır sonu', / {2,}/.test(text) && 'çift boşluk', !/[.!?…)"]\s*$/.test(text.trim()) && 'noktalama olmadan bitiyor'].filter(Boolean),
    };
    for (const sentence of sentences(text)) {
      const owners = sentenceOwners.get(sentence) ?? [];
      owners.push(`${s.file}:${key}`);
      sentenceOwners.set(sentence, owners);
    }
  }
  // Interchangeability: word-set overlap between texts of the same dataset.
  const sets = entries.map(([key, text]) => [key, new Set(words(text).filter((x) => x.length > 4))]);
  const similar = [];
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const [a, A] = sets[i];
    const [b, B] = sets[j];
    const shared = [...A].filter((x) => B.has(x)).length;
    const jaccard = shared / (A.size + B.size - shared || 1);
    if (jaccard >= 0.2) similar.push({ a, b, jaccard: Math.round(jaccard * 100) / 100 });
  }
  scan.datasets[s.file] = { keys: entries.length, perKey, similarPairs: similar.sort((x, y) => y.jaccard - x.jaccard) };
}
scan.repeatedSentences = [...sentenceOwners].filter(([, owners]) => owners.length > 1).map(([sentence, owners]) => ({ sentence, owners }));
scan.coverage = Object.fromEntries(sections.map((s) => [s.file, {
  hit: [...new Set(results.map((r) => r.out.find((o) => o.id === s.id).key))].sort(),
  notHit: Object.keys(data[s.id]).filter((k) => !results.some((r) => r.out.find((o) => o.id === s.id).key === k)),
}]));
scan.unusedDatasets = ['piramit_c1-9', 'synergy_c1-9'];
scan.genderTwins = [];
for (let i = 0; i < results.length; i++) for (let j = i + 1; j < results.length; j++) {
  const a = results[i], b = results[j];
  if (a.persona.gender !== b.persona.gender && a.out.every((o, k) => o.text === b.out[k].text)) scan.genderTwins.push([a.persona.id, b.persona.id]);
}

// 3. Write outputs
const md = [`# Kişi çıktıları — ${referenceDate}`, '', 'Her kişi için gerçek hesaplama (`web/lib/calculation-core.ts`) ve veride seçilen metin. Metinler `data/` dosyalarından değiştirilmeden alınmıştır.', ''];
md.push('| ID | Yaş | Cinsiyet | Ad Soyad | Doğum | Vitrin | Yetenek | İdeal iş | Hayat yolu | Sorun |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of results) {
  const p = r.persona;
  md.push(`| ${p.id} | ${r.age} | ${p.gender} | ${p.firstName} ${p.lastName} | ${p.birthDate} | ${r.out.map((o) => o.key).join(' | ')} | ${r.out.filter((o) => o.problem).map((o) => `${o.label}: ${o.problem}`).join('; ') || '—'} |`);
}
for (const r of results) {
  const p = r.persona;
  md.push('', `## ${p.id} — ${p.firstName} ${p.lastName}`, '', `- Yaş ${r.age}, ${p.gender}; ${p.relationship}; ${p.life}`, `- Test odağı: ${p.tests.join(', ')}`, `- Sinyaller: ${Object.entries(r.core.signals).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  for (const o of r.out) {
    md.push('', `### ${o.label} — anahtar ${o.key} (${o.key === undefined ? '' : o.label === 'Hayat yolu' ? 'tarih toplamı' : sections.find((s) => s.id === o.id).key})`);
    md.push('', o.problem ? `> **${o.problem}**` : o.text.trim().replace(/\n\s*\n\s*/g, '\n\n'));
  }
}
mkdirSync(new URL('audit/output/', root), { recursive: true });
writeFileSync(new URL('audit/output/persona-outputs.md', root), md.join('\n') + '\n');
writeFileSync(new URL('audit/output/scan.json', root), JSON.stringify(scan, null, 2) + '\n');

// 4. Console summary
const outOfRange = results.filter((r) => r.age < 18 || r.age > 40).map((r) => r.persona.id);
console.log(`personas=${results.length} ages=${Math.min(...results.map((r) => r.age))}-${Math.max(...results.map((r) => r.age))} outOfRange=${outOfRange.join(',') || 'none'}`);
for (const r of results) for (const o of r.out) if (o.problem) console.log(`PROBLEM ${r.persona.id} ${o.label} key=${o.key}: ${o.problem}`);
for (const [file, c] of Object.entries(scan.coverage)) console.log(`coverage ${file}: hit ${c.hit.length}, notHit ${c.notHit.join(',') || '-'}`);
console.log(`genderTwins (same text, different gender): ${scan.genderTwins.map((t) => t.join('=')).join(', ')}`);
console.log(`repeatedSentences: ${scan.repeatedSentences.length}`);
