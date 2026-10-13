'use client'

import { useEffect, useRef, useState } from 'react'
import { decodeProgram, type LinkProgram } from '@/lib/patient-link-codec'
import s from './patient-app.module.css'

/**
 * Reçoit un programme sans passer par le lien du navigateur : utile sur
 * iPhone, où l'appli installée ne partage pas ses données avec Safari.
 * Le patient colle le lien reçu ou scanne le QR code de sa fiche.
 */
export default function UpdateProgram({ onDecoded, onTransfer }: {
  onDecoded: (program: LinkProgram) => string
  /** Suivi copié depuis Safari (iPhone) : accepté aussi dans ce champ. */
  onTransfer?: (text: string) => string | null
}) {
  const [mode, setMode] = useState<null | 'paste' | 'scan'>(null)
  const [text, setText] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const tryDecode = (value: string): boolean => {
    const transferred = onTransfer?.(value)
    if (transferred) { setMessage(transferred); setMode(null); setText(''); return true }
    const hash = value.includes('#') ? value.slice(value.indexOf('#') + 1) : value
    const program = decodeProgram(hash.trim())
    if (!program) return false
    setMessage(onDecoded(program))
    setMode(null)
    setText('')
    return true
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {mode === null && (
        <div className={s.row}>
          <button type="button" className={`${s.btn} ${s.ghost}`} onClick={() => { setMessage(null); setMode('scan') }}>Scanner le QR code</button>
          <button type="button" className={`${s.btn} ${s.ghost}`} onClick={() => { setMessage(null); setMode('paste') }}>Coller le lien</button>
        </div>
      )}
      {mode === 'paste' && (
        <>
          <textarea className={s.field} rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Collez ici le lien reçu par email ou SMS" aria-label="Lien du programme" />
          <div className={s.row}>
            <button type="button" className={`${s.btn} ${s.ghost}`} onClick={() => setMode(null)}>Annuler</button>
            <button type="button" className={s.btn} disabled={!text.trim()} onClick={() => { if (!tryDecode(text)) setMessage('Ce lien n’est pas reconnu. Copiez-le en entier depuis le message de votre praticien.') }}>Valider</button>
          </div>
        </>
      )}
      {mode === 'scan' && <Scanner onText={tryDecode} onCancel={() => setMode(null)} onError={m => { setMessage(m); setMode(null) }} />}
      {message && <p className={`${s.advice} ${s.ok}`} role="status">{message}</p>}
    </div>
  )
}

function Scanner({ onText, onCancel, onError }: { onText: (t: string) => boolean; onCancel: () => void; onError: (m: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const handlers = useRef({ onText, onError })
  handlers.current = { onText, onError }

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setInterval> | null = null
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    Promise.all([
      import('jsqr'),
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
    ]).then(([{ default: jsQR }, s]) => {
      if (stopped) { s.getTracks().forEach(t => t.stop()); return }
      stream = s
      const v = video.current
      if (!v) return
      v.srcObject = s
      v.play().catch(() => {})
      timer = setInterval(() => {
        if (!ctx || v.readyState < 2) return
        canvas.width = v.videoWidth
        canvas.height = v.videoHeight
        ctx.drawImage(v, 0, 0)
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
        if (hit?.data && handlers.current.onText(hit.data)) { if (timer) clearInterval(timer) }
      }, 300)
    }).catch(() => handlers.current.onError('Impossible d’ouvrir l’appareil photo. Autorisez-le dans les réglages, ou collez le lien.'))
    return () => {
      stopped = true
      if (timer) clearInterval(timer)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <>
      <div className={s.scanner}><video ref={video} muted playsInline /></div>
      <p className={`${s.small} ${s.muted}`}>Visez le QR code imprimé sur votre fiche d’exercices.</p>
      <button type="button" className={`${s.btn} ${s.ghost}`} onClick={onCancel}>Annuler</button>
    </>
  )
}
