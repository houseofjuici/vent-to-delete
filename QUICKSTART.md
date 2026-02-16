# ⚡ Vent to Delete - Quick Start

Start using "Vent to Delete" in 60 seconds.

## Option 1: Local Testing (No Redis Required)

```bash
cd vent-to-delete
npm install
npm start
```

Open http://localhost:3000

That's it! The app will use in-memory storage for testing.

---

## Option 2: Deploy to Railway (Production)

1. Push code to GitHub
2. Go to https://railway.app/new
3. Select your GitHub repo
4. Add Redis service
5. Deploy!

Your app will be live in 2 minutes.

---

## How to Use

### Create a Thread
1. Click "Create New Thread"
2. Select timer (24 hours default)
3. Click "Create Thread"
4. Copy the invite link

### Share the Thread
Send the invite link to your friend. **Important**: The link contains the encryption key, so share it securely.

### Chat
1. Both users open the link
2. Send messages
3. See "✓ Read" when messages are read
4. Thread auto-deletes when timer expires OR both read all messages

### No Signup Required
Just open the link and start chatting. No accounts, no emails, no tracking.

---

## Test the Deletion

**Timer-Based Deletion:**
1. Create a thread with 1-minute timer
2. Send a message
3. Wait 1 minute
4. Refresh the page
5. Thread will show "not found or expired"

**Both-Read Deletion:**
1. Create a thread
2. Open in two different browsers/incognito windows
3. Send messages back and forth
4. Wait for both to read all messages
5. Thread will disappear

---

## Common Issues

**Q: Redis connection failed**
A: That's okay! The app uses in-memory storage for testing.

**Q: Thread disappeared too soon**
A: Check the timer setting. Default is 24 hours minimum.

**Q: Messages not sending**
A: Check browser console. Ensure WebSocket connection is active.

**Q: Can't share invite link**
A: Make sure to copy the ENTIRE URL including the `#key=...` part.

---

## Security Tips

✅ **Do**: Share invite links via secure channels (Signal, iMessage, etc.)
✅ **Do**: Test with small timer values first
✅ **Do**: Verify thread deletion works before trusting

❌ **Don't**: Share invite links publicly
❌ **Don't**: Bookmark sensitive threads (key is in URL)
❌ **Don't**: Use for illegal content (server logs may exist briefly)

---

## What Happens to My Data?

| Data | Stored Where | Deleted When |
|------|--------------|--------------|
| Messages | Encrypted in Redis/memory | Timer expires OR both read |
| Encryption keys | Your URL only | Never (unless you close tab) |
| User identities | Random ID in memory | Thread deleted |
| Server logs | Nowhere | Nothing logged |

**Bottom line**: Once deleted, messages are gone forever.

---

## Next Steps

1. ✅ Test locally
2. ✅ Deploy to Railway
3. ✅ Share with friends
4. ✅ Collect feedback
5. ✅ Plan V2 features

See MVP_BUILD_REPORT.md for architecture details.
See DEPLOYMENT.md for production deployment.

---

**Built in 4 hours. Security first. No permanence.** 🔥
