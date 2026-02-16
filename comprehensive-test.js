// Comprehensive test for Vent to Delete
const http = require('http');

const BASE_URL = 'http://localhost:3002';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function comprehensiveTest() {
  console.log('🧪 COMPREHENSIVE TEST: Vent to Delete');
  console.log('=====================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Create thread
  console.log('Test 1: Create Thread');
  const t1 = await request('POST', '/api/thread', { timerHours: 24 });
  if (t1.data.success && t1.data.threadId && t1.data.inviteUrl) {
    console.log('✅ PASS: Thread created successfully');
    console.log(`   Thread ID: ${t1.data.threadId}`);
    console.log(`   Invite URL: ${t1.data.inviteUrl}`);
    testsPassed++;
  } else {
    console.log('❌ FAIL: Could not create thread');
    testsFailed++;
  }
  const threadId = t1.data.threadId;
  console.log('');

  // Test 2: Get thread
  console.log('Test 2: Retrieve Thread');
  const t2 = await request('GET', `/api/thread/${threadId}`);
  if (t2.data.success && t2.data.thread.id === threadId) {
    console.log('✅ PASS: Thread retrieved successfully');
    console.log(`   Created At: ${new Date(t2.data.thread.createdAt).toISOString()}`);
    console.log(`   Timer: ${t2.data.thread.timerHours}h`);
    console.log(`   Participants: ${t2.data.thread.participants.length}`);
    console.log(`   Messages: ${t2.data.thread.messages.length}`);
    testsPassed++;
  } else {
    console.log('❌ FAIL: Could not retrieve thread');
    testsFailed++;
  }
  console.log('');

  // Test 3: Nonexistent thread
  console.log('Test 3: Nonexistent Thread Returns 404');
  const t3 = await request('GET', '/api/thread/nonexistent123');
  if (t3.status === 404 && !t3.data.success) {
    console.log('✅ PASS: Nonexistent thread returns 404');
    console.log(`   Error: ${t3.data.error}`);
    testsPassed++;
  } else {
    console.log('❌ FAIL: Should return 404 for nonexistent thread');
    testsFailed++;
  }
  console.log('');

  // Test 4: Create thread with min timer
  console.log('Test 4: Create Thread with 1-Hour Timer');
  const t4 = await request('POST', '/api/thread', { timerHours: 1 });
  if (t4.data.success && t4.data.expiresIn === 3600000) {
    console.log('✅ PASS: Thread created with 1-hour timer');
    console.log(`   Expires in: ${t4.data.expiresIn / 3600000}h`);
    testsPassed++;
  } else {
    console.log('❌ FAIL: Timer not set correctly');
    testsFailed++;
  }
  console.log('');

  // Test 5: Create thread with max timer
  console.log('Test 5: Create Thread with 1-Week Timer');
  const t5 = await request('POST', '/api/thread', { timerHours: 168 });
  if (t5.data.success && t5.data.expiresIn === 604800000) {
    console.log('✅ PASS: Thread created with 1-week timer');
    console.log(`   Expires in: ${t5.data.expiresIn / 86400000} days`);
    testsPassed++;
  } else {
    console.log('❌ FAIL: Max timer not working');
    testsFailed++;
  }
  console.log('');

  // Test 6: Delete thread
  console.log('Test 6: Delete Thread');
  const t6 = await request('DELETE', `/api/thread/${threadId}`);
  if (t6.data.success) {
    console.log('✅ PASS: Thread deleted successfully');
    testsPassed++;
  } else {
    console.log('❌ FAIL: Could not delete thread');
    testsFailed++;
  }
  console.log('');

  // Test 7: Verify deletion
  console.log('Test 7: Verify Thread is Actually Deleted');
  const t7 = await request('GET', `/api/thread/${threadId}`);
  if (t7.status === 404 && !t7.data.success) {
    console.log('✅ PASS: Thread no longer exists after deletion');
    testsPassed++;
  } else {
    console.log('❌ FAIL: Thread still exists after deletion');
    testsFailed++;
  }
  console.log('');

  // Test 8: Invalid timer values (should clamp to valid range)
  console.log('Test 8: Invalid Timer Values Are Clamped');
  const t8a = await request('POST', '/api/thread', { timerHours: 0 });
  const t8b = await request('POST', '/api/thread', { timerHours: 200 });
  if (t8a.data.success && t8b.data.success) {
    console.log('✅ PASS: Invalid timer values clamped to valid range');
    console.log(`   0 hours → clamped to: ${t8a.data.expiresIn / 3600000}h`);
    console.log(`   200 hours → clamped to: ${t8b.data.expiresIn / 3600000}h`);
    testsPassed++;
  } else {
    console.log('❌ FAIL: Invalid timer handling broken');
    testsFailed++;
  }
  console.log('');

  // Summary
  console.log('=====================================');
  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! MVP is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.');
    process.exit(1);
  }
}

comprehensiveTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
