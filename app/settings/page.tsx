'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Crown,
  Shield,
  Check,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  ChevronRight,
  Settings,
  Bell,
  Globe,
  Smartphone
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    newsletter: true
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      setUser(user)
      setEmail(user.email || '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)
      setFullName(profileData?.full_name || '')
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        })
        
        if (emailError) throw emailError
        
        alert('Un email de confirmation a été envoyé à votre nouvelle adresse')
      }

      alert('Profil mis à jour avec succès!')
      loadUserData()
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }

    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setSaving(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      alert('Mot de passe mis à jour avec succès!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradeToPremium = () => {
    // In a real app, this would integrate with a payment processor
    alert('Redirection vers la page de paiement...')
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return
    }

    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'free',
          subscription_status: 'cancelled',
          subscription_end_date: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Abonnement annulé. Vous conservez l\'accès Premium jusqu\'à la fin de la période payée.')
      loadUserData()
    } catch (error: any) {
      alert('Erreur lors de l\'annulation: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'account', label: 'Compte', icon: User },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Préférences', icon: Settings },
  ]

  const premiumFeatures = [
    'Accès à tous les arbres décisionnels',
    'Nouveaux arbres ajoutés régulièrement',
    'Export PDF des diagnostics',
    'Historique illimité',
    'Support prioritaire',
    'Statistiques détaillées'
  ]

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="mt-1 text-gray-600">
            Gérez votre compte et vos préférences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Informations du compte
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle
                    </label>
                    <div className="flex items-center space-x-2">
                      {profile?.role === 'admin' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                          <Shield className="h-4 w-4 mr-1" />
                          Administrateur
                        </span>
                      )}
                      {profile?.role === 'premium' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                          <Crown className="h-4 w-4 mr-1" />
                          Premium
                        </span>
                      )}
                      {profile?.role === 'free' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          Gratuit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {saving && <Loader2 className="animate-spin h-4 w-4" />}
                      <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Abonnement
                </h2>

                {profile?.role === 'free' ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-start space-x-4">
                        <Crown className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Passez à Premium
                          </h3>
                          <p className="text-gray-600 mt-1">
                            Débloquez toutes les fonctionnalités pour 29,99€/mois
                          </p>
                          
                          <div className="mt-4 space-y-2">
                            {premiumFeatures.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={handleUpgradeToPremium}
                            className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                          >
                            Passer à Premium
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Vous utilisez actuellement la version gratuite avec accès limité
                      </p>
                    </div>
                  </div>
                ) : profile?.role === 'premium' ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Crown className="h-8 w-8 text-green-600 flex-shrink-0" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Abonnement Premium actif
                            </h3>
                            <p className="text-gray-600 mt-1">
                              29,99€/mois
                            </p>
                            {profile.subscription_end_date && (
                              <p className="text-sm text-gray-500 mt-2">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Prochaine facturation: {new Date(profile.subscription_end_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Fonctionnalités incluses
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {premiumFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <button
                        onClick={handleCancelSubscription}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Annuler l'abonnement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Compte Administrateur
                        </h3>
                        <p className="text-gray-600">
                          Vous avez un accès complet à toutes les fonctionnalités
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Sécurité
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={saving}
                      className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {saving && <Loader2 className="animate-spin h-4 w-4" />}
                      <span>{saving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Notifications
                </h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Notifications par email</p>
                        <p className="text-sm text-gray-600">Recevez des mises à jour importantes</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Notifications push</p>
                        <p className="text-sm text-gray-600">Notifications sur votre appareil</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Newsletter</p>
                        <p className="text-sm text-gray-600">Nouveautés et conseils mensuels</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.newsletter}
                      onChange={(e) => setNotifications({...notifications, newsletter: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Préférences
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format de date
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
                      <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
                      <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuseau horaire
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                      <option value="America/New_York">America/New York (UTC-5)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
