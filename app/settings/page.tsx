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
  Globe
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('account')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notifications, setNotifications] = useState({ email: true, push: false, newsletter: true })
  const [savingNotifications, setSavingNotifications] = useState(false)

  useEffect(() => { loadUserData() }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      setEmail(user.email || '')
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      setFullName(profileData?.full_name || '')
      setNotifications(prev => ({ ...prev, newsletter: profileData?.newsletter_opt_in ?? false }))
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally { setLoading(false) }
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (error) throw error
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
        alert('Un email de confirmation a été envoyé à votre nouvelle adresse')
      }
      alert('Profil mis à jour avec succès!')
      loadUserData()
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally { setSaving(false) }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) { alert('Les mots de passe ne correspondent pas'); return }
    if (newPassword.length < 6) { alert('Le mot de passe doit contenir au moins 6 caractères'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      alert('Mot de passe mis à jour avec succès!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally { setSaving(false) }
  }

  const handleUpgradeToPremium = async () => {
    if (!user?.id || !email) { alert('Veuillez vous reconnecter.'); return }
    setSaving(true)
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planType: 'premium_monthly', userId: user.id, email }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Impossible de démarrer le paiement Stripe')
      if (data?.url) window.location.href = data.url
      else throw new Error('Lien Stripe manquant')
    } catch (error: any) {
      alert('Erreur lors de la redirection vers Stripe: ' + error.message)
    } finally { setSaving(false) }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ role: 'free', subscription_status: 'cancelled', subscription_end_date: new Date().toISOString() }).eq('id', user.id)
      if (error) throw error
      alert('Abonnement annulé. Vous conservez l\'accès Premium jusqu\'à la fin de la période payée.')
      loadUserData()
    } catch (error: any) {
      alert('Erreur lors de l\'annulation: ' + error.message)
    } finally { setSaving(false) }
  }

  const handleUpdateNotifications = async () => {
    setSavingNotifications(true)
    try {
      const { error } = await supabase.from('profiles').update({ newsletter_opt_in: notifications.newsletter, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (error) throw error
      alert('Préférences de notification mises à jour !')
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally { setSavingNotifications(false) }
  }

  const tabs = [
    { id: 'account', label: 'Compte', icon: User },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard, redirect: '/settings/subscription' },
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

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
  const selectCls = "w-full px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
  const labelCls = "block text-sm font-medium text-slate-700 mb-2"

  if (loading) return (
    <AuthLayout>
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Settings className="h-4 w-4" /> Paramètres
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Gérez votre compte
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Personnalisez vos préférences, gérez votre abonnement et sécurisez votre compte
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent blur-sm" />
        </div>

        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative flex flex-col lg:flex-row gap-6">

            {/* Sidebar tabs */}
            <div className="lg:w-56 flex-shrink-0">
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id && !tab.redirect
                  return (
                    <button
                      key={tab.id}
                      onClick={() => tab.redirect ? router.push(tab.redirect) : setActiveTab(tab.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{tab.label}</span>
                      {tab.redirect && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content panels */}
            <div className="flex-1 min-w-0">

              {/* Account */}
              {activeTab === 'account' && (
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Informations du compte</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Nom complet</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Rôle</label>
                      <div className="flex items-center gap-2">
                        {profile?.role === 'admin' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                            <Shield className="h-3.5 w-3.5" /> Administrateur
                          </span>
                        )}
                        {profile?.role === 'premium' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <Crown className="h-3.5 w-3.5" /> Premium
                          </span>
                        )}
                        {profile?.role === 'free' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Gratuit
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all disabled:opacity-50"
                      >
                        {saving && <Loader2 className="animate-spin h-4 w-4" />}
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription */}
              {activeTab === 'subscription' && (
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Abonnement</h2>
                  </div>
                  {profile?.role === 'free' ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-5">
                        <div className="flex items-start gap-4">
                          <Crown className="h-8 w-8 text-amber-500 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">Passez à Premium</h3>
                            <p className="text-slate-600 text-sm mb-4">Débloquez MyOsteoflow + OsteoUpgrade pour 49,99€/mois, sans engagement</p>
                            <div className="grid sm:grid-cols-2 gap-2 mb-4">
                              {premiumFeatures.map((f, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                  <span className="text-sm text-slate-700">{f}</span>
                                </div>
                              ))}
                            </div>
                            <button onClick={handleUpgradeToPremium} disabled={saving}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/90 backdrop-blur-sm border border-amber-400/30 text-white text-sm font-semibold hover:bg-amber-500 shadow-sm transition-all disabled:opacity-50">
                              {saving ? 'Redirection...' : 'Passer à Premium'}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/60 rounded-xl px-4 py-3 border border-slate-200/60">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        Vous utilisez actuellement la version gratuite avec accès limité
                      </div>
                    </div>
                  ) : profile?.role === 'premium' ? (
                    <div className="space-y-5">
                      <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-5">
                        <div className="flex items-start gap-4">
                          <Crown className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-slate-900">Abonnement Premium actif</h3>
                            <p className="text-slate-600 text-sm mt-1">49,99€/mois, sans engagement</p>
                            {profile.subscription_end_date && (
                              <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                Prochaine facturation : {new Date(profile.subscription_end_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-3">Fonctionnalités incluses</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {premiumFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-sm text-slate-700">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-100/60">
                        <button onClick={handleCancelSubscription}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-600 text-sm font-medium hover:bg-red-500/20 transition-all">
                          Annuler l'abonnement
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-purple-50/80 border border-purple-200/60 p-5 flex items-center gap-4">
                      <Shield className="h-8 w-8 text-purple-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-slate-900">Compte Administrateur</h3>
                        <p className="text-slate-600 text-sm">Vous avez un accès complet à toutes les fonctionnalités</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Sécurité</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Mot de passe actuel</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nouveau mot de passe</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Confirmer le nouveau mot de passe</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
                    </div>
                    <div className="pt-2">
                      <button onClick={handleUpdatePassword} disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all disabled:opacity-50">
                        {saving && <Loader2 className="animate-spin h-4 w-4" />}
                        {saving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Notifications</h2>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100/60 cursor-pointer hover:bg-white/80 transition-all">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900 text-sm">Newsletter</p>
                          <p className="text-xs text-slate-500">Nouveautés, conseils et mises à jour de la plateforme</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.newsletter}
                        onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <div className="pt-2">
                      <button onClick={handleUpdateNotifications} disabled={savingNotifications}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-sm border border-blue-400/30 text-white text-sm font-semibold hover:bg-blue-600 shadow-sm transition-all disabled:opacity-50">
                        {savingNotifications && <Loader2 className="animate-spin h-4 w-4" />}
                        {savingNotifications ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide">Préférences</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Langue</label>
                      <select className={selectCls}>
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Format de date</label>
                      <select className={selectCls}>
                        <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
                        <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
                        <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Fuseau horaire</label>
                      <select className={selectCls}>
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

      </div>
    </AuthLayout>
  )
}
