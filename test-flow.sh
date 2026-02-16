#!/bin/bash

# Test script for Vent to Delete
# This script tests the core functionality

echo "🧪 Vent to Delete - Test Script"
echo "================================"
echo ""

# Check if Redis is running
echo "1️⃣ Checking Redis..."
if redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis is running"
else
  echo "❌ Redis is not running. Start it with:"
  echo "   brew services start redis  # macOS"
  echo "   sudo service redis-server start  # Linux"
  exit 1
fi

echo ""
echo "2️⃣ Starting server..."
npm start &
SERVER_PID=$!
echo "✅ Server started (PID: $SERVER_PID)"

# Wait for server to be ready
sleep 3

echo ""
echo "3️⃣ Testing thread creation..."
CREATED_THREAD=$(curl -s -X POST http://localhost:3000/api/thread \
  -H "Content-Type: application/json" \
  -d '{"timerHours":1}')

echo "Response: $CREATED_THREAD"

# Extract thread ID
THREAD_ID=$(echo $CREATED_THREAD | grep -o '"threadId":"[^"]*' | cut -d'"' -f4)

if [ -z "$THREAD_ID" ]; then
  echo "❌ Failed to create thread"
  kill $SERVER_PID
  exit 1
fi

echo "✅ Thread created: $THREAD_ID"

echo ""
echo "4️⃣ Verifying thread exists in Redis..."
THREAD_DATA=$(redis-cli GET "thread:$THREAD_ID")

if [ -z "$THREAD_DATA" ]; then
  echo "❌ Thread not found in Redis"
  kill $SERVER_PID
  exit 1
fi

echo "✅ Thread stored in Redis"
echo "Data: $THREAD_DATA"

echo ""
echo "5️⃣ Testing thread retrieval..."
RETRIEVED=$(curl -s http://localhost:3000/api/thread/$THREAD_ID)
echo "Response: $RETRIEVED"

if echo "$RETRIEVED" | grep -q '"success":true'; then
  echo "✅ Thread retrieved successfully"
else
  echo "❌ Failed to retrieve thread"
  kill $SERVER_PID
  exit 1
fi

echo ""
echo "6️⃣ Testing thread deletion..."
curl -s -X DELETE http://localhost:3000/api/thread/$THREAD_ID > /dev/null

sleep 1

DELETED_CHECK=$(redis-cli GET "thread:$THREAD_ID")

if [ -z "$DELETED_CHECK" ]; then
  echo "✅ Thread deleted from Redis"
else
  echo "❌ Thread still exists in Redis after deletion"
  kill $SERVER_PID
  exit 1
fi

echo ""
echo "7️⃣ Verifying deleted thread cannot be retrieved..."
RETRIEVED_AFTER_DELETE=$(curl -s http://localhost:3000/api/thread/$THREAD_ID)

if echo "$RETRIEVED_AFTER_DELETE" | grep -q '"success":false'; then
  echo "✅ Deleted thread returns 404"
else
  echo "❌ Deleted thread still accessible"
  kill $SERVER_PID
  exit 1
fi

echo ""
echo "8️⃣ Cleaning up..."
kill $SERVER_PID
echo "✅ Server stopped"

echo ""
echo "================================"
echo "✅ All tests passed!"
echo ""
echo "📋 Manual Testing Steps:"
echo "   1. Start server: npm start"
echo "   2. Open browser: http://localhost:3000"
echo "   3. Create a thread"
echo "   4. Copy invite link"
echo "   5. Open in incognito window (simulates second user)"
echo "   6. Send messages back and forth"
echo "   7. Verify read receipts appear"
echo "   8. Close both tabs and wait for timer (or check Redis)"
echo "   9. Verify thread disappears"
echo ""
