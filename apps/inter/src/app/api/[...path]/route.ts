import { NextRequest, NextResponse } from 'next/server'

// API Gateway: Proxy all /api/* requests to inter-api backend
const API_URL = process.env.INTER_API_URL || 'http://inter-api:3011'

// CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://inter.app.obotcall.tech',
  'https://app.obotcall.tech',
  'https://tech.obotcall.tech',
]

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {}

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'

  return headers
}

async function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const path = params.path?.join('/') || ''
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''

    // Build the backend URL
    const backendUrl = `${API_URL}/api/${path}${queryString}`

    // Get the request body if present
    let body = null
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text()
      } catch (e) {
        // No body or already consumed
      }
    }

    // Forward request to Hono backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: body,
    })

    // Get response data
    const data = await response.text()

    // Return response with same status and CORS headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('API Proxy Error:', error)
    return NextResponse.json(
      { error: 'API Gateway Error', message: error.message },
      { status: 500 },
      { headers: corsHeaders }
    )
  }
}

export async function GET(request: NextRequest, context: any) {
  return handler(request, context)
}

export async function POST(request: NextRequest, context: any) {
  return handler(request, context)
}

export async function PUT(request: NextRequest, context: any) {
  return handler(request, context)
}

export async function PATCH(request: NextRequest, context: any) {
  return handler(request, context)
}

export async function DELETE(request: NextRequest, context: any) {
  return handler(request, context)
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}
