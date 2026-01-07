'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Mail, Database, Webhook } from 'lucide-react'

export default function TestWebhookPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<{
    step: string
    status: 'pending' | 'success' | 'error'
    message: string
    details?: any
  }[]>([])

  const addResult = (step: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setResults(prev => [...prev, { step, status, message, details }])
  }

  const testWebhook = async () => {
    setTesting(true)
    setResults([])

    try {
      // ÉTAPE 1 : Vérifier que l'endpoint webhook existe
      addResult('webhook-exists', 'pending', 'Vérification de l\'endpoint webhook...')

      const getResponse = await fetch('/api/emails/inbound')
      const getInfo = await getResponse.json()

      if (getResponse.ok) {
        addResult('webhook-exists', 'success', 'Endpoint webhook actif', getInfo)
      } else {
        addResult('webhook-exists', 'error', 'Endpoint webhook non accessible')
        setTesting(false)
        return
      }

      // ÉTAPE 2 : Tester l'envoi d'un email via le webhook (sans signature)
      addResult('webhook-test', 'pending', 'Envoi d\'un email de test au webhook...')

      const testPayload = {
        from: 'test@example.com',
        to: 'admin@osteo-upgrade.fr',
        subject: `[TEST WEBHOOK] ${new Date().toLocaleString('fr-FR')}`,
        text: 'Ceci est un email de test généré depuis la page de diagnostic.',
        html: '<p>Ceci est un email de test généré depuis la page de diagnostic.</p>',
        message_id: `test-${Date.now()}`,
        email_id: `test-email-${Date.now()}`
      }

      const webhookResponse = await fetch('/api/emails/inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      })

      const webhookResult = await webhookResponse.json()

      if (webhookResponse.ok) {
        addResult('webhook-test', 'success', 'Email de test envoyé au webhook avec succès', {
          status: webhookResponse.status,
          emailId: webhookResult.emailId,
          category: webhookResult.category
        })

        // ÉTAPE 3 : Vérifier que l'email est dans la base de données
        addResult('database-check', 'pending', 'Vérification de l\'insertion en base de données...')

        // Attendre 2 secondes pour laisser le temps à l'insertion
        await new Promise(resolve => setTimeout(resolve, 2000))

        const listResponse = await fetch('/api/emails/list?limit=1')
        const listResult = await listResponse.json()

        if (listResponse.ok && listResult.emails && listResult.emails.length > 0) {
          const latestEmail = listResult.emails[0]

          if (latestEmail.subject.includes('[TEST WEBHOOK]')) {
            addResult('database-check', 'success', 'Email trouvé dans la base de données', {
              id: latestEmail.id,
              subject: latestEmail.subject,
              from: latestEmail.from_email,
              receivedAt: latestEmail.received_at
            })
          } else {
            addResult('database-check', 'error', 'Email de test non trouvé (dernier email différent)', {
              latestSubject: latestEmail.subject
            })
          }
        } else {
          addResult('database-check', 'error', 'Aucun email trouvé dans la base de données')
        }

        // ÉTAPE 4 : Vérifier l'affichage dans l'interface
        addResult('ui-check', 'success', 'Vérifiez /admin/emails pour voir si l\'email apparaît', {
          link: '/admin/emails'
        })

      } else {
        addResult('webhook-test', 'error', `Erreur webhook (${webhookResponse.status})`, {
          status: webhookResponse.status,
          error: webhookResult.error || webhookResult
        })
      }

    } catch (error: any) {
      addResult('error', 'error', 'Erreur lors du test', {
        message: error.message,
        stack: error.stack
      })
    }

    setTesting(false)
  }

  const testDatabaseDirect = async () => {
    setTesting(true)
    setResults([])

    try {
      addResult('db-list', 'pending', 'Récupération des derniers emails...')

      const response = await fetch('/api/emails/list?limit=5')
      const result = await response.json()

      if (response.ok) {
        addResult('db-list', 'success', `${result.emails.length} email(s) trouvé(s)`, {
          total: result.emails.length,
          emails: result.emails.map((e: any) => ({
            id: e.id,
            from: e.from_email,
            subject: e.subject,
            receivedAt: e.received_at
          }))
        })
      } else {
        addResult('db-list', 'error', 'Erreur lors de la récupération', result)
      }
    } catch (error: any) {
      addResult('error', 'error', 'Erreur', { message: error.message })
    }

    setTesting(false)
  }

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Test du Webhook Email
          </CardTitle>
          <CardDescription>
            Diagnostiquer pourquoi les emails n'arrivent pas dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Cette page permet de tester le webhook sans passer par Resend.
              Si le test fonctionne, le problème vient de la configuration Resend.
              Si le test échoue, le problème vient du code de l'application.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button
              onClick={testWebhook}
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Tester le Webhook Complet
                </>
              )}
            </Button>

            <Button
              onClick={testDatabaseDirect}
              disabled={testing}
              variant="outline"
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Vérifier la Base de Données
                </>
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-lg">Résultats du diagnostic :</h3>

              {results.map((result, index) => (
                <Card key={index} className={`border-l-4 ${
                  result.status === 'success' ? 'border-l-green-500' :
                  result.status === 'error' ? 'border-l-red-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <p className="font-medium">{result.message}</p>
                        {result.details && (
                          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Interprétation des résultats :</h4>
            <ul className="space-y-2 text-sm">
              <li><strong>✅ Tous les tests réussis :</strong> Le webhook fonctionne ! Le problème vient de Resend (vérifier la configuration de l'Inbound Route)</li>
              <li><strong>❌ Webhook test échoue avec 401 :</strong> Signature Svix invalide (vérifier RESEND_WEBHOOK_SECRET dans Vercel)</li>
              <li><strong>❌ Webhook test échoue avec 400 :</strong> Headers Svix manquants (normal pour ce test, mais problématique si Resend l'envoie)</li>
              <li><strong>❌ Database check échoue :</strong> Problème d'insertion en base (vérifier les policies RLS Supabase)</li>
              <li><strong>❌ Aucun email en DB :</strong> La table est vide ou les policies bloquent la lecture</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <h4 className="font-semibold mb-2">⚠️ Note importante :</h4>
            <p className="text-sm">
              Ce test n'envoie PAS de signature Svix. Si vous avez configuré <code>RESEND_WEBHOOK_SECRET</code> dans Vercel,
              le webhook peut rejeter cette requête avec une erreur 400 ou 401. C'est normal !
              Dans ce cas, vérifiez directement dans les logs Vercel si Resend appelle bien le webhook.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
