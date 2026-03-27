#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`
  const value = args.find(a => a.startsWith(prefix))
  return value ? value.slice(prefix.length) : fallback
}

const hasArg = (name) => args.includes(`--${name}`)

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const usage = `\nUsage:\n  node scripts/encyclopedia/build-entry-html.mjs \\\n    --input=chapter-fragment.html \\\n    --output=chapter-final.html \\\n    --title="Douleurs référées" \\\n    --eyebrow="Sémiologie cervicale · Chapitre 2" \\\n    --subtitle="Résumé du chapitre" \\\n    --tags="Douleur référée,Convergence"\n\nOptions:\n  --template=path/to/template.html (optional)\n  --json=path/to/meta.json (optional, keys: title, eyebrow, subtitle, tags[])\n  --help\n`

if (hasArg('help')) {
  console.log(usage)
  process.exit(0)
}

const input = getArg('input')
const output = getArg('output')
const templateArg = getArg('template')
const jsonArg = getArg('json')

if (!input || !output) {
  console.error('Missing --input or --output.' + usage)
  process.exit(1)
}

const scriptDir = path.dirname(new URL(import.meta.url).pathname)
const defaultTemplate = path.join(scriptDir, 'entry-template.html')
const templatePath = templateArg || defaultTemplate

let jsonMeta = {}
if (jsonArg) {
  const jsonText = await fs.readFile(jsonArg, 'utf8')
  jsonMeta = JSON.parse(jsonText)
}

const title = getArg('title', jsonMeta.title || 'Chapitre encyclopédie')
const eyebrow = getArg('eyebrow', jsonMeta.eyebrow || '')
const subtitle = getArg('subtitle', jsonMeta.subtitle || '')

const tagsCsv = getArg('tags', '')
const tagsFromArg = tagsCsv
  ? tagsCsv.split(',').map(t => t.trim()).filter(Boolean)
  : []
const tags = tagsFromArg.length > 0 ? tagsFromArg : (jsonMeta.tags || [])

const [templateRaw, fragmentHtml] = await Promise.all([
  fs.readFile(templatePath, 'utf8'),
  fs.readFile(input, 'utf8'),
])

const tagsHtml = tags.map(tag => `<span class="hero-tag">${escapeHtml(tag)}</span>`).join('')

const finalHtml = templateRaw
  .replaceAll('{{TITLE}}', escapeHtml(title))
  .replaceAll('{{EYEBROW}}', escapeHtml(eyebrow))
  .replaceAll('{{SUBTITLE}}', escapeHtml(subtitle))
  .replaceAll('{{TAGS_HTML}}', tagsHtml)
  .replaceAll('{{CONTENT_HTML}}', fragmentHtml)

await fs.writeFile(output, finalHtml, 'utf8')

console.log(`✅ HTML generated: ${output}`)
console.log(`Template: ${templatePath}`)
console.log(`Source fragment: ${input}`)
