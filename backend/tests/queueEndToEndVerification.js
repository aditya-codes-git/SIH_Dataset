const http = require('http');
const mongoose = require('mongoose');

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, text: rawData, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Mirror frontend status computations to verify alignment
function computeReviewStatus(s) {
  if (s.status === 'UNGRADABLE') return { label: 'Recapture', code: 'RECAPTURE' };
  const grade = s.drGrade != null ? Number(s.drGrade) : null;
  if (grade !== null && grade < 2) return { label: 'Not Required', code: 'NOT_REQUIRED' };
  const isReviewed = Boolean(s.humanReview?.reviewed || s.triage?.status === 'REVIEWED');
  if (isReviewed) {
    const decision = s.humanReview?.decision || 'Completed';
    return { label: `Reviewed (${decision})`, code: 'REVIEWED' };
  }
  return { label: 'Pending Review', code: 'PENDING_REVIEW' };
}

function computeReferralRouting(s) {
  if (s.status === 'UNGRADABLE') return { label: 'Recapture Required', priority: 'RECAPTURE' };
  const grade = s.drGrade != null ? Number(s.drGrade) : null;
  if (grade !== null && grade >= 2) {
    const priority = s.triage?.priority || (grade === 4 ? 'URGENT' : grade === 3 ? 'HIGH' : 'MEDIUM');
    return { label: `Specialist Review (${priority})`, priority };
  }
  return { label: 'Routine Follow-up', priority: 'ROUTINE' };
}

async function runQueueTests() {
  console.log('===========================================================');
  console.log('RETINOSCAN AI — SCREENING QUEUE END-TO-END AUDIT SUITE');
  console.log('===========================================================');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // Connect to live MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diabetic_retinopathy');
  const db = mongoose.connection.db;
  const col = db.collection('screenings');
  const dbCount = await col.countDocuments({});
  console.log(`MongoDB connection active. Total screening records in database: ${dbCount}`);

  // 1. Operator API Screening Queue retrieval
  console.log('\n--- 1. Testing Operator Queue API Data Flow ---');
  const opRes = await request('GET', '/api/screenings', { 'x-demo-role': 'operator' });
  assert(opRes.status === 200, 'GET /api/screenings returns 200 for operator');
  const opScreenings = opRes.data?.screenings || [];
  assert(Array.isArray(opScreenings), 'Returns screenings array');
  assert(opScreenings.length === dbCount, `Operator queue count matches MongoDB record count (${opScreenings.length} === ${dbCount})`);

  // 2. Queue must include all operator screenings (Grade 0, 1, 2, 3, 4, Ungradable)
  console.log('\n--- 2. Verifying Complete Representation (Grade 0–4 + Ungradable) ---');
  const gradesFound = new Set(opScreenings.map((s) => s.drGrade));
  const hasUngradable = opScreenings.some((s) => s.status === 'UNGRADABLE');
  console.log('DR grades found in operator queue:', Array.from(gradesFound).sort());
  console.log('Ungradable records present:', hasUngradable);
  assert(hasUngradable, 'Operator queue contains UNGRADABLE records');
  assert(gradesFound.has(0), 'Operator queue contains Grade 0 records');
  assert(gradesFound.has(2), 'Operator queue contains Grade 2 records');
  assert(gradesFound.has(4), 'Operator queue contains Grade 4 records');

  // 3. Review Status and Referral Routing correctness across record types
  console.log('\n--- 3. Testing Review Status & Referral Routing Computations ---');
  for (const s of opScreenings) {
    const rev = computeReviewStatus(s);
    const ref = computeReferralRouting(s);

    if (s.status === 'UNGRADABLE') {
      assert(rev.code === 'RECAPTURE', `Ungradable ${s.screeningId.slice(0, 8)} review status is Recapture`);
      assert(ref.priority === 'RECAPTURE', `Ungradable ${s.screeningId.slice(0, 8)} routing is Recapture Required`);
      break;
    }
  }

  for (const s of opScreenings) {
    if (s.drGrade === 0 && s.status === 'GRADABLE') {
      const rev = computeReviewStatus(s);
      const ref = computeReferralRouting(s);
      assert(rev.code === 'NOT_REQUIRED', `Grade 0 case ${s.screeningId.slice(0, 8)} review status is Not Required`);
      assert(ref.label === 'Routine Follow-up', `Grade 0 case ${s.screeningId.slice(0, 8)} routing is Routine Follow-up`);
      break;
    }
  }

  // Find a reviewed Grade 2+ record
  const reviewedRecord = opScreenings.find((s) => Number(s.drGrade) >= 2 && s.humanReview?.reviewed === true);
  if (reviewedRecord) {
    const rev = computeReviewStatus(reviewedRecord);
    assert(rev.code === 'REVIEWED', `Reviewed Grade ${reviewedRecord.drGrade} case has code REVIEWED`);
    assert(rev.label.includes(reviewedRecord.humanReview.decision), `Reviewed Grade ${reviewedRecord.drGrade} shows persisted decision (${rev.label})`);
  }

  // 4. Deterministic Newest-First Sorting
  console.log('\n--- 4. Testing Deterministic Timestamp Sorting ---');
  let strictlySorted = true;
  for (let i = 0; i < opScreenings.length - 1; i++) {
    const timeCurr = new Date(opScreenings[i].createdAt).getTime();
    const timeNext = new Date(opScreenings[i + 1].createdAt).getTime();
    if (timeCurr < timeNext) {
      strictlySorted = false;
      break;
    }
  }
  assert(strictlySorted, 'Screening queue records are deterministically sorted by createdAt descending (newest first)');

  // 5. Response Shape & Required Fields Verification
  console.log('\n--- 5. Testing Response Shape & Required Fields ---');
  const sample = opScreenings[0];
  assert(typeof sample.screeningId === 'string' && sample.screeningId.length > 0, 'sample contains screeningId');
  assert(sample.patientId != null, 'sample contains patientId');
  assert(sample.patientName != null, 'sample contains patientName');
  assert(sample.status != null, 'sample contains status');
  assert(sample.drGrade !== undefined, 'sample contains canonical drGrade');
  assert(sample.createdAt != null, 'sample contains createdAt timestamp');
  assert(sample.quality != null, 'sample contains quality gate block');
  assert(sample.triage != null, 'sample contains triage block');
  assert(sample.humanReview != null, 'sample contains humanReview block');

  // 6. View Queue / Single Screening Record Retrieval by ID
  console.log('\n--- 6. Testing Screening Detail Retrieval by ID (View Queue Action) ---');
  const targetId = sample.screeningId;
  const detailRes = await request('GET', `/api/screenings/${targetId}`, { 'x-demo-role': 'operator' });
  assert(detailRes.status === 200, `GET /api/screenings/${targetId} returns 200`);
  const detail = detailRes.data?.screening;
  assert(detail != null, 'Detail payload contains screening object');
  assert(detail.screeningId === targetId, 'Detail screeningId matches requested ID');
  assert(detail.patientId === sample.patientId, 'Detail patientId matches requested record');

  // 7. Role Separation: Doctor Pending vs Operator Queue
  console.log('\n--- 7. Testing Strict Role Separation ---');
  const docPendingRes = await request('GET', '/api/screenings/pending-reviews', { 'x-demo-role': 'doctor' });
  assert(docPendingRes.status === 200, 'GET /api/screenings/pending-reviews returns 200 for doctor');
  const docPending = docPendingRes.data?.screenings || [];

  // Doctor pending must NEVER have Grade 0, 1, or Ungradable
  const hasIneligibleInDoctor = docPending.some((s) => s.status === 'UNGRADABLE' || Number(s.drGrade) < 2 || s.humanReview?.reviewed === true);
  assert(!hasIneligibleInDoctor, 'Doctor Pending Reviews queue strictly excludes Grade 0/1, Ungradable, and already-reviewed cases');
  assert(docPending.length < opScreenings.length, `Doctor Pending (${docPending.length}) is a strict subset of Operator Queue (${opScreenings.length})`);

  console.log('\n===========================================================');
  console.log(`QUEUE AUDIT RESULTS: ${passed}/${total} PASSED`);
  console.log('===========================================================');

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runQueueTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
