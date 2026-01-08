import { NextResponse } from 'next/server'

/**
 * GET /api/emails/[id]/attachments/[attachmentId]
 * Retrieves a download URL for an email attachment from Resend
 *
 * This endpoint fetches the attachment metadata from Resend API,
 * which includes a signed download_url that expires after a certain time.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const { id, attachmentId } = params

    if (!id || !attachmentId) {
      return NextResponse.json(
        { error: 'Missing email ID or attachment ID' },
        { status: 400 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Fetch attachment metadata from Resend API
    const response = await fetch(
      `https://api.resend.com/emails/receiving/${id}/attachments/${attachmentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('❌ Failed to fetch attachment from Resend:', {
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json(
        { error: 'Failed to fetch attachment' },
        { status: response.status }
      )
    }

    const attachmentData = await response.json()

    // Return attachment metadata including the download URL
    return NextResponse.json({
      success: true,
      attachment: {
        id: attachmentData.id,
        filename: attachmentData.filename,
        size: attachmentData.size,
        contentType: attachmentData.content_type,
        downloadUrl: attachmentData.download_url,
        expiresAt: attachmentData.expires_at,
      },
    })
  } catch (error: any) {
    console.error('❌ Error fetching attachment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
