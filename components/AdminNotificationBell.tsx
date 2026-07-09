'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Bug, CreditCard, Users, UserPlus, X, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type NotifType = 'bug_report' | 'new_subscription' | 'referral' | 'signup' | 'other'

type Notification = {
  id: string
  type: NotifType
  title: string
  body: string | null
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const typeConfig: Record<NotifType, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  bug_report:       { icon: Bug,        color: 'text-amber-400', bg: 'bg-amber-500/10' },
  new_subscription: { icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/10' },
  signup:           { icon: UserPlus,   color: 'text-sky-400',   bg: 'bg-sky-500/10'   },
  referral:         { icon: Users,      color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
  other:            { icon: Bell,       color: 'text-slate-400', bg: 'bg-slate-500/10' },
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setNotifications(data)
    }
    fetch()

    const channel = supabase
      .channel('admin_notif_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('admin_notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('admin_notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications admin"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-amber-400 text-slate-900 text-[9px] font-bold rounded-full px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop — rendu hors de la sidebar via portal pour éviter overflow-hidden + transform */}
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />

          {/* Slide-over panel (right side) */}
          <div className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-blue-900/50 shadow-2xl z-[61] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-blue-900/30">
              {notifications.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <Bell className="h-8 w-8 text-slate-700" />
                  <p className="text-sm text-slate-500">Aucune notification</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const cfg = typeConfig[notif.type] ?? typeConfig.other
                  const Icon = cfg.icon
                  return (
                    <button
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className={`w-full flex gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 ${notif.read ? 'opacity-50' : ''}`}
                    >
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${notif.read ? 'text-slate-400' : 'text-white'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-0.5" />}
                        </div>
                        {notif.body && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
