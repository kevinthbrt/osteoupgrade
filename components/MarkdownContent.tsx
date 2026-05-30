'use client'

import React from 'react'

interface Props {
  content: string
  className?: string
}

// Lightweight markdown renderer — no external dependency.
// Supports: # headings, **bold**, *italic*, ~~strike~~, - lists, 1. numbered lists, --- hr, > blockquotes, blank-line paragraphs.
export function MarkdownContent({ content, className = '' }: Props) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line
    if (line.trim() === '') { i++; continue }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-4 border-slate-200" />)
      i++; continue
    }

    // Headings
    const h1 = line.match(/^# (.+)/)
    if (h1) { elements.push(<h1 key={i} className="text-2xl font-bold text-slate-900 mt-6 mb-3 leading-tight">{inlineRender(h1[1])}</h1>); i++; continue }
    const h2 = line.match(/^## (.+)/)
    if (h2) { elements.push(<h2 key={i} className="text-xl font-bold text-slate-800 mt-5 mb-2 leading-tight">{inlineRender(h2[1])}</h2>); i++; continue }
    const h3 = line.match(/^### (.+)/)
    if (h3) { elements.push(<h3 key={i} className="text-lg font-semibold text-slate-800 mt-4 mb-1.5">{inlineRender(h3[1])}</h3>); i++; continue }
    const h4 = line.match(/^#### (.+)/)
    if (h4) { elements.push(<h4 key={i} className="text-base font-semibold text-slate-700 mt-3 mb-1">{inlineRender(h4[1])}</h4>); i++; continue }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={i} className="border-l-4 border-emerald-400 pl-4 py-1 my-3 bg-emerald-50/60 rounded-r-lg text-slate-700 italic">
          {quoteLines.map((l, j) => <p key={j}>{inlineRender(l)}</p>)}
        </blockquote>
      )
      continue
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={i} className="my-3 space-y-1 list-none pl-0">
          {items.map((it, j) => (
            <li key={j} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{inlineRender(it)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={i} className="my-3 space-y-1 list-none pl-0">
          {items.map((it, j) => (
            <li key={j} className="flex items-start gap-2.5 text-slate-700">
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">{j + 1}</span>
              <span>{inlineRender(it)}</span>
            </li>
          ))}
        </ol>
      )
      num; continue
    }

    // Regular paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,4} /.test(lines[i]) &&
      !/^[-*+] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^> /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i])
      i++
    }

    if (paraLines.length > 0) {
      elements.push(
        <p key={i} className="text-slate-700 leading-relaxed my-2">
          {paraLines.map((l, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {inlineRender(l)}
            </React.Fragment>
          ))}
        </p>
      )
    }
  }

  return <div className={`markdown-content ${className}`}>{elements}</div>
}

// Render inline markdown: **bold**, *italic*, ~~strike~~, `code`, [text](url)
function inlineRender(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    // Italic
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
    // Strikethrough
    const strikeMatch = remaining.match(/~~(.+?)~~/)
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/)

    // Find the earliest match
    const candidates = [
      boldMatch && { match: boldMatch, tag: 'bold' },
      italicMatch && { match: italicMatch, tag: 'italic' },
      strikeMatch && { match: strikeMatch, tag: 'strike' },
      codeMatch && { match: codeMatch, tag: 'code' },
    ].filter(Boolean) as Array<{ match: RegExpMatchArray; tag: string }>

    if (candidates.length === 0) {
      parts.push(<React.Fragment key={key++}>{remaining}</React.Fragment>)
      break
    }

    const earliest = candidates.reduce((a, b) =>
      (a.match.index ?? Infinity) < (b.match.index ?? Infinity) ? a : b
    )

    const { match, tag } = earliest
    const idx = match.index!

    if (idx > 0) {
      parts.push(<React.Fragment key={key++}>{remaining.slice(0, idx)}</React.Fragment>)
    }

    const inner = match[1]
    if (tag === 'bold') parts.push(<strong key={key++} className="font-semibold text-slate-900">{inner}</strong>)
    else if (tag === 'italic') parts.push(<em key={key++} className="italic">{inner}</em>)
    else if (tag === 'strike') parts.push(<s key={key++} className="line-through text-slate-400">{inner}</s>)
    else if (tag === 'code') parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-slate-100 text-emerald-700 text-[0.85em] font-mono">{inner}</code>)

    remaining = remaining.slice(idx + match[0].length)
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}
