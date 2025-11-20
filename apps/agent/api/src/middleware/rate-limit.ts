import { Context, Next } from 'hono'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export const rateLimiter = (options = { maxRequests: 100, windowMs: 60000 }) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId') || c.req.header('X-Forwarded-For') || 'anonymous'
    const now = Date.now()

    if (!store[userId] || now > store[userId].resetTime) {
      store[userId] = {
        count: 0,
        resetTime: now + options.windowMs
      }
    }

    store[userId].count++

    if (store[userId].count > options.maxRequests) {
      return c.json({
        error: 'Too many requests',
        retryAfter: Math.ceil((store[userId].resetTime - now) / 1000)
      }, 429)
    }

    await next()
  }
}
