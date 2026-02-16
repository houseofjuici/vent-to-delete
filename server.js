const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');

// Sentry Error Tracking
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
    ],

    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },

    initialScope: {
      tags: {
        app: 'vent-to-delete',
        runtime: 'node',
      },
    },
  });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sentry request handlers (if enabled)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// In-memory storage as fallback when Redis is not available
const memoryStore = new Map();

// Simulated Redis client with in-memory storage
class MockRedis {
  constructor() {
    this.data = new Map();
  }

  async setex(key, ttl, value) {
    this.data.set(key, value);
    // Set timeout to delete after TTL
    setTimeout(() => {
      this.data.delete(key);
      io.to(key.replace('thread:', '')).emit('thread-deleted', { reason: 'timer-expired' });
    }, ttl * 1000);
    return 'OK';
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async del(key) {
    return this.data.delete(key) ? 1 : 0;
  }

  async ttl(key) {
    // Return default TTL for demo (24 hours)
    return 86400;
  }
}

// Try to connect to Redis, fall back to memory store
let redis;
try {
  const Redis = require('ioredis');
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: () => {
      console.log('⚠️ Redis unavailable, using in-memory storage');
      return null;
    }
  });

  redis.on('error', () => {
    console.log('⚠️ Redis connection failed, falling back to in-memory storage');
    redis = new MockRedis();
  });

  // Test connection
  redis.ping().catch(() => {
    redis = new MockRedis();
    console.log('✅ Using in-memory storage for demo');
  });
} catch (error) {
  redis = new MockRedis();
  console.log('✅ Using in-memory storage (Redis module not available)');
}

// Utility: Generate thread ID
const generateThreadId = () => crypto.randomBytes(16).toString('hex');

// Utility: Set thread TTL (in seconds)
const getThreadTTL = (hours) => hours * 3600;

// POST /api/thread - Create new thread
app.post('/api/thread', async (req, res) => {
  try {
    const { timerHours = 24 } = req.body;
    const validHours = Math.min(Math.max(1, parseInt(timerHours)), 168); // 1h to 168h
    
    const threadId = generateThreadId();
    const threadKey = `thread:${threadId}`;
    
    const threadData = {
      id: threadId,
      createdAt: Date.now(),
      timerHours: validHours,
      participants: [],
      messages: [],
      readBy: [],
      timeLeft: validHours * 3600 * 1000 // for client display
    };
    
    // Store in Redis/memory with TTL
    await redis.setex(
      threadKey,
      getThreadTTL(validHours),
      JSON.stringify(threadData)
    );
    
    res.json({ 
      success: true, 
      threadId,
      inviteUrl: `${req.protocol}://${req.get('host')}/thread/${threadId}`,
      expiresIn: validHours * 3600 * 1000 // milliseconds
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ success: false, error: 'Failed to create thread' });
  }
});

// GET /api/thread/:id - Get thread data
app.get('/api/thread/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const threadKey = `thread:${id}`;
    const data = await redis.get(threadKey);
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Thread not found or expired' });
    }
    
    const thread = JSON.parse(data);
    const timeLeft = await redis.ttl(threadKey);
    
    res.json({ 
      success: true, 
      thread: {
        ...thread,
        timeLeft: timeLeft * 1000 // milliseconds
      }
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ success: false, error: 'Failed to get thread' });
  }
});

// DELETE /api/thread/:id - Manually delete thread
app.delete('/api/thread/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const threadKey = `thread:${id}`;
    await redis.del(threadKey);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete thread error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete thread' });
  }
});

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  socket.on('join-thread', async (threadId) => {
    socket.join(threadId);
    console.log(`User joined thread: ${threadId}`);
  });
  
  socket.on('send-message', async (data) => {
    const { threadId, message, senderId } = data;
    
    try {
      const threadKey = `thread:${threadId}`;
      const threadData = await redis.get(threadKey);
      
      if (!threadData) {
        socket.emit('error', { message: 'Thread not found' });
        return;
      }
      
      const thread = JSON.parse(threadData);
      
      // Add message (already encrypted by client)
      const newMessage = {
        id: crypto.randomBytes(8).toString('hex'),
        content: message, // encrypted
        senderId,
        timestamp: Date.now(),
        readBy: []
      };
      
      thread.messages.push(newMessage);
      thread.readBy = []; // Reset read status on new message
      
      await redis.setex(threadKey, getThreadTTL(thread.timerHours), JSON.stringify(thread));
      
      // Broadcast to thread
      io.to(threadId).emit('new-message', newMessage);
      io.to(threadId).emit('thread-update', thread);
      
      // Check if both have read all messages
      checkAutoDelete(threadId, thread);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  socket.on('mark-read', async (data) => {
    const { threadId, userId, messageId } = data;
    
    try {
      const threadKey = `thread:${threadId}`;
      const threadData = await redis.get(threadKey);
      
      if (!threadData) return;
      
      const thread = JSON.parse(threadData);
      
      // Mark specific message as read
      const message = thread.messages.find(m => m.id === messageId);
      if (message && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
      
      await redis.setex(threadKey, getThreadTTL(thread.timerHours), JSON.stringify(thread));
      
      io.to(threadId).emit('message-read', { messageId, userId });
      io.to(threadId).emit('thread-update', thread);
      
      // Check if both have read all messages
      checkAutoDelete(threadId, thread);
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
  
  socket.on('register-participant', async (data) => {
    const { threadId, userId } = data;
    
    try {
      const threadKey = `thread:${threadId}`;
      const threadData = await redis.get(threadKey);
      
      if (!threadData) return;
      
      const thread = JSON.parse(threadData);
      
      if (!thread.participants.includes(userId)) {
        thread.participants.push(userId);
        await redis.setex(threadKey, getThreadTTL(thread.timerHours), JSON.stringify(thread));
        io.to(threadId).emit('thread-update', thread);
      }
    } catch (error) {
      console.error('Register participant error:', error);
    }
  });
  
  socket.on('user-typing', async (data) => {
    const { threadId, userId } = data;
    // Broadcast typing indicator to other users in thread
    socket.to(threadId).emit('user-typing', { userId });
  });
  
  socket.on('add-reaction', async (data) => {
    const { threadId, messageId, emoji, userId } = data;
    
    try {
      const threadKey = `thread:${threadId}`;
      const threadData = await redis.get(threadKey);
      
      if (!threadData) return;
      
      const thread = JSON.parse(threadData);
      const message = thread.messages.find(m => m.id === messageId);
      
      if (message) {
        if (!message.reactions) message.reactions = [];
        
        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          r => r.emoji === emoji && r.userId === userId
        );
        
        if (existingReaction) {
          // Remove reaction (toggle)
          message.reactions = message.reactions.filter(r => r !== existingReaction);
        } else {
          // Add reaction
          message.reactions.push({ emoji, userId, timestamp: Date.now() });
        }
        
        await redis.setex(threadKey, getThreadTTL(thread.timerHours), JSON.stringify(thread));
        io.to(threadId).emit('message-reaction', { messageId, emoji, userId, reactions: message.reactions });
      }
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Check if thread should be auto-deleted (both participants read all messages)
async function checkAutoDelete(threadId, thread) {
  if (thread.participants.length !== 2) return;
  
  const allRead = thread.messages.every(msg => 
    msg.readBy.length === 2 && thread.participants.every(p => msg.readBy.includes(p))
  );
  
  if (allRead && thread.messages.length > 0) {
    console.log(`Auto-deleting thread ${threadId} - all messages read`);
    await redis.del(`thread:${threadId}`);
    io.to(threadId).emit('thread-deleted', { reason: 'both-read' });
  }
}

const PORT = process.env.PORT || 3000;

// Sentry error handler (must be before other error middleware)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
