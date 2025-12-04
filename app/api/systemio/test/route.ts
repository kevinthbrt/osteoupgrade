import { NextResponse } from 'next/server'

/**
 * GET /api/systemio/test
 * Test de connexion à l'API System.io
 */
export async function GET(request: Request) {
  const apiKey = process.env.SYSTEMIO_API_KEY
  const apiUrl = process.env.SYSTEMIO_API_URL || 'https://systeme.io/api/v1'

  // Vérifier que la clé existe
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'SYSTEMIO_API_KEY non configurée',
      details: 'Ajoutez SYSTEMIO_API_KEY dans les variables d\'environnement Vercel'
    }, { status: 500 })
  }

  try {
    // Test 1 : Essayer de récupérer les informations du compte
    console.log('🔍 Test connexion System.io...')
    console.log('API URL:', apiUrl)
    console.log('API Key (premiers chars):', apiKey.substring(0, 10) + '...')

    const response = await fetch(`${apiUrl}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    console.log('Response status:', response.status)
    console.log('Response:', responseData)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erreur API System.io',
        status: response.status,
        statusText: response.statusText,
        details: responseData,
        suggestions: [
          'Vérifiez que votre clé API est correcte',
          'Vérifiez que votre compte System.io est actif',
          'Essayez de régénérer une nouvelle clé API dans System.io',
          'L\'endpoint /me n\'existe peut-être pas dans l\'API System.io'
        ]
      }, { status: response.status })
    }

    // Test 2 : Essayer de lister les contacts
    const contactsResponse = await fetch(`${apiUrl}/contacts?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    })

    const contactsText = await contactsResponse.text()
    let contactsData

    try {
      contactsData = JSON.parse(contactsText)
    } catch {
      contactsData = contactsText
    }

    return NextResponse.json({
      success: true,
      message: '✅ Connexion System.io réussie !',
      config: {
        apiUrl,
        apiKeyConfigured: true,
        apiKeyPreview: apiKey.substring(0, 10) + '...'
      },
      tests: {
        accountInfo: {
          status: response.status,
          data: responseData
        },
        contacts: {
          status: contactsResponse.status,
          data: contactsData
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur test System.io:', error)

    return NextResponse.json({
      success: false,
      error: 'Erreur de connexion',
      message: error.message,
      details: error.toString(),
      suggestions: [
        'Vérifiez votre connexion internet',
        'Vérifiez que l\'URL de l\'API est correcte',
        'Essayez de redéployer l\'application'
      ]
    }, { status: 500 })
  }
}
