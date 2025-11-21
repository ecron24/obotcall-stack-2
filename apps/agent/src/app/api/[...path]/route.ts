import { NextRequest, NextResponse } from 'next/server'

// API Gateway: Proxy all /api/* requests to agent-api backend
const API_URL = process.env.AGENT_API_URL || 'http://agent-api:3013'

async function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
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

    // Return response with same status and headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error: any) {
    console.error('API Proxy Error:', error)
    return NextResponse.json(
      { error: 'API Gateway Error', message: error.message },
      { status: 500 }
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
