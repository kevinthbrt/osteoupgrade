import { NextResponse } from 'next/server'

/**
 * POST /api/emails/debug-payload
 * Debug endpoint to capture and display the exact payload from Resend
 *
 * Add this as a SECOND webhook URL in Resend Dashboard temporarily
 * to see exactly what structure Resend is sending.
 */
export async function POST(request: Request) {
  try {
    // Get the raw body
    const payload = await request.text()
    const body = JSON.parse(payload)

    // Get all headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Try to extract email payload from different nesting levels
    const emailPayload = body?.data?.email ?? body?.data ?? body

    // Log everything
    console.log('\n' + '='.repeat(80))
    console.log('📧 RESEND DEBUG PAYLOAD CAPTURE')
    console.log('='.repeat(80))
    console.log('\n🔹 HEADERS:')
    console.log(JSON.stringify(headers, null, 2))
    console.log('\n🔹 RAW BODY:')
    console.log(payload)
    console.log('\n🔹 PARSED BODY:')
    console.log(JSON.stringify(body, null, 2))
    console.log('\n🔹 EMAIL PAYLOAD (extracted):')
    console.log(JSON.stringify(emailPayload, null, 2))
    console.log('\n🔹 AVAILABLE KEYS IN EMAIL PAYLOAD:')
    console.log(Object.keys(emailPayload || {}))
    console.log('\n🔹 FROM FIELD VARIATIONS:')
    console.log('  emailPayload.from:', emailPayload?.from)
    console.log('  emailPayload.sender:', emailPayload?.sender)
    console.log('  emailPayload.headers.from:', emailPayload?.headers?.from)
    console.log('  emailPayload.headers.From:', emailPayload?.headers?.From)
    console.log('\n🔹 TO FIELD VARIATIONS:')
    console.log('  emailPayload.to:', emailPayload?.to)
    console.log('  emailPayload.recipients:', emailPayload?.recipients)
    console.log('  emailPayload.headers.to:', emailPayload?.headers?.to)
    console.log('\n🔹 CONTENT FIELD VARIATIONS:')
    console.log('  emailPayload.html:', emailPayload?.html ? `${emailPayload.html.substring(0, 100)}...` : null)
    console.log('  emailPayload.html_body:', emailPayload?.html_body ? `${emailPayload.html_body.substring(0, 100)}...` : null)
    console.log('  emailPayload.text:', emailPayload?.text ? `${emailPayload.text.substring(0, 100)}...` : null)
    console.log('  emailPayload.text_body:', emailPayload?.text_body ? `${emailPayload.text_body.substring(0, 100)}...` : null)
    console.log('  emailPayload.body (type):', typeof emailPayload?.body)
    console.log('  emailPayload.body:',
      typeof emailPayload?.body === 'string'
        ? emailPayload.body.substring(0, 100) + '...'
        : emailPayload?.body
    )
    console.log('\n' + '='.repeat(80))
    console.log('END DEBUG CAPTURE')
    console.log('='.repeat(80) + '\n')

    // Return the payload so it can be inspected in the response
    return NextResponse.json({
      success: true,
      message: 'Payload captured successfully. Check server logs for full details.',
      summary: {
        headers: headers,
        bodyKeys: Object.keys(body || {}),
        emailPayloadKeys: Object.keys(emailPayload || {}),
        from: emailPayload?.from,
        to: emailPayload?.to,
        subject: emailPayload?.subject,
        hasHtml: !!emailPayload?.html,
        hasText: !!emailPayload?.text,
        hasBody: !!emailPayload?.body,
        bodyType: typeof emailPayload?.body,
      },
    })
  } catch (error: any) {
    console.error('❌ Error in debug endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/emails/debug-payload
 * Returns information about the debug endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'Resend Inbound Email Debug Endpoint',
    status: 'active',
    instructions: [
      '1. Add this URL as a webhook in your Resend dashboard',
      '2. Send a test email',
      '3. Check your server logs to see the exact payload structure',
      '4. Remove this webhook after debugging'
    ],
    url: `${process.env.NEXT_PUBLIC_URL || 'https://your-domain.com'}/api/emails/debug-payload`
  })
}
