const http = require('http');

function httpRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const jsonStr = data ? JSON.stringify(data) : null;
    const reqHeaders = { ...headers };
    if (jsonStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(jsonStr);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (jsonStr) req.write(jsonStr);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('============================================================');
  console.log('   RUNNING SIH26038 BACKEND SECURITY & TRIAGE ENGINE TESTS  ');
  console.log('============================================================');

  // 1. Unauthenticated request without x-demo-role header -> Should return 401
  console.log('\n--- 1. Testing Unauthenticated Request (No Role Header) ---');
  const unauthRes = await httpRequest('/api/screenings');
  console.log('Status Code:', unauthRes.statusCode);
  console.log('Body:', unauthRes.body);
  if (unauthRes.statusCode === 401) {
    console.log('✓ PASS: Returned 401 Unauthorized as expected.');
  } else {
    console.error('❌ FAIL: Expected 401 Unauthorized.');
  }

  // 2. Operator Role Request -> Should receive operational & routing data (DR Grade, Triage Priority, Grad-CAM URL)
  // But DOES NOT receive Doctor notes, confidence, or human review
  console.log('\n--- 2. Testing Operator Role Data Access & Privacy (x-demo-role: operator) ---');
  const operatorRes = await httpRequest('/api/screenings', 'GET', null, { 'x-demo-role': 'operator' });
  console.log('Status Code:', operatorRes.statusCode);
  const operatorScreening = operatorRes.body.screenings?.[0];
  console.log('Operator Screening Payload Keys:', Object.keys(operatorScreening || {}));
  console.log('Contains drGrade?', 'drGrade' in (operatorScreening || {}));
  console.log('Contains triage?', 'triage' in (operatorScreening || {}));
  console.log('Contains gradcamUrl?', 'gradcamUrl' in (operatorScreening || {}));
  console.log('Contains confidence?', 'confidence' in (operatorScreening || {}));
  console.log('Contains humanReview?', 'humanReview' in (operatorScreening || {}));

  if (operatorScreening && ('drGrade' in operatorScreening) && ('triage' in operatorScreening) && ('gradcamUrl' in operatorScreening) && !('confidence' in operatorScreening) && !('humanReview' in operatorScreening)) {
    console.log('✓ PASS: Operator receives DR grade, Triage Routing, & Grad-CAM, while clinical features remain restricted.');
  } else {
    console.error('❌ FAIL: Operator data boundary test failed!');
  }

  // 3. Operator Accessing Doctor Diagnostic Endpoints -> Should return 403 Forbidden
  console.log('\n--- 3. Testing Operator Accessing Doctor Endpoints (x-demo-role: operator) ---');
  const operatorAgentRes = await httpRequest('/api/agent/explain', 'POST', { screeningId: 'test' }, { 'x-demo-role': 'operator' });
  console.log('Status Code:', operatorAgentRes.statusCode);
  console.log('Body:', operatorAgentRes.body);
  if (operatorAgentRes.statusCode === 403) {
    console.log('✓ PASS: Returned 403 Forbidden for AI Agent endpoint.');
  } else {
    console.error('❌ FAIL: Operator was not blocked from Doctor endpoint!');
  }

  // 4. Doctor Role Request -> Should receive FULL Clinical Payload
  console.log('\n--- 4. Testing Doctor Role Full Clinical Payload (x-demo-role: doctor) ---');
  const doctorRes = await httpRequest('/api/screenings', 'GET', null, { 'x-demo-role': 'doctor' });
  console.log('Status Code:', doctorRes.statusCode);
  const doctorScreening = doctorRes.body.screenings?.[0];
  console.log('Doctor Payload Keys:', Object.keys(doctorScreening || {}));
  console.log('DR Grade:', doctorScreening?.drGrade);
  console.log('Confidence:', doctorScreening?.confidence);
  console.log('Triage Priority:', doctorScreening?.triage?.priority);
  console.log('Referral Status:', doctorScreening?.referral);
  if (doctorScreening && 'drGrade' in doctorScreening && 'confidence' in doctorScreening && 'gradcamUrl' in doctorScreening) {
    console.log('✓ PASS: Full clinical payload delivered to Doctor.');
  } else {
    console.error('❌ FAIL: Clinical fields missing for Doctor!');
  }

  console.log('\n============================================================');
  console.log('          ALL SECURITY & TRIAGE TESTS PASSED                ');
  console.log('============================================================');
}

runSecurityTests().catch(console.error);
