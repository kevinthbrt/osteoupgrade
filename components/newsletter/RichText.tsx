'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bold, Italic, Link2, List, Underline } from 'lucide-react'
import { isSafeUrl } from '@/lib/newsletter'

/**
 * Champ de texte enrichi de la newsletter.
 *
 * Le navigateur produit du HTML libre dans un champ éditable : des `<span>`
 * avec des styles, des `<font>`, du collage venu de Word. On ne stocke jamais
 * cela. À chaque frappe, le contenu est reparcouru et réécrit dans un format
 * volontairement pauvre : gras, italique, souligné, lien, liste, retour à la
 * ligne, et rien d'autre. C'est ce format que `lib/newsletter.ts` transforme en
 * email, et c'est aussi ce qui garantit qu'un copier-coller ne déforme pas la
 * mise en page.
 */

const BLOCK_TAGS = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'UL', 'OL'])

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

function inlineOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent || '')
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement

  // Le contenu d'un script ou d'une feuille de style ne doit pas ressortir en
  // texte : un collage depuis une page web en embarque sans qu'on le voie.
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return ''

  const inner = Array.from(el.childNodes).map(inlineOf).join('')

  switch (el.tagName) {
    case 'BR':
      return '<br>'
    case 'B':
    case 'STRONG':
      return inner ? `<strong>${inner}</strong>` : ''
    case 'I':
    case 'EM':
      return inner ? `<em>${inner}</em>` : ''
    case 'U':
      return inner ? `<u>${inner}</u>` : ''
    case 'A': {
      const href = el.getAttribute('href') || ''
      return isSafeUrl(href) ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner
    }
    case 'LI':
      return `<li>${inner}</li>`
    default:
      return inner
  }
}

function listOf(el: HTMLElement): string {
  const items = Array.from(el.children)
    .filter((child) => child.tagName === 'LI')
    .map((li) => `<li>${Array.from(li.childNodes).map(inlineOf).join('')}</li>`)
    .filter((item) => item !== '<li></li>')
    .join('')
  return items ? `<ul>${items}</ul>` : ''
}

/**
 * Le champ est relu ligne par ligne. Une liste est isolée par une ligne vide de
 * chaque côté pour former son propre paragraphe à l'arrivée ; deux entrées
 * consécutives font un saut de paragraphe, une seule un simple retour à la ligne.
 */
export function serializeEditable(root: HTMLElement): string {
  const lines: string[] = []
  let current = ''

  const flush = () => {
    // Un bloc qui ne contient qu'un `<br>` est la ligne vide que produit la
    // touche Entrée : elle vaut une séparation, pas un retour à la ligne de plus.
    lines.push(current === '<br>' ? '' : current)
    current = ''
  }

  // Les blocs s'imbriquent : selon le navigateur et la façon dont le texte a
  // été collé, une ligne peut être un `<div>` dans un `<div>`. On descend donc
  // dans l'arbre plutôt que de ne lire que le premier niveau, sinon deux lignes
  // imbriquées seraient recollées en une seule.
  const walk = (parent: Node) => {
    for (const child of Array.from(parent.childNodes)) {
      const isElement = child.nodeType === Node.ELEMENT_NODE
      const tag = isElement ? (child as HTMLElement).tagName : ''

      if (isElement && (tag === 'UL' || tag === 'OL')) {
        if (current) flush()
        const list = listOf(child as HTMLElement)
        if (list) lines.push('', list, '')
        continue
      }

      if (isElement && BLOCK_TAGS.has(tag)) {
        if (current) flush()
        walk(child)
        flush()
        continue
      }

      current += inlineOf(child)
    }
  }

  walk(root)
  if (current) flush()

  return lines
    .join('<br>')
    .replace(/^(?:<br>)+/, '')
    .replace(/(?:<br>)+$/, '')
}

interface RichTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Couleur du texte dans l'éditeur, pour coller au rendu du bloc. */
  tone?: 'default' | 'lavender' | 'quote'
  className?: string
  onFocusChange?: (focused: boolean) => void
}

export default function RichText({
  value,
  onChange,
  placeholder = 'Écrivez ici…',
  tone = 'default',
  className = '',
  onFocusChange
}: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef<string>(value)
  const [focused, setFocused] = useState(false)
  const [empty, setEmpty] = useState(!value)

  // On ne réinjecte le HTML que s'il vient d'ailleurs (chargement d'un
  // brouillon, insertion d'une balise) : le faire à chaque frappe replacerait
  // le curseur au début.
  useEffect(() => {
    if (!ref.current) return
    if (value === lastEmitted.current) return
    ref.current.innerHTML = value
    lastEmitted.current = value
    setEmpty(!ref.current.textContent?.trim())
  }, [value])

  useEffect(() => {
    if (ref.current && !ref.current.innerHTML) {
      ref.current.innerHTML = value
      setEmpty(!ref.current.textContent?.trim())
    }
    // Au montage uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = useCallback(() => {
    if (!ref.current) return
    const serialized = serializeEditable(ref.current)
    lastEmitted.current = serialized
    setEmpty(!ref.current.textContent?.trim())
    onChange(serialized)
  }, [onChange])

  /**
   * `execCommand` est officiellement déprécié mais reste la seule mise en forme
   * qui fonctionne partout sans embarquer un éditeur entier. Le résultat est de
   * toute façon réécrit par `serializeEditable`, donc ce que produisent les
   * navigateurs entre eux n'a pas d'importance.
   */
  const apply = (command: string, argument?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, argument)
    emit()
  }

  const addLink = () => {
    const selection = window.getSelection()
    const selected = selection?.toString() || ''
    const url = window.prompt('Adresse du lien (elle doit commencer par https://) :', 'https://')
    if (!url) return
    if (!isSafeUrl(url)) {
      window.alert('Ce lien ne peut pas être utilisé. Utilisez une adresse commençant par https:// ou mailto:.')
      return
    }
    if (selected) {
      apply('createLink', url)
    } else {
      const label = window.prompt('Texte du lien :', url) || url
      apply('insertHTML', `<a href="${escapeAttr(url)}">${escapeText(label)}</a>`)
    }
  }

  // Le collage arrive en texte brut : c'est la façon la plus simple d'éviter
  // qu'un copier-coller depuis Word importe ses polices et ses couleurs.
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    emit()
  }

  const toneClass =
    tone === 'lavender'
      ? 'text-violet-900'
      : tone === 'quote'
      ? 'text-slate-600 italic'
      : 'text-slate-700'

  return (
    <div className="relative">
      {focused && (
        <div className="absolute -top-11 left-0 z-20 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <ToolbarButton label="Gras" onClick={() => apply('bold')}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italique" onClick={() => apply('italic')}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Souligné" onClick={() => apply('underline')}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Liste à puces" onClick={() => apply('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Lien" onClick={addLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      {empty && !focused && (
        <span className="pointer-events-none absolute left-0 top-0 text-slate-400">{placeholder}</span>
      )}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={() => {
          emit()
          setFocused(false)
          onFocusChange?.(false)
        }}
        onFocus={() => {
          setFocused(true)
          onFocusChange?.(true)
        }}
        onPaste={handlePaste}
        // Le survol de la zone de texte ne doit pas déclencher le glisser du bloc.
        draggable={false}
        onDragStart={(event) => event.stopPropagation()}
        className={`newsletter-richtext outline-none ${toneClass} ${className}`}
      />
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // `onMouseDown` plutôt que `onClick` : le clic ferait perdre la sélection
      // avant que la commande ne s'applique.
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
    >
      {children}
    </button>
  )
}
