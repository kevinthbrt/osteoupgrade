'use client'

import React, { useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Heading2,
  Image as ImageIcon,
  Loader2,
  Minus,
  MousePointerClick,
  MoveVertical,
  Quote,
  Sparkles,
  Trash2,
  Type
} from 'lucide-react'
import RichText from './RichText'
import {
  BLOCK_CATALOG,
  createBlock,
  newBlockId,
  type BlockType,
  type NewsletterBlock,
  type NewsletterDoc
} from '@/lib/newsletter'

/**
 * Éditeur de newsletter par blocs.
 *
 * Le principe : la page au centre EST l'email. On y écrit directement, et les
 * blocs se déposent depuis la palette de gauche par glisser-déposer. Chaque
 * geste au glisser a son équivalent au clic (ajouter, monter, descendre), parce
 * qu'un glisser-déposer ne fonctionne ni au clavier ni sur un écran tactile.
 */

const DRAG_NEW = 'application/x-newsletter-new'
const DRAG_MOVE = 'application/x-newsletter-move'

const PALETTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  heading: Heading2,
  text: Type,
  image: ImageIcon,
  button: MousePointerClick,
  panel: Sparkles,
  quote: Quote,
  divider: Minus,
  space: MoveVertical
}

interface EditorProps {
  doc: NewsletterDoc
  onChange: (doc: NewsletterDoc) => void
  disabled?: boolean
}

export default function NewsletterEditor({ doc, onChange, disabled = false }: EditorProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const draggingId = useRef<string | null>(null)

  const setBlocks = (blocks: NewsletterBlock[]) => onChange({ ...doc, blocks })

  const updateBlock = (id: string, patch: Partial<NewsletterBlock>) => {
    setBlocks(doc.blocks.map((block) => (block.id === id ? ({ ...block, ...patch } as NewsletterBlock) : block)))
  }

  const insertBlock = (block: NewsletterBlock, index: number) => {
    const blocks = [...doc.blocks]
    blocks.splice(Math.max(0, Math.min(index, blocks.length)), 0, block)
    setBlocks(blocks)
    setSelectedId(block.id)
  }

  const moveBlock = (id: string, targetIndex: number) => {
    const from = doc.blocks.findIndex((block) => block.id === id)
    if (from === -1) return
    const blocks = [...doc.blocks]
    const [moved] = blocks.splice(from, 1)
    const to = from < targetIndex ? targetIndex - 1 : targetIndex
    blocks.splice(Math.max(0, Math.min(to, blocks.length)), 0, moved)
    setBlocks(blocks)
  }

  const shiftBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= doc.blocks.length) return
    const blocks = [...doc.blocks]
    ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
    setBlocks(blocks)
  }

  const duplicateBlock = (index: number) => {
    const copy = { ...doc.blocks[index], id: newBlockId() } as NewsletterBlock
    insertBlock(copy, index + 1)
  }

  const removeBlock = (id: string) => {
    setBlocks(doc.blocks.filter((block) => block.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleDrop = (event: React.DragEvent, index: number) => {
    event.preventDefault()
    setDropIndex(null)
    if (disabled) return

    const newType = event.dataTransfer.getData(DRAG_NEW) as BlockType
    if (newType) {
      insertBlock(createBlock(newType), index)
      return
    }
    const movedId = event.dataTransfer.getData(DRAG_MOVE) || draggingId.current
    if (movedId) moveBlock(movedId, index)
    draggingId.current = null
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Palette */}
      <aside className="lg:sticky lg:top-6 lg:w-56 lg:flex-shrink-0">
        <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lg backdrop-blur-2xl">
          <p className="mb-1 text-sm font-bold text-slate-900">Les blocs</p>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            Faites glisser un bloc sur la page, ou cliquez pour l’ajouter à la fin.
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {BLOCK_CATALOG.map((item) => {
              const Icon = PALETTE_ICONS[item.icon] || Type
              return (
                <button
                  key={item.type}
                  type="button"
                  draggable={!disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(DRAG_NEW, item.type)
                    event.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => !disabled && insertBlock(createBlock(item.type), doc.blocks.length)}
                  disabled={disabled}
                  title={item.help}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50 lg:cursor-grab lg:active:cursor-grabbing"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-violet-500" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* La page : ce que le lecteur verra */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[640px] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Bandeau */}
          <div
            className="px-8 py-9 text-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
          >
            <input
              value={doc.header.emoji}
              onChange={(event) => onChange({ ...doc, header: { ...doc.header, emoji: event.target.value.slice(0, 4) } })}
              disabled={disabled}
              aria-label="Emoji du bandeau"
              className="w-16 rounded-lg bg-white/10 text-center text-[38px] leading-none text-white outline-none transition focus:bg-white/20"
            />
            <input
              value={doc.header.title}
              onChange={(event) => onChange({ ...doc, header: { ...doc.header, title: event.target.value } })}
              disabled={disabled}
              placeholder="Titre du bandeau"
              aria-label="Titre du bandeau"
              className="mt-2 w-full rounded-lg bg-transparent text-center text-2xl font-bold text-white placeholder-white/50 outline-none transition focus:bg-white/10"
            />
            <input
              value={doc.header.subtitle}
              onChange={(event) => onChange({ ...doc, header: { ...doc.header, subtitle: event.target.value } })}
              disabled={disabled}
              placeholder="Sous-titre"
              aria-label="Sous-titre du bandeau"
              className="mt-1 w-full rounded-lg bg-transparent text-center text-sm text-white/85 placeholder-white/40 outline-none transition focus:bg-white/10"
            />
          </div>

          {/* Corps */}
          <div className="px-8 py-9">
            <DropZone
              active={dropIndex === 0}
              first
              empty={doc.blocks.length === 0}
              onDragOver={() => setDropIndex(0)}
              onDragLeave={() => setDropIndex((current) => (current === 0 ? null : current))}
              onDrop={(event) => handleDrop(event, 0)}
            />

            {doc.blocks.map((block, index) => (
              <React.Fragment key={block.id}>
                <BlockShell
                  index={index}
                  total={doc.blocks.length}
                  selected={selectedId === block.id}
                  disabled={disabled}
                  onSelect={() => setSelectedId(block.id)}
                  onDragStart={(event) => {
                    draggingId.current = block.id
                    event.dataTransfer.setData(DRAG_MOVE, block.id)
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => {
                    draggingId.current = null
                    setDropIndex(null)
                  }}
                  onUp={() => shiftBlock(index, -1)}
                  onDown={() => shiftBlock(index, 1)}
                  onDuplicate={() => duplicateBlock(index)}
                  onRemove={() => removeBlock(block.id)}
                >
                  <BlockBody
                    block={block}
                    disabled={disabled}
                    selected={selectedId === block.id}
                    onChange={(patch) => updateBlock(block.id, patch)}
                  />
                </BlockShell>

                <DropZone
                  active={dropIndex === index + 1}
                  onDragOver={() => setDropIndex(index + 1)}
                  onDragLeave={() => setDropIndex((current) => (current === index + 1 ? null : current))}
                  onDrop={(event) => handleDrop(event, index + 1)}
                />
              </React.Fragment>
            ))}

            <p className="mt-6 text-sm leading-relaxed text-slate-500">
              À très vite,
              <br />
              <strong className="text-slate-800">L’équipe OsteoUpgrade × MyOsteoflow</strong>
            </p>
          </div>

          {/* Pied de page */}
          <div className="bg-slate-50 px-8 py-5 text-center">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
            <p className="mt-2 text-[11px] text-slate-400">
              Le lien de désinscription est ajouté automatiquement à l’envoi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Zone de dépôt ───────────────────────────────────────────────────────────

function DropZone({
  active,
  first,
  empty,
  onDragOver,
  onDragLeave,
  onDrop
}: {
  active: boolean
  first?: boolean
  empty?: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent) => void
}) {
  if (empty) {
    return (
      <div
        onDragOver={(event) => {
          event.preventDefault()
          onDragOver()
        }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center text-sm transition ${
          active ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-400'
        }`}
      >
        Déposez ici votre premier bloc, ou cliquez sur un bloc dans la colonne de gauche.
      </div>
    )
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver()
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative ${first ? 'h-3' : 'h-4'}`}
    >
      <div
        className={`absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition ${
          active ? 'bg-violet-500' : 'bg-transparent'
        }`}
      />
    </div>
  )
}

// ── Cadre autour d'un bloc ──────────────────────────────────────────────────

function BlockShell({
  index,
  total,
  selected,
  disabled,
  children,
  onSelect,
  onDragStart,
  onDragEnd,
  onUp,
  onDown,
  onDuplicate,
  onRemove
}: {
  index: number
  total: number
  selected: boolean
  disabled: boolean
  children: React.ReactNode
  onSelect: () => void
  onDragStart: (event: React.DragEvent) => void
  onDragEnd: () => void
  onUp: () => void
  onDown: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  return (
    <div
      onMouseDown={onSelect}
      onFocus={onSelect}
      className={`group relative rounded-xl transition ${
        selected ? 'ring-2 ring-violet-300' : 'hover:ring-1 hover:ring-slate-200'
      }`}
    >
      {!disabled && (
        <>
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Glisser pour déplacer ce bloc"
            className="absolute -left-9 top-1 hidden h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing group-hover:flex lg:flex lg:opacity-0 lg:group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="absolute -top-3 right-1 z-10 hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex">
            <ShellButton label="Monter" onClick={onUp} disabled={index === 0}>
              <ArrowUp className="h-3.5 w-3.5" />
            </ShellButton>
            <ShellButton label="Descendre" onClick={onDown} disabled={index === total - 1}>
              <ArrowDown className="h-3.5 w-3.5" />
            </ShellButton>
            <ShellButton label="Dupliquer" onClick={onDuplicate}>
              <Copy className="h-3.5 w-3.5" />
            </ShellButton>
            <ShellButton label="Supprimer" onClick={onRemove} danger>
              <Trash2 className="h-3.5 w-3.5" />
            </ShellButton>
          </div>
        </>
      )}

      <div className="px-1 py-0.5">{children}</div>
    </div>
  )
}

function ShellButton({
  label,
  onClick,
  disabled,
  danger,
  children
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition disabled:opacity-30 ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

// ── Contenu d'un bloc ───────────────────────────────────────────────────────

function BlockBody({
  block,
  selected,
  disabled,
  onChange
}: {
  block: NewsletterBlock
  selected: boolean
  disabled: boolean
  onChange: (patch: Partial<NewsletterBlock>) => void
}) {
  switch (block.type) {
    case 'titre':
      return (
        <div>
          <input
            value={block.text}
            onChange={(event) => onChange({ text: event.target.value } as any)}
            disabled={disabled}
            placeholder="Votre titre"
            aria-label="Titre de section"
            className={`mt-5 w-full bg-transparent text-[22px] font-bold leading-snug text-violet-700 placeholder-violet-300 outline-none ${
              block.align === 'center' ? 'text-center' : ''
            }`}
          />
          {selected && !disabled && (
            <Options>
              <AlignChoice value={block.align || 'left'} onChange={(align) => onChange({ align } as any)} />
            </Options>
          )}
        </div>
      )

    case 'texte':
      return (
        <div className="py-1">
          <RichText
            value={block.html}
            onChange={(html) => onChange({ html } as any)}
            placeholder="Écrivez votre paragraphe…"
            className="text-[15px] leading-[1.7] min-h-[28px]"
          />
        </div>
      )

    case 'image':
      return <ImageBlock block={block} selected={selected} disabled={disabled} onChange={onChange} />

    case 'bouton':
      return (
        <div className={`py-3 ${block.align === 'left' ? 'text-left' : 'text-center'}`}>
          <span
            className="inline-block rounded-lg px-8 py-3.5 text-[15px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
          >
            <input
              value={block.label}
              onChange={(event) => onChange({ label: event.target.value } as any)}
              disabled={disabled}
              placeholder="Libellé"
              aria-label="Libellé du bouton"
              size={Math.max(block.label.length || 8, 6)}
              className="bg-transparent text-center font-semibold text-white placeholder-white/60 outline-none"
            />
          </span>
          {selected && !disabled && (
            <Options>
              <Field label="Lien du bouton">
                <input
                  value={block.href}
                  onChange={(event) => onChange({ href: event.target.value } as any)}
                  placeholder="https://www.osteo-upgrade.fr/…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-violet-300"
                />
              </Field>
              <AlignChoice value={block.align || 'center'} onChange={(align) => onChange({ align } as any)} />
            </Options>
          )}
        </div>
      )

    case 'encart':
      return (
        <div className="my-2 rounded-lg bg-violet-50 px-6 py-5">
          <div className="mb-2 flex items-center gap-1.5">
            <input
              value={block.emoji || ''}
              onChange={(event) => onChange({ emoji: event.target.value.slice(0, 4) } as any)}
              disabled={disabled}
              aria-label="Emoji de l’encart"
              className="w-7 bg-transparent text-[15px] outline-none"
            />
            <input
              value={block.title || ''}
              onChange={(event) => onChange({ title: event.target.value } as any)}
              disabled={disabled}
              placeholder="Titre de l’encart (facultatif)"
              aria-label="Titre de l’encart"
              className="flex-1 bg-transparent text-[15px] font-bold text-violet-800 placeholder-violet-300 outline-none"
            />
          </div>
          <RichText
            value={block.html}
            onChange={(html) => onChange({ html } as any)}
            placeholder="Le contenu de l’encart…"
            tone="lavender"
            className="text-[15px] leading-[1.7] min-h-[28px]"
          />
        </div>
      )

    case 'citation':
      return (
        <div className="my-2 border-l-[3px] border-violet-300 py-1 pl-5">
          <RichText
            value={block.html}
            onChange={(html) => onChange({ html } as any)}
            placeholder="La citation…"
            tone="quote"
            className="text-base leading-[1.7] min-h-[28px]"
          />
          <input
            value={block.author || ''}
            onChange={(event) => onChange({ author: event.target.value } as any)}
            disabled={disabled}
            placeholder="Qui l’a dit (facultatif)"
            aria-label="Auteur de la citation"
            className="mt-1 w-full bg-transparent text-[13px] text-slate-400 placeholder-slate-300 outline-none"
          />
        </div>
      )

    case 'separateur':
      return (
        <div className="py-4">
          <div className="border-t border-slate-200" />
        </div>
      )

    case 'espace':
      return (
        <div className="py-1">
          <div
            className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] uppercase tracking-widest text-slate-300"
            style={{ height: block.size === 'small' ? 16 : block.size === 'large' ? 48 : 28 }}
          >
            espace
          </div>
          {selected && !disabled && (
            <Options>
              <Choice
                value={block.size || 'medium'}
                onChange={(size) => onChange({ size } as any)}
                options={[
                  { value: 'small', label: 'Petit' },
                  { value: 'medium', label: 'Moyen' },
                  { value: 'large', label: 'Grand' }
                ]}
              />
            </Options>
          )}
        </div>
      )
  }
}

function ImageBlock({
  block,
  selected,
  disabled,
  onChange
}: {
  block: Extract<NewsletterBlock, { type: 'image' }>
  selected: boolean
  disabled: boolean
  onChange: (patch: Partial<NewsletterBlock>) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/newsletter-image-upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Envoi impossible')
      onChange({ url: data.url, alt: block.alt || file.name.replace(/\.[^.]+$/, '') } as any)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="py-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) upload(file)
          event.target.value = ''
        }}
      />

      {block.url ? (
        <figure className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt || ''}
            className="mx-auto h-auto rounded-lg"
            style={{ maxWidth: block.width === 'small' ? 200 : block.width === 'medium' ? 320 : block.width === 'large' ? 420 : '100%' }}
          />
          {block.caption && <figcaption className="mt-2 text-[13px] text-slate-400">{block.caption}</figcaption>}
        </figure>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-sm text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
          {uploading ? 'Envoi de l’image…' : 'Choisir une illustration (JPG, PNG, WebP, GIF)'}
        </button>
      )}

      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

      {selected && !disabled && (
        <Options>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {block.url ? 'Remplacer l’image' : 'Choisir une image'}
            </button>
            <Choice
              value={block.width || 'full'}
              onChange={(width) => onChange({ width } as any)}
              options={[
                { value: 'full', label: 'Pleine largeur' },
                { value: 'large', label: 'Grande' },
                { value: 'medium', label: 'Moyenne' },
                { value: 'small', label: 'Petite' }
              ]}
            />
          </div>
          <Field label="Légende (facultative)">
            <input
              value={block.caption || ''}
              onChange={(event) => onChange({ caption: event.target.value } as any)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-violet-300"
            />
          </Field>
          <Field label="Texte de remplacement (lu si l’image ne s’affiche pas)">
            <input
              value={block.alt || ''}
              onChange={(event) => onChange({ alt: event.target.value } as any)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-violet-300"
            />
          </Field>
          <Field label="Lien au clic (facultatif)">
            <input
              value={block.href || ''}
              onChange={(event) => onChange({ href: event.target.value } as any)}
              placeholder="https://…"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-violet-300"
            />
          </Field>
        </Options>
      )}
    </div>
  )
}

// ── Réglages d'un bloc ──────────────────────────────────────────────────────

function Options({ children }: { children: React.ReactNode }) {
  return (
    <div
      onMouseDown={(event) => event.stopPropagation()}
      className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
    >
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Choice<T extends string>({
  value,
  onChange,
  options
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition ${
            value === option.value ? 'bg-violet-100 text-violet-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function AlignChoice({ value, onChange }: { value: string; onChange: (value: 'left' | 'center') => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        type="button"
        title="Aligner à gauche"
        onClick={() => onChange('left')}
        className={`rounded-md px-3 py-1 transition ${value === 'left' ? 'bg-violet-100 text-violet-800' : 'text-slate-400'}`}
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Centrer"
        onClick={() => onChange('center')}
        className={`rounded-md px-3 py-1 transition ${value === 'center' ? 'bg-violet-100 text-violet-800' : 'text-slate-400'}`}
      >
        <AlignCenter className="h-4 w-4" />
      </button>
    </div>
  )
}
