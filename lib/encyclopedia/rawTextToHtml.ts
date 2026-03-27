const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const isTableSeparator = (line: string) => /^[:\-\s|]+$/.test(line) && line.includes('-')

const parseTableRow = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null
  return trimmed
    .slice(1, -1)
    .split('|')
    .map(cell => escapeHtml(cell.trim()))
}

export function rawTextToHtml(input: string) {
  const lines = input.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []

  let paragraph: string[] = []
  let unorderedList: string[] = []
  let orderedList: string[] = []
  let tableRows: string[][] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    output.push(`<p>${paragraph.join('<br>')}</p>`)
    paragraph = []
  }

  const flushUnorderedList = () => {
    if (unorderedList.length === 0) return
    output.push(`<ul>${unorderedList.map(item => `<li>${item}</li>`).join('')}</ul>`)
    unorderedList = []
  }

  const flushOrderedList = () => {
    if (orderedList.length === 0) return
    output.push(`<ol>${orderedList.map(item => `<li>${item}</li>`).join('')}</ol>`)
    orderedList = []
  }

  const flushTable = () => {
    if (tableRows.length === 0) return
    const [header, ...body] = tableRows
    const thead = `<thead><tr>${header.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>`
    const tbody = body.length
      ? `<tbody>${body
          .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
          .join('')}</tbody>`
      : ''
    output.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`)
    tableRows = []
  }

  const flushAll = () => {
    flushParagraph()
    flushUnorderedList()
    flushOrderedList()
    flushTable()
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushAll()
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushAll()
      const level = headingMatch[1].length + 1
      output.push(`<h${level}>${escapeHtml(headingMatch[2].trim())}</h${level}>`)
      continue
    }

    const calloutMatch = line.match(/^:::(info|warning|key|danger)\s+(.+)$/i)
    if (calloutMatch) {
      flushAll()
      output.push(`<div class="callout ${calloutMatch[1].toLowerCase()}">${escapeHtml(calloutMatch[2].trim())}</div>`)
      continue
    }

    const tableRow = parseTableRow(line)
    if (tableRow) {
      flushParagraph()
      flushUnorderedList()
      flushOrderedList()
      if (!isTableSeparator(line)) tableRows.push(tableRow)
      continue
    }
    if (tableRows.length > 0) flushTable()

    const ulMatch = line.match(/^[-*]\s+(.+)$/)
    if (ulMatch) {
      flushParagraph()
      flushOrderedList()
      unorderedList.push(escapeHtml(ulMatch[1].trim()))
      continue
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      flushParagraph()
      flushUnorderedList()
      orderedList.push(escapeHtml(olMatch[1].trim()))
      continue
    }

    paragraph.push(escapeHtml(line))
  }

  flushAll()
  return output.join('\n')
}
