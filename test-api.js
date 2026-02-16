// Test script for Vent to Delete API
const http = require('http');

const BASE_URL = 'http://localhost:3001';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
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
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
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

async function runTests() {
  console.log('🧪 Testing Vent to Delete API\n');

  // Test 1: Create thread
  console.log('1️⃣ Creating thread...');
  const createResult = await request('POST', '/api/thread', { timerHours: 1 });
  if (createResult.success) {
    console.log(`✅ Thread created: ${createResult.threadId}`);
    console.log(`   Invite URL: ${createResult.inviteUrl}`);
    console.log(`   Expires in: ${createResult.expiresIn / 3600000}h\n`);
  } else {
    console.log('❌ Failed to create thread\n');
    return;
  }

  const threadId = createResult.threadId;

  // Test 2: Get thread
  console.log('2️⃣ Retrieving thread...');
  const getResult = await request('GET', `/api/thread/${threadId}`);
  if (getResult.success) {
    console.log('✅ Thread retrieved successfully');
    console.log(`   Participants: ${getResult.thread.participants.length}`);
    console.log(`   Messages: ${getResult.thread.messages.length}`);
    console.log(`   Time left: ${Math.floor(getResult.thread.timeLeft / 1000)}s\n`);
  } else {
    console.log('❌ Failed to retrieve thread\n');
    return;
  }

  // Test 3: Delete thread
  console.log('3️⃣ Deleting thread...');
  const deleteResult = await request('DELETE', `/api/thread/${threadId}`);
  if (deleteResult.success) {
    console.log('✅ Thread deleted\n');
  } else {
    console.log('❌ Failed to delete thread\n');
    return;
  }

  // Test 4: Verify deleted
  console.log('4️⃣ Verifying deletion...');
  const verifyResult = await request('GET', `/api/thread/${threadId}`);
  if (!verifyResult.success && verifyResult.error === 'Thread not found or expired') {
    console.log('✅ Thread properly deleted (404 returned)\n');
  } else {
    console.log('❌ Thread still accessible after deletion\n');
    return;
  }

  console.log('================================');
  console.log('✅ All API tests passed!\n');
  console.log('📋 Manual Testing:');
  console.log('   Open http://localhost:3001 in a browser');
  console.log('   Try creating a thread and testing the UI');
}

runTests().catch(console.error);
