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

async function runTests() {
  console.log('====================================================');
  console.log('RETINOSCAN AI — CLINICAL WORKFLOW HARDENING SUITE');
  console.log('====================================================');
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

  // 1. Authoritative Doctor Pending Reviews API
  console.log('\n--- 1. Testing Doctor Pending Reviews Eligibility ---');
  const doctorPendingRes = await request('GET', '/api/screenings/pending-reviews', {
    'x-demo-role': 'doctor',
  });
  assert(doctorPendingRes.status === 200, 'GET /api/screenings/pending-reviews returns 200 for doctor');
  const pendingList = doctorPendingRes.data?.screenings || doctorPendingRes.data?.data || [];
  assert(Array.isArray(pendingList), 'Returns screenings array');

  console.log(`Retrieved ${pendingList.length} pending review cases for doctor.`);

  // Verify eligibility rules on all returned cases
  let hasIneligible = false;
  for (const s of pendingList) {
    if (s.status !== 'GRADABLE' || Number(s.drGrade) < 2 || s.humanReview?.reviewed === true || s.triage?.status === 'REVIEWED') {
      hasIneligible = true;
      console.error('Violating record:', s.screeningId, s.status, s.drGrade, s.humanReview?.reviewed, s.triage?.status);
    }
  }
  assert(!hasIneligible, 'All records in Doctor Pending are GRADABLE, drGrade >= 2, and not reviewed');

  // 2. Operator Access Restriction
  console.log('\n--- 2. Testing Operator Role Restriction on Doctor Endpoint ---');
  const opPendingRes = await request('GET', '/api/screenings/pending-reviews', {
    'x-demo-role': 'operator',
  });
  assert(opPendingRes.status === 403, 'Operator cannot access Doctor Pending Reviews endpoint (403 Forbidden)');

  // 3. Connect to MongoDB to find test records across grades
  console.log('\n--- 3. Testing Grade 0, Grade 1, and Ungradable Ineligibility ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diabetic_retinopathy');
  const db = mongoose.connection.db;
  const screeningsCol = db.collection('screenings');

  const grade0Record = await screeningsCol.findOne({ drGrade: 0, status: 'GRADABLE' });
  const ungradableRecord = await screeningsCol.findOne({ status: 'UNGRADABLE' });
  const pendingGrade2Record = await screeningsCol.findOne({
    status: 'GRADABLE',
    drGrade: { $gte: 2 },
    'humanReview.reviewed': { $ne: true },
    'triage.status': { $nin: ['REVIEWED', 'COMPLETED'] },
  });

  if (grade0Record) {
    const revGrade0 = await request('POST', `/api/screenings/${grade0Record.screeningId}/review`, { 'x-demo-role': 'doctor' }, {
      reviewer: 'Dr. Test',
      agreement: 'AGREED',
      decision: 'AGREED',
      notes: 'Test note'
    });
    assert(revGrade0.status === 400 && revGrade0.data?.code === 'INELIGIBLE_GRADE', 'Submitting review on Grade 0 fails with 400 INELIGIBLE_GRADE');
  } else {
    console.log('[SKIP] No Grade 0 record found in DB for test');
  }

  if (ungradableRecord) {
    const revUngradable = await request('POST', `/api/screenings/${ungradableRecord.screeningId}/review`, { 'x-demo-role': 'doctor' }, {
      reviewer: 'Dr. Test',
      agreement: 'AGREED',
      decision: 'AGREED',
      notes: 'Test note'
    });
    assert(revUngradable.status === 400 && revUngradable.data?.code === 'INELIGIBLE_QUALITY', 'Submitting review on UNGRADABLE fails with 400 INELIGIBLE_QUALITY');
  } else {
    console.log('[SKIP] No UNGRADABLE record found in DB for test');
  }

  // 4. Missing required fields validation
  if (pendingGrade2Record) {
    const badReq = await request('POST', `/api/screenings/${pendingGrade2Record.screeningId}/review`, { 'x-demo-role': 'doctor' }, {
      notes: 'Missing required fields'
    });
    assert(badReq.status === 400 && badReq.data?.code === 'VALIDATION_FAILED', 'Submitting review with missing required fields fails with 400 VALIDATION_FAILED');
  }

  // 5. Successful Review Submission & AI Immutability Verification
  console.log('\n--- 4. Testing Atomic Review Submission & AI Immutability ---');
  if (pendingGrade2Record) {
    const targetId = pendingGrade2Record.screeningId;
    const initialAiGrade = pendingGrade2Record.drGrade;
    const initialAiConfidence = pendingGrade2Record.confidence;
    const initialAiQuality = pendingGrade2Record.quality;
    const initialAiStatus = pendingGrade2Record.status;

    console.log(`Testing review on Grade ${initialAiGrade} case: ${targetId}`);

    const reviewPayload = {
      reviewer: 'Dr. Antigravity Verification',
      agreement: 'AGREED',
      decision: 'AGREED',
      clinicalFindings: 'Verified moderate microaneurysms consistent with Grade 2',
      recommendations: 'Follow-up screening in 6 months',
      notes: 'Harden test suite automated review'
    };

    const submitRes = await request('POST', `/api/screenings/${targetId}/review`, { 'x-demo-role': 'doctor' }, reviewPayload);
    assert(submitRes.status === 200, `Review submission returns 200 OK (${submitRes.status})`);

    // Fetch directly from DB to verify persistence and immutability
    const updatedRecord = await screeningsCol.findOne({ screeningId: targetId });
    assert(updatedRecord.humanReview?.reviewed === true, 'Database: humanReview.reviewed is true');
    assert(updatedRecord.humanReview?.reviewer === 'Dr. Antigravity Verification', 'Database: humanReview.reviewer persisted correctly');
    assert(updatedRecord.humanReview?.decision === 'AGREED', 'Database: humanReview.decision persisted');
    assert(updatedRecord.triage?.status === 'REVIEWED', 'Database: triage.status updated to REVIEWED');
    assert(updatedRecord.humanReview?.clinicalFindings === 'Verified moderate microaneurysms consistent with Grade 2', 'Database: humanReview.clinicalFindings persisted');

    // IMMUTABILITY ASSERTIONS
    assert(updatedRecord.drGrade === initialAiGrade, `Database: Original AI drGrade is immutable (${updatedRecord.drGrade} === ${initialAiGrade})`);
    assert(updatedRecord.confidence === initialAiConfidence, `Database: Original AI confidence is immutable (${updatedRecord.confidence} === ${initialAiConfidence})`);
    assert(JSON.stringify(updatedRecord.quality) === JSON.stringify(initialAiQuality), `Database: Original AI quality is immutable`);
    assert(updatedRecord.status === initialAiStatus, `Database: Original AI status is immutable (${updatedRecord.status} === ${initialAiStatus})`);

    // 6. Idempotent Retry & Duplicate / Race Conflict Protection
    console.log('\n--- 5. Testing Concurrency & Duplicate Safety ---');
    // Identical resubmission (safe retry)
    const retryRes = await request('POST', `/api/screenings/${targetId}/review`, { 'x-demo-role': 'doctor' }, reviewPayload);
    assert(retryRes.status === 200 && retryRes.data?.duplicateRetry === true, 'Identical duplicate review submission returns safe 200 OK with duplicateRetry: true');

    // Conflicting resubmission (different reviewer/decision)
    const conflictRes = await request('POST', `/api/screenings/${targetId}/review`, { 'x-demo-role': 'doctor' }, {
      reviewer: 'Dr. SecondDoctor',
      agreement: 'OVERRIDDEN',
      decision: 'OVERRIDDEN',
      notes: 'Conflicting concurrent review'
    });
    assert(conflictRes.status === 409 && conflictRes.data?.code === 'ALREADY_REVIEWED', 'Conflicting second review submission is rejected with 409 Conflict');

    // 7. Doctor Pending Reviews Queue Excludes Newly Reviewed Record
    console.log('\n--- 6. Testing Exclusion from Doctor Pending Queue ---');
    const doctorPendingAfter = await request('GET', '/api/screenings/pending-reviews', { 'x-demo-role': 'doctor' });
    const pendingListAfter = doctorPendingAfter.data?.screenings || doctorPendingAfter.data?.data || [];
    const inPending = pendingListAfter.some((s) => s.screeningId === targetId);
    assert(!inPending, `Reviewed case ${targetId} is immediately excluded from Doctor Pending Reviews`);

    // 8. Operator Visibility of Persisted Review State
    console.log('\n--- 7. Testing Operator Visibility of Persisted Review ---');
    const operatorScreenings = await request('GET', '/api/screenings', { 'x-demo-role': 'operator' });
    const opList = operatorScreenings.data?.screenings || operatorScreenings.data?.data || [];
    const opRecord = opList.find((s) => s.screeningId === targetId);
    assert(opRecord != null, `Case ${targetId} is present in Operator Station screening list`);
    assert(opRecord?.humanReview?.reviewed === true, 'Operator payload includes humanReview.reviewed: true');
    assert(opRecord?.humanReview?.reviewer === 'Dr. Antigravity Verification', 'Operator payload includes humanReview.reviewer');
    assert(opRecord?.triage?.status === 'REVIEWED', 'Operator payload includes triage.status: REVIEWED');
  }

  console.log('\n====================================================');
  console.log(`TEST SUITE RESULTS: ${passed}/${total} PASSED`);
  console.log('====================================================');
  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
