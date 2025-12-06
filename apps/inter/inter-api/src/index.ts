import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Routes
import authRoutes from './routes/auth.js'
import interventionsRoutes from './routes/interventions.js'
import clientsRoutes from './routes/clients.js'
import devisRoutes from './routes/devis.js'
import facturesRoutes from './routes/factures.js'
import tenantsRoutes from './routes/tenants.js'
import businessTypesRoutes from './routes/business-types.js'
import interventionTypesRoutes from './routes/intervention-types.js'
import productsRoutes from './routes/products.js'
import interventionItemsRoutes from './routes/intervention-items.js'

// Middleware
import { authMiddleware } from './middleware/auth.js'
import { rateLimiter } from './middleware/rate-limit.js'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())

// CORS configuration with proper defaults
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://inter.app.obotcall.tech',
  'https://app.obotcall.tech',
  'https://tech.obotcall.tech',
]

// Add custom CORS_ORIGIN from env if provided
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','))
}

app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return '*'

    // Check if origin is in allowed list
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  },
  credentials: true,
}))

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'inter-api',
    version: '1.0.0'
  })
})

// Public routes (no auth)
app.route('/api/auth', authRoutes)
app.route('/api/business-types', businessTypesRoutes) // Public for registration

// Protected routes (auth required) - exclude public routes
app.use('/api/*', async (c, next) => {
  const path = c.req.path

  // Skip auth for public routes
  if (path.startsWith('/api/auth') || path.startsWith('/api/business-types')) {
    return next()
  }

  return authMiddleware(c, next)
})
app.use('/api/*', async (c, next) => {
  const path = c.req.path

  // Skip rate limiting for public routes
  if (path.startsWith('/api/auth') || path.startsWith('/api/business-types')) {
    return next()
  }

  return rateLimiter()(c, next)
})

app.route('/api/interventions', interventionsRoutes)
app.route('/api/intervention-items', interventionItemsRoutes)
app.route('/api/intervention-types', interventionTypesRoutes)
app.route('/api/clients', clientsRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/devis', devisRoutes)
app.route('/api/factures', facturesRoutes)
app.route('/api/tenants', tenantsRoutes)

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

const port = Number(process.env.PORT) || 3000

console.log(`🚀 Inter-API starting on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
