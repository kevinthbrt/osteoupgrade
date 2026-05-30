'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Megaphone, X, Video } from 'lucide-react'

type Broadcast = {
  id: string
  title: string
  body: string
  image_url: string | null
  video_url: string | null
  target: 'osteoflow' | 'osteoupgrade' | 'both'
  created_at: string
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days < 30) return `il y a ${days}j`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

type SelectedBroadcast = Broadcast | null

export default function UserNotificationBell() {
  const [open, setOpen] = useState(false)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [unseen, setUnseen] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<SelectedBroadcast>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchBroadcasts()
  }, [])

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/broadcasts?target=osteoupgrade', { cache: 'no-store' })
      if (!res.ok) return
      const { broadcasts: all, unseen: unseenList } = await res.json()
      setBroadcasts(all ?? [])
      setUnseen(new Set((unseenList ?? []).map((b: Broadcast) => b.id)))
    } catch { /* silent */ }
  }

  const handleOpen = (b: Broadcast) => {
    setSelected(b)
    // Don't mark as seen just by opening in bell — user reads the modal
  }

  if (!mounted) return null

  const unreadCount = unseen.size

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'text-blue-400' : 'text-slate-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold rounded-full px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />

          <div className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-blue-900/50 shadow-2xl z-[61] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-blue-900/30">
              {broadcasts.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <Bell className="h-8 w-8 text-slate-700" />
                  <p className="text-sm text-slate-500">Aucune annonce</p>
                </div>
              ) : (
                broadcasts.map(b => {
                  const isUnread = unseen.has(b.id)
                  return (
                    <button
                      key={b.id}
                      onClick={() => { handleOpen(b); setOpen(false) }}
                      className={`w-full flex gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 ${isUnread ? '' : 'opacity-60'}`}
                    >
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Megaphone className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${isUnread ? 'text-white' : 'text-slate-400'}`}>
                            {b.title}
                          </p>
                          {isUnread && <span className="shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-0.5" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{b.body}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(b.created_at)}</p>
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

      {/* Detail modal for selected broadcast */}
      {selected && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {selected.image_url && !selected.video_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image_url} alt={selected.title} className="w-full h-52 object-cover" />
            )}
            {selected.video_url && (
              <video src={selected.video_url} controls className="w-full max-h-56 object-cover bg-black" />
            )}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Megaphone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Annonce</p>
                    <h2 className="font-bold text-slate-900 text-lg leading-tight">{selected.title}</h2>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              {selected.video_url && !/\.(mp4|webm|ogg)$/i.test(selected.video_url) && (
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-medium hover:underline">
                  <Video className="h-4 w-4" /> Voir la vidéo
                </a>
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end">
              <button onClick={() => setSelected(null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:shadow-md transition-all">
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
