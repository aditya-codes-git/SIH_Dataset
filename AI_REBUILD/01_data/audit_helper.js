const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const csvRaw = fs.readFileSync('train.csv', 'utf8').trim().split(/\r?\n/);
const header = csvRaw[0].split(',');
const rows = csvRaw.slice(1).map((line, idx) => {
  const parts = line.split(',');
  return { lineNum: idx + 2, id_code: parts[0].trim(), diagnosis: parseInt(parts[1].trim(), 10) };
});

const diskFiles = fs.readdirSync('train_images');
const diskFileMap = new Map();
diskFiles.forEach(f => {
  const base = path.basename(f, path.extname(f));
  diskFileMap.set(base, f);
});

console.log('Total CSV rows:', rows.length);
console.log('Total disk files:', diskFiles.length);

// Check label validity
const invalidLabels = rows.filter(r => isNaN(r.diagnosis) || r.diagnosis < 0 || r.diagnosis > 4);
console.log('Invalid labels count:', invalidLabels.length);

// Check duplicate IDs in CSV
const idCounts = new Map();
rows.forEach(r => idCounts.set(r.id_code, (idCounts.get(r.id_code) || 0) + 1));
const duplicateIds = [...idCounts.entries()].filter(([k, v]) => v > 1);
console.log('Duplicate IDs in CSV:', duplicateIds.length);

// Matches & Mismatches
const directMatches = rows.filter(r => diskFileMap.has(r.id_code));
const unmatchedCsvRows = rows.filter(r => !diskFileMap.has(r.id_code));
const matchedIds = new Set(directMatches.map(r => r.id_code));
const unmatchedDiskFiles = diskFiles
  .map(f => path.basename(f, path.extname(f)))
  .filter(b => !matchedIds.has(b));

console.log('Direct exact matches:', directMatches.length);
console.log('Unmatched CSV rows:', unmatchedCsvRows.length);
console.log('Unmatched Disk files:', unmatchedDiskFiles.length);

// Audit the 14 corrupted IDs
console.log('\n--- AUDITING 14 SCIENTIFIC NOTATION CORRUPTED ROWS ---');
unmatchedCsvRows.forEach((r, idx) => {
  const diskCandidate = unmatchedDiskFiles[idx];
  console.log('[' + (idx + 1) + '/14] Line: ' + r.lineNum + ' | CSV ID: \'' + r.id_code + '\' | Diagnosis: ' + r.diagnosis + ' | Disk file: \'' + diskCandidate + '.png\'');
});
