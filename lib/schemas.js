const z = require('zod')

/**
 * Zod validation schemas for Vent to Delete
 * Ensures input validation across all API endpoints
 */

// Vent content schema
const ventSchema = z.object({
  content: z.string()
    .min(10, 'Vent must be at least 10 characters')
    .max(5000, 'Vent must be less than 5000 characters')
    .refine(
      (content) => !/<script|javascript:|onerror=/i.test(content),
      'Invalid characters detected'
    ),
  mood: z.enum(['angry', 'sad', 'anxious', 'frustrated', 'excited', 'other']),
  tags: z.array(z.string().max(30)).max(5).default([]),
  destroyAfter: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  allowReflection: z.boolean().default(false),
})

// Reflection response schema
const reflectionSchema = z.object({
  ventId: z.string().uuid(),
  response: z.string()
    .min(50, 'Reflection must be at least 50 characters')
    .max(2000, 'Reflection must be less than 2000 characters'),
  helpful: z.boolean().optional(),
})

// Mood stats schema
const moodStatsSchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d']).default('7d'),
  includeDeleted: z.boolean().default(false),
})

// Export request schema
const exportRequestSchema = z.object({
  format: z.enum(['json', 'pdf']),
  includeReflections: z.boolean().default(false),
  anonymize: z.boolean().default(true),
})

// Search query schema
const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  moodFilter: z.enum(['angry', 'sad', 'anxious', 'frustrated', 'excited', 'other', 'all']).default('all'),
  limit: z.number().int().min(1).max(50).default(20),
})

module.exports = {
  ventSchema,
  reflectionSchema,
  moodStatsSchema,
  exportRequestSchema,
  searchQuerySchema,
}
