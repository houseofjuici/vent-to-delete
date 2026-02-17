/**
 * Rate limiting middleware for Vent to Delete
 * Protects API endpoints from abuse
 */

const rateLimit = require('express-rate-limit')

/**
 * Standard rate limiter for general API endpoints
 * 10 requests per 10 seconds per IP
 */
const standardLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 10,
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
})

/**
 * Strict rate limiter for expensive operations (AI analysis)
 * 3 requests per minute per IP
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    error: 'Rate limit exceeded for this operation. Please wait before trying again.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Very strict rate limiter for auth endpoints
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many auth attempts, please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

module.exports = {
  standardLimiter,
  strictLimiter,
  authLimiter,
}
