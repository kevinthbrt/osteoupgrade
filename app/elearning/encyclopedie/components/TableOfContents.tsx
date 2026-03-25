'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { List, ChevronUp, ChevronDown } from 'lucide-react'

type TocItem = {
  id: string
  text: string
  level: number // 2 for h2, 3 for h3
}

/**
 * Parse HTML string to extract h2/h3 headings and inject IDs.
 * Returns the modified HTML and the list of TOC items.
 */
export function parseHeadingsFromHtml(html: string): {
  processedHtml: string
  tocItems: TocItem[]
} {
  const tocItems: TocItem[] = []
  const usedIds = new Set<string>()

  const processedHtml = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, content: string) => {
      const level = parseInt(tag.charAt(1))
      // Strip HTML tags from content to get plain text
      const text = content.replace(/<[^>]*>/g, '').trim()

      // Generate a slug from the text
      let baseId = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Ensure unique id
      let id = baseId
      let counter = 1
      while (usedIds.has(id)) {
        id = `${baseId}-${counter++}`
      }
      usedIds.add(id)

      tocItems.push({ id, text, level })

      // Check if there's already an id attribute
      if (/\bid\s*=/.test(attrs)) {
        // Replace existing id
        const newAttrs = attrs.replace(/id\s*=\s*["'][^"']*["']/, `id="${id}"`)
        return `<${tag}${newAttrs}>${content}</${tag}>`
      }
      return `<${tag} id="${id}"${attrs}>${content}</${tag}>`
    }
  )

  return { processedHtml, tocItems }
}

type TableOfContentsProps = {
  items: TocItem[]
  className?: string
}

export default function TableOfContents({ items, className = '' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    // Use IntersectionObserver to track which heading is in view
    const headingElements = items
      .map(item => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (headingElements.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    headingElements.forEach(el => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [items])

  if (items.length === 0) return null

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      setMobileOpen(false)
    }
  }

  const navContent = (
    <nav className="space-y-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={`
            block w-full text-left text-sm transition-all duration-200
            ${item.level === 3 ? 'pl-4' : 'pl-0'}
            ${
              activeId === item.id
                ? 'text-purple-700 font-semibold border-l-2 border-purple-600 pl-3'
                : 'text-slate-500 hover:text-slate-800 border-l-2 border-transparent pl-3'
            }
            py-1.5 leading-snug
          `}
        >
          {item.text}
        </button>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <div className={`hidden lg:block ${className}`}>
        <div className="sticky top-24">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <List className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Sommaire
              </span>
            </div>
            {navContent}
          </div>
        </div>
      </div>

      {/* Mobile: floating button + dropdown */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        {mobileOpen && (
          <div className="absolute bottom-14 right-0 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl p-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <List className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Sommaire
              </span>
            </div>
            {navContent}
          </div>
        )}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition"
          aria-label="Sommaire"
        >
          {mobileOpen ? <ChevronDown className="h-5 w-5" /> : <List className="h-5 w-5" />}
        </button>
      </div>
    </>
  )
}
