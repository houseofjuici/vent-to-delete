# Vent to Delete - API Documentation

**Version:** 1.0.0
**Base URL:** `https://your-domain.com`
**WebSocket:** Socket.IO client
**Authentication:** None required (ephemeral threads)

---

## Overview

Vent to Delete provides ephemeral encrypted chat threads that auto-delete after both parties read all messages. The API uses REST for thread management and WebSocket (Socket.IO) for real-time messaging.

**Key Features:**
- Client-side encryption (messages encrypted before sending)
- Auto-delete when all messages are read by all participants
- Configurable timer (1-168 hours)
- No logs, no screenshots, no persistent storage

---

## REST Endpoints

### 1. Create Thread

Create a new ephemeral chat thread.

**Endpoint:** `POST /api/thread`

**Request Body:**
```json
{
  "timerHours": "integer (optional, default: 24, range: 1-168) - Hours until auto-delete"
}
```

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/thread \
  -H "Content-Type: application/json" \
  -d '{"timerHours": 24}'
```

**Response (200 OK):**
```json
{
  "success": true,
  "threadId": "a1b2c3d4e5f6...",
  "inviteUrl": "https://your-domain.com/thread/a1b2c3d4e5f6...",
  "expiresIn": 86400000
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to create thread"
}
```

---

### 2. Get Thread Data

Retrieve current thread state.

**Endpoint:** `GET /api/thread/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Thread ID |

**Example Request:**
```bash
curl https://your-domain.com/api/thread/a1b2c3d4e5f6...
```

**Response (200 OK):**
```json
{
  "success": true,
  "thread": {
    "id": "a1b2c3d4e5f6...",
    "createdAt": 1739704800000,
    "timerHours": 24,
    "participants": ["user1", "user2"],
    "messages": [
      {
        "id": "msg123",
        "content": "encrypted_content_here",
        "senderId": "user1",
        "timestamp": 1739704900000,
        "readBy": ["user1"]
      }
    ],
    "readBy": [],
    "timeLeft": 86340000
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Thread not found or expired"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to get thread"
}
```

---

### 3. Delete Thread

Manually delete a thread before timer expires.

**Endpoint:** `DELETE /api/thread/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Thread ID |

**Example Request:**
```bash
curl -X DELETE https://your-domain.com/api/thread/a1b2c3d4e5f6...
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to delete thread"
}
```

---

## WebSocket Events

All real-time communication uses Socket.IO. Connect to the server and emit events.

### Connection

```javascript
const socket = io('https://your-domain.com');
```

---

### Emit Events

#### `join-thread`

Join a thread to receive real-time updates.

**Event Data:**
```json
{
  "threadId": "string (required) - Thread ID to join"
}
```

**Example:**
```javascript
socket.emit('join-thread', { threadId: 'a1b2c3d4e5f6...' });
```

---

#### `send-message`

Send an encrypted message to the thread.

**Event Data:**
```json
{
  "threadId": "string (required) - Thread ID",
  "message": "string (required) - Encrypted message content",
  "senderId": "string (required) - Sender identifier"
}
```

**Example:**
```javascript
const encrypted = encryptMessage("Hey, are you free tonight?", key);
socket.emit('send-message', {
  threadId: 'a1b2c3d4e5f6...',
  message: encrypted,
  senderId: 'user1'
});
```

---

#### `mark-read`

Mark a message as read by a user.

**Event Data:**
```json
{
  "threadId": "string (required) - Thread ID",
  "userId": "string (required) - User ID marking as read",
  "messageId": "string (required) - Message ID to mark as read"
}
```

**Example:**
```javascript
socket.emit('mark-read', {
  threadId: 'a1b2c3d4e5f6...',
  userId: 'user1',
  messageId: 'msg123'
});
```

---

#### `register-participant`

Register a user as a thread participant.

**Event Data:**
```json
{
  "threadId": "string (required) - Thread ID",
  "userId": "string (required) - User ID to register"
}
```

**Example:**
```javascript
socket.emit('register-participant', {
  threadId: 'a1b2c3d4e5f6...',
  userId: 'user1'
});
```

---

#### `user-typing`

Broadcast typing indicator to other participants.

**Event Data:**
```json
{
  "threadId": "string (required) - Thread ID",
  "userId": "string (required) - User ID who is typing"
}
```

**Example:**
```javascript
socket.emit('user-typing', {
  threadId: 'a1b2c3d4e5f6...',
  userId: 'user1'
});
```

---

### Listen Events

#### `new-message`

Received when a new message is sent in the thread.

**Event Data:**
```json
{
  "id": "string - Message ID",
  "content": "string - Encrypted message content",
  "senderId": "string - Sender ID",
  "timestamp": "number - Unix timestamp (ms)",
  "readBy": "array - User IDs who have read this message"
}
```

**Example:**
```javascript
socket.on('new-message', (message) => {
  const decrypted = decryptMessage(message.content, key);
  console.log(`New message: ${decrypted}`);
});
```

---

#### `message-read`

Received when a message is marked as read.

**Event Data:**
```json
{
  "messageId": "string - Message ID",
  "userId": "string - User who marked as read"
}
```

**Example:**
```javascript
socket.on('message-read', ({ messageId, userId }) => {
  console.log(`Message ${messageId} read by ${userId}`);
});
```

---

#### `thread-update`

Received when thread state changes (new participant, new message, etc.).

**Event Data:**
```json
{
  "id": "string - Thread ID",
  "createdAt": "number - Creation timestamp",
  "timerHours": "number - Timer duration in hours",
  "participants": "array - Participant user IDs",
  "messages": "array - All messages in thread",
  "readBy": "array - Read tracking",
  "timeLeft": "number - Milliseconds until auto-delete"
}
```

**Example:**
```javascript
socket.on('thread-update', (thread) => {
  console.log(`Thread updated, ${thread.participants.length} participants`);
});
```

---

#### `thread-deleted`

Received when thread is auto-deleted (all messages read) or timer expires.

**Event Data:**
```json
{
  "reason": "string - 'all-read' or 'timer-expired'"
}
```

**Example:**
```javascript
socket.on('thread-deleted', ({ reason }) => {
  console.log(`Thread deleted: ${reason}`);
  // Redirect to home or show notification
});
```

---

#### `user-typing`

Received when another user is typing.

**Event Data:**
```json
{
  "userId": "string - User ID who is typing"
}
```

**Example:**
```javascript
socket.on('user-typing', ({ userId }) => {
  showTypingIndicator(userId);
});
```

---

#### `error`

Received when an error occurs.

**Event Data:**
```json
{
  "message": "string - Error message"
}
```

**Example:**
```javascript
socket.on('error', ({ message }) => {
  console.error(`Socket error: ${message}`);
});
```

---

## Data Models

### Thread Object

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique thread ID (hex) |
| `createdAt` | number | Unix timestamp (ms) |
| `timerHours` | number | Hours until auto-delete |
| `participants` | string[] | Array of user IDs |
| `messages` | Message[] | Array of messages |
| `readBy` | string[] | Read tracking (deprecated) |
| `timeLeft` | number | Milliseconds until expiry |

### Message Object

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique message ID (hex) |
| `content` | string | Encrypted message content |
| `senderId` | string | Sender user ID |
| `timestamp` | number | Unix timestamp (ms) |
| `readBy` | string[] | User IDs who have read this message |

---

## Encryption

Messages are encrypted on the client side before sending. The server never sees plaintext.

**Encryption (Client):**
```javascript
import CryptoJS from 'crypto-js';

function encryptMessage(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decryptMessage(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Example Usage:**
```javascript
const key = 'shared-secret-key'; // In production, use ECDH key exchange
const encrypted = encryptMessage("Hey!", key);
socket.emit('send-message', {
  threadId: '...',
  message: encrypted,
  senderId: 'user1'
});
```

---

## Auto-Delete Logic

Threads auto-delete when:
1. **All messages read**: All participants have marked all messages as read
2. **Timer expires**: Configurable timer (1-168 hours) elapses

When a thread is deleted, all participants receive `thread-deleted` event and the thread is immediately removed from storage.

---

## Rate Limiting

No rate limiting is currently implemented. Please use responsibly.

---

## Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| 404 | Not Found | Thread not found or expired |
| 500 | Internal Server Error | Server error occurred |

---

## Integration Example

### Full Chat Implementation

```javascript
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';

const socket = io('https://your-domain.com');
const key = 'shared-secret-key'; // Use proper key exchange in production

// Join thread
function joinThread(threadId) {
  socket.emit('join-thread', { threadId });
  
  socket.on('new-message', (message) => {
    const decrypted = decryptMessage(message.content, key);
    displayMessage(message.senderId, decrypted, message.timestamp);
  });
  
  socket.on('message-read', ({ messageId, userId }) => {
    markMessageAsRead(messageId, userId);
  });
  
  socket.on('thread-deleted', ({ reason }) => {
    alert(`Thread deleted: ${reason}`);
    window.location.href = '/';
  });
  
  socket.on('user-typing', ({ userId }) => {
    showTypingIndicator(userId);
  });
}

// Send message
function sendMessage(threadId, senderId, text) {
  const encrypted = encryptMessage(text, key);
  socket.emit('send-message', {
    threadId,
    message: encrypted,
    senderId
  });
}

// Mark as read
function markAsRead(threadId, userId, messageId) {
  socket.emit('mark-read', { threadId, userId, messageId });
}

// Register participant
function registerParticipant(threadId, userId) {
  socket.emit('register-participant', { threadId, userId });
}

// Encryption utilities
function encryptMessage(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decryptMessage(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

---

## Notes

- **Client-side encryption required** - Server never sees plaintext
- **Ephemeral storage** - Data deleted after timer or when all messages read
- **No authentication** - Threads are open to anyone with the ID
- **Production** - Use proper key exchange (ECDH) and secure WebSocket (WSS)
- **Redis** - Used for production; in-memory fallback for development

---

**Last Updated:** February 16, 2026
