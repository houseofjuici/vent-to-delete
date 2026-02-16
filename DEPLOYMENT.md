# 🚀 Deployment Guide - Vent to Delete

This guide covers deploying "Vent to Delete" to production.

## Quick Deploy (Railway - Recommended)

Railway is the easiest deployment option for this app because:
- Built-in Redis service
- Simple Git integration
- Automatic HTTPS
- Free tier available

### Step 1: Push to GitHub

```bash
cd vent-to-delete
git init
git add .
git commit -m "Initial commit: Vent to Delete MVP"
gh repo create vent-to-delete --public --source=. --remote=origin --push
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `vent-to-delete` repository
4. Click "Add Service" → Select "Redis"
5. Click "Add Service" → Select "Dockerfile" or "Nixpacks"
6. Set environment variables:
   - `PORT=3000`
   - `REDIS_URL` (automatically set by Railway)
7. Click "Deploy"

### Step 3: Access Your App

Railway will provide a URL like:
```
https://your-app-name.up.railway.app
```

Test it by opening the URL and creating a thread!

---

## Alternative Deployments

### Vercel + Upstash Redis

**Note**: Vercel is serverless, so you need to adapt the Express server.

1. Fork this repo
2. Create [Upstash Redis](https://upstash.com) account
3. Deploy to Vercel
4. Set environment variable: `REDIS_URL`
5. Note: You'll need to convert server.js to serverless functions

### DigitalOcean App Platform

1. Push code to GitHub
2. Create new app in DigitalOcean
3. Add Redis service
4. Deploy from GitHub
5. Set environment variables

### Self-Hosted (Docker)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

Run:

```bash
docker-compose up -d
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `REDIS_URL` | No* | `redis://localhost:6379` | Redis connection string |

*If Redis URL is not provided, app falls back to in-memory storage (not recommended for production).

---

## Post-Deployment Checklist

- [ ] App is accessible via HTTPS
- [ ] Create thread works (<10 seconds)
- [ ] Invite link can be shared
- [ ] Messages send in <2 seconds
- [ ] Read receipts appear correctly
- [ ] Thread auto-deletes on timer expiry
- [ ] Thread auto-deletes when both read all messages
- [ ] Refreshing deleted thread shows 404

---

## Monitoring & Maintenance

### Health Checks

Add this to your `server.js` (already included):

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

### Monitoring Tools

- **Railway**: Built-in metrics and logs
- **UptimeRobot**: Monitor app uptime
- **Sentry**: Error tracking (optional)

### Backup Strategy

**Note**: This app is ephemeral by design. No backups needed or desired.

---

## Scaling Considerations

### When to Scale Up
- More than 100 concurrent threads
- More than 1000 messages per second
- High Redis memory usage

### Scaling Options
1. **Vertical Scaling**: Upgrade Railway plan
2. **Horizontal Scaling**: Multiple app instances behind load balancer
3. **Redis Cluster**: Use Redis Cluster for high availability

---

## Cost Estimates

### Railway (Free Tier)
- App: Free (512MB RAM, $5 free credit/month)
- Redis: Free (256MB RAM)
- **Total: $0/month** (up to free limits)

### Railway (Paid)
- App: ~$5/month (512MB RAM)
- Redis: ~$5/month (256MB RAM)
- **Total: ~$10/month**

### DigitalOcean
- App: ~$5/month
- Redis: ~$15/month (managed)
- **Total: ~$20/month**

---

## Troubleshooting

### Issue: "Redis connection failed"
**Solution**: App falls back to in-memory storage. For production, ensure Redis URL is correct.

### Issue: "Thread not found immediately after creation"
**Solution**: Check Redis TTL settings. Default is 1 hour minimum.

### Issue: "Messages not appearing in real-time"
**Solution**: Verify WebSocket connection. Check browser console for errors.

### Issue: "Can't share invite link"
**Solution**: Ensure the full URL including `#key=...` is copied.

---

## Security Best Practices

### Production Checklist
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] Redis password protected
- [ ] Firewall rules configured
- [ ] Rate limiting implemented (use `express-rate-limit`)
- [ ] CORS restricted to specific domains
- [ ] Input validation on all endpoints

### Add Rate Limiting

Install:

```bash
npm install express-rate-limit
```

Add to `server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Legal Considerations

### Privacy Policy
Even though you don't collect data, add a privacy policy stating:
- No data collection
- No message logging
- Ephemeral messaging
- End-to-end encryption

### Terms of Service
Add basic ToS covering:
- Acceptable use
- Illegal content prohibition
- Service availability disclaimer

### Compliance
- **GDPR**: No personal data collected, compliant
- **CCPA**: No data selling, compliant
- **COPPA**: Not targeting children, but consider age gate if needed

---

## Support & Updates

For issues or questions:
1. Check the main README.md
2. Review MVP_BUILD_REPORT.md for architecture details
3. Open an issue on GitHub

---

**Remember**: This is an MVP. Test thoroughly before production use. 🔒
