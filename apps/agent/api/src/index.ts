import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Routes
import authRoutes from './routes/auth.js'
import agentsRoutes from './routes/agents.js'
import workflowsRoutes from './routes/workflows.js'
import executionsRoutes from './routes/executions.js'
import promptsRoutes from './routes/prompts.js'

// Middleware
import { authMiddleware } from './middleware/auth.js'
import { rateLimiter } from './middleware/rate-limit.js'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3003'],
  credentials: true,
}))

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'agent-api',
    version: '1.0.0'
  })
})

// Public routes (no auth)
app.route('/api/auth', authRoutes)

// Protected routes (auth required)
app.use('/api/*', authMiddleware)
app.use('/api/*', rateLimiter())

app.route('/api/agents', agentsRoutes)
app.route('/api/workflows', workflowsRoutes)
app.route('/api/executions', executionsRoutes)
app.route('/api/prompts', promptsRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  }, 500)
})

const port = Number(process.env.PORT) || 3013

console.log(`🚀 Agent-API starting on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
