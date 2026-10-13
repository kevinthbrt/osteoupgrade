'use client'

import type { LinkExercise } from '@/lib/patient-link-codec'
import s from './patient-app.module.css'
import type { Library } from './shared'

export function PainScale({ value, onPick, label }: { value: number | null | undefined; onPick: (v: number) => void; label: string }) {
  return (
    <>
      <div className={s.scale} role="group" aria-label={label}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} type="button" aria-pressed={value === n} onClick={() => onPick(n)}>{n}</button>
        ))}
      </div>
      <div className={s.scaleEnds}><span>Aucune</span><span>Pire imaginable</span></div>
    </>
  )
}

export function Thumb({ ex, library, className }: { ex: LinkExercise; library: Library; className?: string }) {
  const url = library[ex.e]?.illustration_url
  return (
    <div className={className ?? s.thumb}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{ex.n.charAt(0)}</span>}
    </div>
  )
}

export function doseText(ex: LinkExercise): string {
  const parts: string[] = []
  if (ex.s != null && ex.r) parts.push(`${ex.s} × ${ex.r}`)
  else if (ex.s != null) parts.push(`${ex.s} séries`)
  else if (ex.r) parts.push(ex.r)
  if (ex.h) parts.push(`maintien ${ex.h} s`)
  if (ex.p) parts.push(`repos ${ex.p} s`)
  return parts.join(', ')
}

