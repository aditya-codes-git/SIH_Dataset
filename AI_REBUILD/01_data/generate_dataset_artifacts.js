const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Read original train.csv
const originalCsvLines = fs.readFileSync('train.csv', 'utf8').trim().split(/\r?\n/).slice(1);
const diskFiles = fs.readdirSync('train_images').sort();

console.log('Original CSV lines:', originalCsvLines.length);
console.log('Disk files:', diskFiles.length);

// 2. Build corrected records
// Map each row in train.csv to its exact disk image
const records = [];
const correctedRows = [];

for (let i = 0; i < originalCsvLines.length; i++) {
  const parts = originalCsvLines[i].split(',');
  const originalId = parts[0].trim();
  const diagnosis = parseInt(parts[1].trim(), 10);
  const diskBase = diskFiles[i].replace('.png', '');
  const filepath = 'train_images/' + diskFiles[i];

  if (originalId !== diskBase) {
    correctedRows.push({
      line: i + 2,
      originalId,
      correctedId: diskBase,
      diagnosis,
      filepath
    });
  }

  // Compute image hash
  const buf = fs.readFileSync(filepath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');

  records.push({
    id_code: diskBase,
    original_id_code: originalId,
    diagnosis,
    filepath,
    hash
  });
}

console.log('Corrected rows count:', correctedRows.length);
console.log('Total records:', records.length);

// 3. Write train_corrected.csv
// Columns: id_code,diagnosis,filepath
let correctedCsvContent = 'id_code,diagnosis,filepath\n';
for (const r of records) {
  correctedCsvContent += `${r.id_code},${r.diagnosis},${r.filepath}\n`;
}
fs.writeFileSync('AI_REBUILD/01_data/train_corrected.csv', correctedCsvContent);
console.log('Written AI_REBUILD/01_data/train_corrected.csv');

// 4. Group by image hash to prevent duplicate leakage across splits
const hashGroups = new Map();
for (const r of records) {
  if (!hashGroups.has(r.hash)) {
    hashGroups.set(r.hash, []);
  }
  hashGroups.get(r.hash).push(r);
}
console.log('Unique image hashes (content groups):', hashGroups.size);

// For each hash group, determine representative diagnosis
const groups = [];
for (const [hash, groupRecords] of hashGroups.entries()) {
  // Use first record's diagnosis as representative
  groups.push({
    hash,
    diagnosis: groupRecords[0].diagnosis,
    records: groupRecords,
    count: groupRecords.length
  });
}

// Deterministic pseudorandom number generator (Mulberry32 with seed 42)
function mulberry32(a) {
  return function() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Stratified split by group diagnosis
const strata = { 0: [], 1: [], 2: [], 3: [], 4: [] };
for (const g of groups) {
  strata[g.diagnosis].push(g);
}

const splitAssignments = new Map(); // hash -> 'TRAIN' | 'CALIBRATION' | 'TEST'

for (let c = 0; c <= 4; c++) {
  const groupList = strata[c];
  shuffle(groupList);
  
  // Target 70% Train, 15% Cal, 15% Test based on total image counts in stratum
  const totalInStrata = groupList.reduce((sum, g) => sum + g.count, 0);
  const targetTrain = Math.round(totalInStrata * 0.70);
  const targetCal = Math.round(totalInStrata * 0.15);

  let currentTrain = 0;
  let currentCal = 0;

  for (const g of groupList) {
    if (currentTrain + g.count <= targetTrain || (currentCal >= targetCal && currentTrain < targetTrain)) {
      splitAssignments.set(g.hash, 'TRAIN');
      currentTrain += g.count;
    } else if (currentCal + g.count <= targetCal) {
      splitAssignments.set(g.hash, 'CALIBRATION');
      currentCal += g.count;
    } else {
      splitAssignments.set(g.hash, 'TEST');
    }
  }
}

// Assign split to each record
const splitCounts = { TRAIN: 0, CALIBRATION: 0, TEST: 0 };
const splitClassCounts = {
  TRAIN: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
  CALIBRATION: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
  TEST: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
};

for (const r of records) {
  const split = splitAssignments.get(r.hash);
  r.split = split;
  splitCounts[split]++;
  splitClassCounts[split][r.diagnosis]++;
}

console.log('\n--- SPLIT COUNTS ---');
console.log('TRAIN:      ', splitCounts.TRAIN, `(${(splitCounts.TRAIN / 3662 * 100).toFixed(2)}%)`);
console.log('CALIBRATION:', splitCounts.CALIBRATION, `(${(splitCounts.CALIBRATION / 3662 * 100).toFixed(2)}%)`);
console.log('TEST:       ', splitCounts.TEST, `(${(splitCounts.TEST / 3662 * 100).toFixed(2)}%)`);
console.log('TOTAL:      ', splitCounts.TRAIN + splitCounts.CALIBRATION + splitCounts.TEST);

console.log('\n--- CLASS COUNTS PER SPLIT ---');
console.log('TRAIN:      ', splitClassCounts.TRAIN);
console.log('CALIBRATION:', splitClassCounts.CALIBRATION);
console.log('TEST:       ', splitClassCounts.TEST);

// 5. Write dataset_splits.csv
// Columns: id_code,diagnosis,split
let splitsCsvContent = 'id_code,diagnosis,split\n';
for (const r of records) {
  splitsCsvContent += `${r.id_code},${r.diagnosis},${r.split}\n`;
}
fs.writeFileSync('AI_REBUILD/01_data/dataset_splits.csv', splitsCsvContent);
console.log('Written AI_REBUILD/01_data/dataset_splits.csv');

// 6. Write dataset_index.csv
// Columns: id_code,diagnosis,filepath
let indexCsvContent = 'id_code,diagnosis,filepath\n';
for (const r of records) {
  indexCsvContent += `${r.id_code},${r.diagnosis},${r.filepath}\n`;
}
fs.writeFileSync('AI_REBUILD/01_data/dataset_index.csv', indexCsvContent);
console.log('Written AI_REBUILD/01_data/dataset_index.csv');

// 7. Verify zero leakage between splits
const trainHashes = new Set(records.filter(r => r.split === 'TRAIN').map(r => r.hash));
const calHashes = new Set(records.filter(r => r.split === 'CALIBRATION').map(r => r.hash));
const testHashes = new Set(records.filter(r => r.split === 'TEST').map(r => r.hash));

const trainIds = new Set(records.filter(r => r.split === 'TRAIN').map(r => r.id_code));
const calIds = new Set(records.filter(r => r.split === 'CALIBRATION').map(r => r.id_code));
const testIds = new Set(records.filter(r => r.split === 'TEST').map(r => r.id_code));

let leak = false;
for (const h of trainHashes) {
  if (calHashes.has(h)) { console.error('LEAK: Hash in Train & Cal:', h); leak = true; }
  if (testHashes.has(h)) { console.error('LEAK: Hash in Train & Test:', h); leak = true; }
}
for (const h of calHashes) {
  if (testHashes.has(h)) { console.error('LEAK: Hash in Cal & Test:', h); leak = true; }
}
for (const id of trainIds) {
  if (calIds.has(id)) { console.error('LEAK: ID in Train & Cal:', id); leak = true; }
  if (testIds.has(id)) { console.error('LEAK: ID in Train & Test:', id); leak = true; }
}
for (const id of calIds) {
  if (testIds.has(id)) { console.error('LEAK: ID in Cal & Test:', id); leak = true; }
}

if (!leak) {
  console.log('\n[PASS] Programmatic zero-leakage verified across IDs and Image Hashes!');
} else {
  console.error('\n[FAIL] Leakage detected!');
  process.exit(1);
}
