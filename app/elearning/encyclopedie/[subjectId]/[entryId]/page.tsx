'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import FreeContentGate from '@/components/FreeContentGate'
import { extractVimeoId } from '@/lib/vimeo'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Play,
  TestTube2,
  Layers,
  X,
  Info,
  TrendingUp,
  FileText,
} from 'lucide-react'
import TestDetailModal from '@/components/TestDetailModal'

type EntryImage = { url: string; caption?: string }

type Entry = {
  id: string
  subject_id: string
  parent_id: string | null
  title: string
  content_html: string | null
  vimeo_url: string | null
  images: EntryImage[] | null
  order_index: number
  is_free_access: boolean
}

type OrthopedicTest = {
  id: string
  name: string
  category: string
}

type OrthopedicTestCluster = {
  id: string
  name: string
  region: string
}

type FullTest = {
  id: string
  name: string
  description: string
  category: string
  indications: string | null
  video_url: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  interest: string | null
  sources: string | null
}

type FullCluster = {
  id: string
  name: string
  region: string
  description: string | null
  indications: string | null
  interest: string | null
  sources: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  tests: { id: string; name: string; category: string }[]
}

type Subject = {
  id: string
  title: string
  color: string | null
  is_free_access: boolean
}

type BreadcrumbItem = {
  id: string
  title: string
}

export default function EntryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params?.subjectId as string
  const entryId = params?.entryId as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [siblings, setSiblings] = useState<Entry[]>([])
  const [associatedTests, setAssociatedTests] = useState<OrthopedicTest[]>([])
  const [associatedClusters, setAssociatedClusters] = useState<OrthopedicTestCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('free')

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for resize messages from the iframe (sent by ResizeObserver inside)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'iframe-resize' && iframeRef.current) {
        iframeRef.current.style.height = e.data.height + 'px'
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Inject shared design system (CSS + fonts + base JS) into body-fragment HTML
  const buildSrcDoc = (html: string) => {
    // Legacy full HTML document — just add resize observer
    const isLegacyDoc = html.trimStart().startsWith('<!DOCTYPE') || html.trimStart().startsWith('<html')
    if (isLegacyDoc) {
      const legacyScript = `<style>.site-header{position:relative!important;top:auto!important}</style><script>
function sendHeight(){var h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);window.parent.postMessage({type:'iframe-resize',height:h},'*')}
new ResizeObserver(sendHeight).observe(document.documentElement);
document.addEventListener('click',function(e){var a=e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();var id=a.getAttribute('href').slice(1);var el=id?document.getElementById(id):null;if(el)el.scrollIntoView({behavior:'smooth'})});
<\/script>`
      return html.includes('<head>') ? html.replace('<head>', '<head>' + legacyScript) : legacyScript + html
    }

    // Body fragment — wrap with shared design system
    const fonts = `<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">`
    const designCSS = `<style>

  :root {
    --navy: #0f172a;
    --slate: #1e293b;
    --steel: #334155;
    --blue: #2563eb;
    --blue-2: #3b82f6;
    --blue-soft: #dbeafe;
    --blue-pale: #eff6ff;
    --cyan: #06b6d4;
    --cyan-soft: #ecfeff;
    --gray-50: #f8fafc;
    --gray-100: #f1f5f9;
    --gray-150: #eef2f7;
    --gray-200: #e2e8f0;
    --gray-300: #cbd5e1;
    --gray-400: #94a3b8;
    --gray-500: #64748b;
    --gray-600: #475569;
    --warm-white: #fbfdff;
    --surface: rgba(255, 255, 255, 0.92);
    --surface-solid: #ffffff;
    --green: #15803d;
    --green-bg: #f0fdf4;
    --red-flag: #dc2626;
    --red-flag-bg: #fef2f2;
    --warning: #f59e0b;
    --warning-bg: #fffbeb;
    --text-dark: #0f172a;
    --text-mid: #334155;
    --text-light: #64748b;
    --border: #dbe5f0;
    --border-light: #edf2f7;
    --shadow-sm: 0 2px 10px rgba(15, 23, 42, 0.05);
    --shadow-md: 0 8px 30px rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 18px 50px rgba(15, 23, 42, 0.12);
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --header-h: 74px;
    --toc-w-open: 290px;
    --toc-w-closed: 72px;
    --purple: #7c3aed;
    --purple-bg: #f5f3ff;
    --orange: #ea580c;
    --orange-bg: #fff7ed;
    --yellow: #ca8a04;
    --yellow-bg: #fefce8;
    --green-2: #16a34a;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'Crimson Pro', Georgia, serif;
    background: transparent;
    color: var(--text-dark);
    font-size: 17px;
    line-height: 1.75;
  }

  /* ─── HEADER ─── */
  .site-header {
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    padding: 0;
    position: relative;
    z-index: 100;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 8px 30px rgba(2, 8, 23, 0.28);
  }
  .header-inner {
    max-width: 1360px;
    margin: 0 auto;
    padding: 14px 28px;
    min-height: var(--header-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
  }
  .brand-logo {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    border-radius: 10px;
    display: grid; place-items: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 15px;
    color: white;
    letter-spacing: -0.5px;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(37,99,235,0.35);
  }
  .brand-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: white;
    letter-spacing: 0.3px;
  }
  .brand-tag {
    font-size: 11px;
    color: #bfdbfe;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.5px;
    font-weight: 400;
  }
  .header-badge {
    font-family: 'DM Mono', monospace;
    font-size: 10.5px;
    color: #dbeafe;
    border: 1px solid rgba(147,197,253,0.22);
    background: rgba(59,130,246,0.08);
    padding: 6px 10px;
    border-radius: 999px;
    letter-spacing: 0.9px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ─── HERO ─── */
  .hero {
    background:
      radial-gradient(circle at 85% 20%, rgba(6,182,212,0.18), transparent 22%),
      radial-gradient(circle at 15% 40%, rgba(59,130,246,0.12), transparent 18%),
      linear-gradient(135deg, #0f172a 0%, #16253b 45%, #1d4ed8 100%);
    color: white;
    padding: 76px 28px 62px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    inset: auto -80px -100px auto;
    width: 420px; height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 65%);
    pointer-events: none;
  }
  .hero::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--cyan) 0%, var(--blue-2) 45%, transparent 100%);
  }
  .hero-inner {
    max-width: 920px;
    margin: 0 auto;
    position: relative;
  }
  .hero-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2.4px;
    text-transform: uppercase;
    color: #bfdbfe;
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
  }
  .hero-eyebrow::before {
    content: '';
    display: inline-block;
    width: 28px; height: 2px;
    background: var(--cyan);
  }
  .hero h1 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    line-height: 1.08;
    letter-spacing: -1px;
    margin-bottom: 18px;
  }
  .hero h1 em {
    font-style: normal;
    color: #93c5fd;
  }
  .hero-subtitle {
    font-size: 1.08rem;
    color: rgba(255,255,255,0.78);
    font-weight: 300;
    font-style: italic;
    letter-spacing: 0.2px;
    max-width: 780px;
  }

  /* ─── LAYOUT ─── */
  .layout {
    max-width: 1360px;
    margin: 0 auto;
    padding: 0 24px;
    display: grid;
    grid-template-columns: var(--toc-w-open) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    transition: grid-template-columns 0.28s ease;
  }
  .layout.toc-collapsed {
    grid-template-columns: var(--toc-w-closed) minmax(0, 1fr);
  }

  /* ─── NAV / TOC ─── */
  .toc {
    position: relative;
    max-height: calc(100vh - var(--header-h) - 20px);
    overflow: hidden;
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(219,229,240,0.85);
    border-radius: 18px;
    box-shadow: var(--shadow-md);
  }
  .toc-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 240px;
  }
  .toc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 14px 10px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.6));
  }
  .toc-title {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-light);
    white-space: nowrap;
  }
  .toc-toggle {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid rgba(148,163,184,0.25);
    background: white;
    color: var(--navy);
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }
  .toc-toggle:hover {
    border-color: rgba(37,99,235,0.35);
    color: var(--blue);
    transform: translateY(-1px);
  }
  .toc-toggle svg {
    width: 16px;
    height: 16px;
    transition: transform 0.28s ease;
    pointer-events: none;
  }
  .toc-body {
    padding: 10px 0 14px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .toc a {
    display: block;
    padding: 8px 16px;
    margin: 0 10px;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-mid);
    text-decoration: none;
    border-left: 3px solid transparent;
    border-radius: 10px;
    transition: all 0.2s ease;
    line-height: 1.4;
  }
  .toc a:hover,
  .toc a.active {
    color: var(--blue);
    border-left-color: var(--cyan);
    background: linear-gradient(90deg, rgba(219,234,254,0.75), rgba(239,246,255,0.85));
  }

  /* TOC collapsed state */
  .layout.toc-collapsed .toc-title { display: none; }
  .layout.toc-collapsed .toc-body { display: none; }
  .layout.toc-collapsed .toc-head {
    padding: 12px;
    justify-content: center;
    border-bottom: none;
    background: transparent;
  }
  .layout.toc-collapsed .toc-toggle svg {
    transform: rotate(180deg);
  }

  /* ─── MAIN ─── */
  .main-content {
    padding: 48px 0 84px 0;
    min-width: 0;
  }

  /* ─── SECTION ─── */
  .section {
    margin-bottom: 64px;
    animation: fadeUp 0.5s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--border);
  }
  .section-num {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--blue);
    background: var(--blue-pale);
    border: 1px solid rgba(37,99,235,0.18);
    padding: 4px 9px;
    border-radius: 999px;
    white-space: nowrap;
    margin-top: 4px;
    letter-spacing: 0.5px;
  }
  .section h2 {
    font-family: 'Syne', sans-serif;
    font-size: 1.55rem;
    font-weight: 700;
    color: var(--navy);
    letter-spacing: -0.3px;
    line-height: 1.25;
  }

  .section h3 {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--steel);
    margin: 28px 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section h3::before {
    content: '';
    display: inline-block;
    width: 14px; height: 3px;
    background: linear-gradient(90deg, var(--blue), var(--cyan));
    border-radius: 2px;
    flex-shrink: 0;
  }

  p { margin-bottom: 14px; color: var(--text-mid); }
  p:last-child { margin-bottom: 0; }

  /* ─── CARDS ─── */
  .card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(219,229,240,0.95);
    border-radius: var(--radius-md);
    padding: 24px 28px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
    border-color: rgba(147,197,253,0.55);
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  @media (max-width: 860px) { .card-grid { grid-template-columns: 1fr; } }

  .card.accent-blue {
    border-left: 4px solid var(--blue-2);
    background: linear-gradient(180deg, #f8fbff, #eef6ff);
  }
  .card.accent-amber {
    border-left: 4px solid var(--cyan);
    background: linear-gradient(180deg, #f8fdff, #eefcff);
  }
  .card.accent-green {
    border-left: 4px solid var(--green);
    background: var(--green-bg);
  }
  .card.accent-red {
    border-left: 4px solid var(--red-flag);
    background: var(--red-flag-bg);
  }
  .card.full-navy {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-color: rgba(255,255,255,0.08);
    color: white;
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.28);
  }
  .card.full-navy h3,
  .card.full-navy p,
  .card.full-navy li { color: rgba(255,255,255,0.86); }
  .card.full-navy h3::before { background: linear-gradient(90deg, var(--cyan), #93c5fd); }
  .card.full-navy strong { color: #bfdbfe; }

  /* ─── LISTS ─── */
  ul, ol {
    padding-left: 0;
    list-style: none;
    margin-bottom: 14px;
  }
  li {
    padding: 5px 0 5px 24px;
    position: relative;
    color: var(--text-mid);
    line-height: 1.6;
  }
  li::before {
    content: '';
    position: absolute;
    left: 0; top: 13px;
    width: 8px; height: 8px;
    border: 2px solid var(--blue-2);
    border-radius: 50%;
    background: white;
  }
  .card.accent-red li::before { border-color: var(--red-flag); }
  .card.accent-green li::before { border-color: var(--green); }
  .card.accent-amber li::before { border-color: var(--cyan); }
  .card.full-navy li::before { border-color: #93c5fd; background: transparent; }

  ol { counter-reset: item; }
  ol li { padding-left: 32px; }
  ol li::before {
    content: counter(item);
    counter-increment: item;
    width: 22px; height: 22px;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    color: white;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    border-radius: 50%;
    display: grid; place-items: center;
    top: 8px; border: none;
  }

  strong { font-weight: 600; color: var(--text-dark); }
  em { font-style: italic; color: var(--steel); }
  .ref {
    font-family: 'DM Mono', monospace;
    font-size: 10.5px;
    color: var(--blue);
    background: var(--blue-pale);
    border: 1px solid rgba(37,99,235,0.12);
    padding: 1px 5px;
    border-radius: 6px;
    vertical-align: super;
    letter-spacing: 0.2px;
  }

  /* ─── STAT BADGES ─── */
  .stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 16px 0;
  }
  .stat {
    background: rgba(255,255,255,0.95);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 18px;
    min-width: 120px;
    text-align: center;
    flex: 1;
    box-shadow: var(--shadow-sm);
  }
  .stat .val {
    display: block;
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--navy);
    line-height: 1;
    margin-bottom: 4px;
  }
  .stat .lbl {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--text-light);
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  /* ─── CALLOUT ─── */
  .callout {
    display: flex;
    gap: 16px;
    padding: 18px 22px;
    background: linear-gradient(180deg, #f7fbff, #eff6ff);
    border-radius: 14px;
    border: 1px solid var(--border);
    margin: 16px 0;
  }
  .callout-icon { font-size: 1.4rem; flex-shrink: 0; line-height: 1; margin-top: 2px; }
  .callout-body { flex: 1; font-size: 0.97rem; color: var(--text-mid); }
  .callout-body strong { display: block; color: var(--navy); margin-bottom: 4px; font-family: 'Syne', sans-serif; }

  /* ─── TEST KEY ─── */
  .test-key {
    background:
      radial-gradient(circle at top right, rgba(6,182,212,0.18), transparent 26%),
      linear-gradient(135deg, #0f172a, #1e3a8a 70%, #0f766e 120%);
    color: white;
    border-radius: 18px;
    padding: 24px 28px;
    margin: 20px 0;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .test-key::after {
    content: 'TEST CLÉ';
    position: absolute;
    top: 16px; right: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: #dbeafe;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    padding: 3px 8px;
    border-radius: 999px;
  }
  .test-key h3 { color: #dbeafe; margin-top: 0; }
  .test-key h3::before { background: linear-gradient(90deg, var(--cyan), #93c5fd); }
  .test-key p, .test-key li { color: rgba(255,255,255,0.86); }
  .test-key li::before { border-color: #93c5fd; background: transparent; }
  .test-key .stat-row .stat {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.12);
    box-shadow: none;
  }
  .test-key .stat .val { color: #e0f2fe; }
  .test-key .stat .lbl { color: rgba(255,255,255,0.6); }

  /* ─── PROTOCOL PHASES ─── */
  .phase {
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 16px;
    background: white;
    box-shadow: var(--shadow-sm);
  }
  .phase-header {
    background: linear-gradient(135deg, #0f172a, #1e3a8a);
    color: white;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .phase-header h3 { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: white; margin: 0; }
  .phase-header h3::before { display: none; }
  .phase-badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #dbeafe;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.08);
    padding: 4px 8px;
    border-radius: 999px;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .phase-body { padding: 20px 24px; background: white; }
  .phase-body h3 { margin-top: 16px; }
  .phase-body h3:first-child { margin-top: 0; }

  /* ─── WEEK STEPS ─── */
  .week-steps { display: flex; flex-direction: column; gap: 10px; margin: 12px 0; }
  .week-step { display: flex; gap: 14px; align-items: flex-start; }
  .week-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: white;
    background: linear-gradient(135deg, var(--steel), var(--blue));
    padding: 4px 8px;
    border-radius: 999px;
    white-space: nowrap;
    margin-top: 4px;
    letter-spacing: 0.5px;
  }
  .week-content { color: var(--text-mid); font-size: 0.96rem; }

  /* ─── SNNOOP ─── */
  .snnoop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    margin: 16px 0;
  }
  .snnoop-item {
    background: white;
    border: 1px solid rgba(220,38,38,0.12);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .snnoop-item:hover {
    border-color: rgba(220,38,38,0.32);
    box-shadow: 0 8px 24px rgba(220,38,38,0.08);
    transform: translateY(-1px);
  }
  .snnoop-letter {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.3rem;
    color: var(--red-flag);
    line-height: 1;
    flex-shrink: 0;
    min-width: 20px;
  }
  .snnoop-text { font-size: 0.88rem; color: var(--text-mid); line-height: 1.5; }
  .snnoop-text strong { display: block; font-size: 0.82rem; color: var(--text-dark); }

  /* ─── COMPARISON TABLE ─── */
  .diag-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.91rem;
    margin: 12px 0;
    overflow: hidden;
    border-radius: 14px;
    box-shadow: var(--shadow-sm);
  }
  .diag-table th {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    padding: 12px 16px;
    text-align: left;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .diag-table td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-light);
    color: var(--text-mid);
    vertical-align: top;
    background: rgba(255,255,255,0.96);
  }
  .diag-table tr:nth-child(even) td { background: var(--gray-50); }
  .diag-table td:first-child { font-weight: 600; color: var(--navy); font-family: 'Syne', sans-serif; font-size: 0.83rem; }

  /* ─── SUMMARY ─── */
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin: 16px 0;
  }
  @media (max-width: 700px) { .summary-grid { grid-template-columns: 1fr; } }
  .summary-item {
    background: white;
    border: 1px solid var(--border);
    border-top: 3px solid var(--blue);
    border-radius: 0 0 12px 12px;
    padding: 16px 20px;
    box-shadow: var(--shadow-sm);
  }
  .summary-item .si-label {
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 1.5px;
    color: var(--blue);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .summary-item .si-text { font-size: 0.93rem; color: var(--text-mid); line-height: 1.5; }

  /* ─── HIERARCHY RANKING ─── */
  .rank-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 14px 0;
    border-bottom: 1px solid var(--border-light);
  }
  .rank-item:last-child { border-bottom: none; }
  .rank-num {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    color: white;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 0.9rem;
    display: grid; place-items: center;
    flex-shrink: 0;
  }
  .rank-body { flex: 1; }
  .rank-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; color: var(--navy); margin-bottom: 2px; }
  .rank-detail { font-size: 0.88rem; color: var(--text-light); }
  .rank-score {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--blue);
    background: var(--blue-pale);
    border: 1px solid rgba(37,99,235,0.16);
    padding: 4px 8px;
    border-radius: 999px;
    white-space: nowrap;
    align-self: center;
  }

  /* ─── REFERENCES ─── */
  .ref-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
  }
  @media (max-width: 760px) { .ref-list { grid-template-columns: 1fr; } }
  .ref-item {
    background: white;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    box-shadow: var(--shadow-sm);
  }
  .ref-num {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: white;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    padding: 3px 7px;
    border-radius: 8px;
    flex-shrink: 0;
    margin-top: 2px;
    min-width: 30px;
    text-align: center;
  }
  .ref-body { flex: 1; }
  .ref-title { font-size: 0.88rem; font-weight: 600; color: var(--text-dark); line-height: 1.4; margin-bottom: 2px; }
  .ref-meta { font-size: 0.8rem; color: var(--text-light); font-style: italic; }

  /* ─── KEY POINTS ─── */
  .kp-item {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 14px 0;
    border-bottom: 1px solid var(--border-light);
  }
  .kp-item:last-child { border-bottom: none; }
  .kp-check {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--green), #22c55e);
    display: grid; place-items: center;
    flex-shrink: 0;
    color: white;
    font-size: 13px;
    margin-top: 2px;
    box-shadow: 0 8px 18px rgba(34,197,94,0.22);
  }
  .kp-text { flex: 1; color: var(--text-mid); font-size: 0.96rem; line-height: 1.6; }
  .kp-text strong { color: var(--navy); }

  /* ─── FOOTER ─── */
  footer {
    background: linear-gradient(135deg, #0f172a, #16253b);
    color: rgba(255,255,255,0.54);
    text-align: center;
    padding: 28px 40px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.5px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  footer strong { color: #bfdbfe; }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 980px) {
    .layout,
    .layout.toc-collapsed {
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 0 18px;
    }
    .toc {
      position: relative;
      top: 0;
      max-height: none;
      z-index: 30;
    }
    .layout.toc-collapsed .toc-title { display: block; }
    .layout.toc-collapsed .toc-body { display: none; }
    .layout.toc-collapsed .toc-head {
      padding: 14px;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.6));
    }
    .main-content { padding: 20px 0 70px; }
    .hero { padding: 52px 20px 42px; }
    .header-inner { padding: 14px 18px; }
  }

  @media (max-width: 640px) {
    .header-badge { display: none; }
    .section-header { gap: 12px; }
    .card, .phase-body, .test-key { padding: 20px; }
  }

  @media print {
    .site-header, .toc { display: none; }
    .layout { grid-template-columns: 1fr !important; }
    .main-content { padding: 0; border: none; }
  }


  /* ── CH1.2 TOOLS COMPONENTS ── */
  .tools-nav-wrap {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    position: relative; z-index: 50;
    box-shadow: 0 4px 18px rgba(15,23,42,0.06);
  }
  .tools-nav {
    max-width: 1100px; margin: 0 auto; padding: 0 28px;
    display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none;
  }
  .tools-nav::-webkit-scrollbar { display: none; }
  .tab-btn {
    appearance: none; border: none; background: none;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 12.5px;
    color: var(--text-light); padding: 16px 16px 14px;
    border-bottom: 3px solid transparent;
    cursor: pointer; white-space: nowrap;
    transition: color 0.2s, border-color 0.2s;
    display: flex; align-items: center; gap: 7px;
  }
  .tab-btn .tab-icon { font-size: 14px; }
  .tab-btn:hover { color: var(--blue); }
  .tab-btn.active { color: var(--blue); border-bottom-color: var(--cyan); }

  .tools-main { max-width: 1100px; margin: 0 auto; padding: 40px 28px 80px; }

  .tool-panel { display: none; }
  .tool-panel.active { display: block; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .tool-header { margin-bottom: 28px; }
  .tool-header h2 {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 1.6rem; color: var(--navy); letter-spacing: -0.3px;
    display: flex; align-items: center; gap: 12px; margin-bottom: 6px;
  }
  .tool-header p { color: var(--text-light); font-size: 0.95rem; font-style: italic; }
  .tool-badge {
    display: inline-block; font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px;
    border-radius: 999px; border: 1px solid; margin-bottom: 12px;
  }
  .tool-badge.blue   { color: var(--blue);   background: var(--blue-pale); border-color: rgba(37,99,235,0.2); }
  .tool-badge.red    { color: var(--red);    background: var(--red-bg);    border-color: rgba(220,38,38,0.2); }
  .tool-badge.green  { color: var(--green);  background: var(--green-bg);  border-color: rgba(21,128,61,0.2); }
  .tool-badge.purple { color: var(--purple); background: var(--purple-bg); border-color: rgba(124,58,237,0.2); }

  .card {
    background: rgba(255,255,255,0.94); border: 1px solid var(--border);
    border-radius: 16px; padding: 24px 28px;
    box-shadow: var(--shadow-sm); margin-bottom: 16px;
  }
  .card h3 {
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700;
    color: var(--steel); margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .card h3::before {
    content: ''; display: inline-block; width: 12px; height: 3px;
    background: linear-gradient(90deg, var(--blue), var(--cyan));
    border-radius: 2px; flex-shrink: 0;
  }

  .check-list { display: flex; flex-direction: column; gap: 8px; }
  .check-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 16px; border-radius: 12px;
    border: 2px solid var(--border-light);
    cursor: pointer; transition: all 0.18s ease;
    background: white; user-select: none;
  }
  .check-item:hover { border-color: rgba(220,38,38,0.3); background: var(--red-bg); }
  .check-item.checked-red { border-color: var(--red);  background: var(--red-bg); }
  .check-item.checked     { border-color: var(--blue); background: var(--blue-pale); }
  .check-box {
    width: 22px; height: 22px; border-radius: 6px;
    border: 2px solid var(--border); background: white;
    display: grid; place-items: center; flex-shrink: 0; margin-top: 1px;
    transition: all 0.18s; pointer-events: none;
  }
  .check-item.checked     .check-box { border-color: var(--blue); background: var(--blue); }
  .check-item.checked-red .check-box { border-color: var(--red);  background: var(--red);  }
  .check-box svg { width: 13px; height: 13px; stroke: white; display: none; pointer-events: none; }
  .check-item.checked .check-box svg,
  .check-item.checked-red .check-box svg { display: block; }
  .check-label { flex: 1; font-size: 0.96rem; color: var(--text-mid); line-height: 1.5; pointer-events: none; }
  .check-label strong { display: block; font-family: 'Syne', sans-serif; font-size: 0.88rem; color: var(--text-dark); margin-bottom: 1px; }

  .result-box {
    border-radius: 14px; padding: 20px 24px;
    margin-top: 20px; border: 2px solid; display: none;
    animation: fadeIn 0.3s ease;
  }
  .result-box.show    { display: block; }
  .result-box.safe    { background: var(--green-bg);  border-color: rgba(21,128,61,0.3); }
  .result-box.caution { background: var(--yellow-bg); border-color: rgba(202,138,4,0.3); }
  .result-box.danger  { background: var(--red-bg);    border-color: rgba(220,38,38,0.35); }
  .result-box.info    { background: var(--blue-pale); border-color: rgba(37,99,235,0.25); }
  .result-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 6px; }
  .result-box.safe    .result-title { color: var(--green); }
  .result-box.caution .result-title { color: var(--yellow); }
  .result-box.danger  .result-title { color: var(--red); }
  .result-box.info    .result-title { color: var(--blue); }
  .result-text { font-size: 0.93rem; color: var(--text-mid); line-height: 1.6; }

  .question-block { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border-light); }
  .question-block:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .question-text { font-weight: 600; color: var(--text-dark); margin-bottom: 10px; font-size: 0.97rem; line-height: 1.5; }
  .question-num { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--blue); background: var(--blue-pale); padding: 2px 6px; border-radius: 4px; margin-right: 8px; }
  .radio-options { display: flex; flex-direction: column; gap: 6px; }
  .radio-opt {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    border: 2px solid var(--border-light); cursor: pointer;
    transition: all 0.18s; background: white; user-select: none;
  }
  .radio-opt:hover   { border-color: rgba(37,99,235,0.3); background: var(--blue-pale); }
  .radio-opt.selected { border-color: var(--blue); background: var(--blue-pale); }
  .radio-circle {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--border); background: white; flex-shrink: 0;
    display: grid; place-items: center; transition: all 0.18s; pointer-events: none;
  }
  .radio-opt.selected .radio-circle { border-color: var(--blue); background: var(--blue); }
  .radio-dot { width: 8px; height: 8px; border-radius: 50%; background: white; display: none; pointer-events: none; }
  .radio-opt.selected .radio-dot { display: block; }
  .radio-label { font-size: 0.93rem; color: var(--text-mid); flex: 1; pointer-events: none; }
  .radio-score { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-light); pointer-events: none; }

  .eva-wrap { padding: 8px 0 20px; }
  .eva-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 8px; border-radius: 99px; outline: none; cursor: pointer;
    background: linear-gradient(90deg, #15803d 0%, #84cc16 30%, #ca8a04 50%, #ea580c 70%, #dc2626 100%);
  }
  .eva-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%;
    background: white; border: 3px solid var(--blue); box-shadow: var(--shadow-md);
    cursor: pointer; transition: transform 0.15s;
  }
  .eva-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
  .eva-labels { display: flex; justify-content: space-between; margin-top: 8px; font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-light); }
  .eva-value { text-align: center; margin-bottom: 8px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 3rem; color: var(--navy); line-height: 1; }
  .eva-desc  { text-align: center; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; }

  .groc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-bottom: 16px; }
  .groc-btn {
    appearance: none; border: 2px solid var(--border-light);
    border-radius: 12px; padding: 12px 8px;
    background: white; cursor: pointer;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; color: var(--text-dark);
    text-align: center; transition: all 0.18s;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .groc-btn .groc-label { font-size: 9px; font-family: 'DM Mono', monospace; color: var(--text-light); letter-spacing: 0.5px; font-weight: 400; pointer-events: none; }
  .groc-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .groc-btn.pos { border-color: rgba(21,128,61,0.25); }
  .groc-btn.pos:hover, .groc-btn.pos.selected { border-color: var(--green-2); background: var(--green-bg); }
  .groc-btn.neg { border-color: rgba(220,38,38,0.2); }
  .groc-btn.neg:hover, .groc-btn.neg.selected { border-color: var(--red); background: var(--red-bg); }
  .groc-btn.zero { border-color: rgba(100,116,139,0.3); }
  .groc-btn.zero:hover, .groc-btn.zero.selected { border-color: var(--text-light); background: var(--border-light); }

  .frt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  @media (max-width: 600px) { .frt-grid { grid-template-columns: 1fr; } }
  .frt-input-wrap label { display: block; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-light); margin-bottom: 8px; }
  .frt-input {
    width: 100%; padding: 14px 16px; font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 1.4rem; color: var(--navy); text-align: center;
    border: 2px solid var(--border); border-radius: 12px; background: white;
    outline: none; transition: border-color 0.2s;
  }
  .frt-input:focus { border-color: var(--blue); }
  .frt-input::placeholder { color: var(--border); font-size: 1rem; }
  .frt-unit { text-align: center; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-light); margin-top: 6px; }

  .btn-calculate {
    appearance: none; border: none;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    color: white; padding: 14px 28px; border-radius: 12px;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; width: 100%;
    box-shadow: 0 8px 24px rgba(37,99,235,0.28);
    transition: transform 0.15s, box-shadow 0.15s; letter-spacing: 0.3px; margin-top: 8px;
  }
  .btn-calculate:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(37,99,235,0.35); }
  .btn-reset {
    appearance: none; border: 1px solid var(--border); background: white;
    color: var(--text-mid); padding: 10px 20px; border-radius: 10px;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.85rem;
    cursor: pointer; margin-top: 10px; width: 100%; transition: all 0.18s;
  }
  .btn-reset:hover { border-color: var(--blue); color: var(--blue); }

  .info-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .info-chip { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 8px 14px; font-size: 0.88rem; color: var(--text-mid); flex: 1; min-width: 140px; }
  .info-chip strong { display: block; font-family: 'Syne', sans-serif; font-size: 0.8rem; color: var(--navy); margin-bottom: 2px; }

  .grade-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 12px; }
  .grade-table th { background: var(--navy); color: white; padding: 10px 14px; text-align: left; font-family: 'Syne', sans-serif; font-size: 0.82rem; }
  .grade-table th:first-child { border-radius: 8px 0 0 0; }
  .grade-table th:last-child  { border-radius: 0 8px 0 0; }
  .grade-table td { padding: 9px 14px; border-bottom: 1px solid var(--border-light); color: var(--text-mid); }
  .grade-table tr:nth-child(even) td { background: var(--border-light); }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }

  .ndi-section-title { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--blue); margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light); }

  .pheno-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  @media (max-width: 640px) { .pheno-grid { grid-template-columns: 1fr; } }
  .pheno-card {
    border: 2px solid var(--border); border-radius: 14px; padding: 20px;
    cursor: pointer; transition: all 0.2s; background: white;
  }
  .pheno-card:hover { border-color: var(--blue); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .pheno-card.selected-blue   { border-color: var(--blue);   background: var(--blue-pale); }
  .pheno-card.selected-orange { border-color: var(--orange); background: var(--orange-bg); }
  .pheno-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 10px; }
  .pheno-card.selected-blue   .pheno-title { color: var(--blue); }
  .pheno-card.selected-orange .pheno-title { color: var(--orange); }
  .pheno-list { list-style: none; }
  .pheno-list li { padding: 4px 0 4px 18px; position: relative; font-size: 0.9rem; color: var(--text-mid); }
  .pheno-list li::before { content: '·'; position: absolute; left: 4px; color: var(--blue-2); font-weight: 700; }
  .pheno-q { font-family: 'Syne', sans-serif; font-weight: 600; color: var(--navy); font-size: 0.95rem; margin: 16px 0 10px; }

  @media (max-width: 768px) {
    .tools-main { padding: 28px 18px 60px; }
    .header-badge { display: none; }
    .hero { padding: 44px 18px 38px; }
    .header-inner { padding: 0 18px; }
    .card { padding: 18px 20px; }
  }

</style>`
    const baseJS = `<script>

// ── Anchor smooth scroll
document.addEventListener('click', function(e) {
  var a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  var id = a.getAttribute('href').slice(1);
  var el = id ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: 'smooth' });
});

// ── iframe auto-height via ResizeObserver
function sendHeight() {
  var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  window.parent.postMessage({ type: 'iframe-resize', height: h }, '*');
}
new ResizeObserver(sendHeight).observe(document.documentElement);

// ── TOC toggle (used by chapters with #pageLayout + #tocToggle)
(function () {
  var layout = document.getElementById('pageLayout');
  var toggle = document.getElementById('tocToggle');
  if (!layout || !toggle) return;
  var collapsed = false;
  toggle.addEventListener('click', function () {
    if (window.innerWidth <= 980) return;
    collapsed = !collapsed;
    layout.classList.toggle('toc-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });
  var sections = document.querySelectorAll('.section');
  var links = document.querySelectorAll('.toc a');
  if (sections.length && links.length && typeof IntersectionObserver !== 'undefined') {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          var link = document.querySelector('.toc a[href="#' + entry.target.id + '"]');
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(function (s) { obs.observe(s); });
  }
})();

<\/script>`
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${fonts}${designCSS}${baseJS}</head><body>${html}</body></html>`
  }

  // Modal states
  const [selectedTest, setSelectedTest] = useState<FullTest | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<FullCluster | null>(null)
  const [showClusterModal, setShowClusterModal] = useState(false)

  const openTestModal = async (testId: string) => {
    const { data } = await supabase
      .from('orthopedic_tests')
      .select('*')
      .eq('id', testId)
      .single()
    if (data) {
      setSelectedTest(data)
      setShowTestModal(true)
    }
  }

  const openClusterModal = async (clusterId: string) => {
    const { data: cluster } = await supabase
      .from('orthopedic_test_clusters')
      .select('*')
      .eq('id', clusterId)
      .single()
    if (cluster) {
      // Load tests in this cluster
      const { data: items } = await supabase
        .from('orthopedic_test_cluster_items')
        .select('test_id, order_index')
        .eq('cluster_id', clusterId)
        .order('order_index')

      let clusterTests: { id: string; name: string; category: string }[] = []
      if (items && items.length > 0) {
        const testIds = items.map(i => i.test_id)
        const { data: tests } = await supabase
          .from('orthopedic_tests')
          .select('id, name, category')
          .in('id', testIds)
        clusterTests = testIds
          .map(id => tests?.find(t => t.id === id))
          .filter(Boolean) as { id: string; name: string; category: string }[]
      }

      setSelectedCluster({ ...cluster, tests: clusterTests })
      setShowClusterModal(true)
    }
  }

  const getYoutubeId = (url: string | null) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]*)/)
    return match ? match[1] : null
  }

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileData) setUserRole(profileData.role)

      // Load subject
      const { data: subjectData } = await supabase
        .from('encyclopedia_subjects')
        .select('id, title, color, is_free_access')
        .eq('id', subjectId)
        .single()

      if (!subjectData) { router.push('/elearning/encyclopedie'); return }
      setSubject(subjectData)

      // Load entry
      const { data: entryData } = await supabase
        .from('encyclopedia_entries')
        .select('*')
        .eq('id', entryId)
        .single()

      if (!entryData) { router.push(`/elearning/encyclopedie/${subjectId}`); return }
      setEntry(entryData)

      // Load associated tests & clusters
      const [{ data: testLinks }, { data: clusterLinks }] = await Promise.all([
        supabase
          .from('encyclopedia_entry_tests')
          .select('test_id, order_index')
          .eq('entry_id', entryId)
          .order('order_index'),
        supabase
          .from('encyclopedia_entry_clusters')
          .select('cluster_id, order_index')
          .eq('entry_id', entryId)
          .order('order_index'),
      ])

      if (testLinks && testLinks.length > 0) {
        const testIds = testLinks.map(l => l.test_id)
        const { data: tests } = await supabase
          .from('orthopedic_tests')
          .select('id, name, category')
          .in('id', testIds)
        // Preserve order
        const orderedTests = testIds
          .map(id => tests?.find(t => t.id === id))
          .filter(Boolean) as OrthopedicTest[]
        setAssociatedTests(orderedTests)
      } else {
        setAssociatedTests([])
      }

      if (clusterLinks && clusterLinks.length > 0) {
        const clusterIds = clusterLinks.map(l => l.cluster_id)
        const { data: clusters } = await supabase
          .from('orthopedic_test_clusters')
          .select('id, name, region')
          .in('id', clusterIds)
        const orderedClusters = clusterIds
          .map(id => clusters?.find(c => c.id === id))
          .filter(Boolean) as OrthopedicTestCluster[]
        setAssociatedClusters(orderedClusters)
      } else {
        setAssociatedClusters([])
      }

      // Build breadcrumb by walking up parent_id chain
      const crumbs: BreadcrumbItem[] = []
      let currentParentId = entryData.parent_id

      while (currentParentId) {
        const { data: parentData } = await supabase
          .from('encyclopedia_entries')
          .select('id, title, parent_id')
          .eq('id', currentParentId)
          .single()

        if (parentData) {
          crumbs.unshift({ id: parentData.id, title: parentData.title })
          currentParentId = parentData.parent_id
        } else {
          break
        }
      }

      setBreadcrumb(crumbs)

      // Load siblings for prev/next navigation
      const { data: siblingsData } = await supabase
        .from('encyclopedia_entries')
        .select('id, title, order_index, parent_id')
        .eq('subject_id', subjectId)
        .eq('parent_id', entryData.parent_id ?? '')
        .order('order_index', { ascending: true })

      // If parent_id is null, we need a different query
      if (entryData.parent_id === null) {
        const { data: rootSiblings } = await supabase
          .from('encyclopedia_entries')
          .select('id, title, order_index, parent_id')
          .eq('subject_id', subjectId)
          .is('parent_id', null)
          .order('order_index', { ascending: true })
        setSiblings((rootSiblings || []) as Entry[])
      } else {
        setSiblings((siblingsData || []) as Entry[])
      }
    } catch (err) {
      console.error('Erreur chargement fiche:', err)
    } finally {
      setLoading(false)
    }
  }, [subjectId, entryId, router])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (!subject || !entry) return null

  const gradient = subject.color || 'from-purple-500 to-indigo-600'
  const vimeoId = extractVimeoId(entry.vimeo_url)
  const isFreeUser = userRole === 'free'
  const locked = isFreeUser && !entry.is_free_access

  // Prev/next navigation
  const currentIndex = siblings.findIndex(s => s.id === entry.id)
  const prevEntry = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextEntry = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {subject.title}
        </button>

        <FreeContentGate isLocked={locked}>
          {/* Fiche Card */}
          <article className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${gradient} px-8 py-6 border-b-4 border-black/10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookMarked className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
                    Encyclopédie OsteoUpgrade
                  </h1>
                  <p className="text-white/80 text-sm font-medium">
                    {subject.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
              <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
                <button
                  onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
                  className="hover:text-purple-600 transition font-medium"
                >
                  {subject.title}
                </button>
                {breadcrumb.map((crumb) => (
                  <span key={crumb.id} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-400">{crumb.title}</span>
                  </span>
                ))}
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-800">{entry.title}</span>
              </nav>
            </div>

            {/* Title section */}
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {entry.title}
              </h2>
            </div>

            {/* Vimeo Video */}
            {vimeoId && (
              <div className="px-8 py-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900 aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0`}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={entry.title}
                  />
                </div>
              </div>
            )}

            {/* Rich text content */}
            {entry.content_html && (
              <div className="px-8 py-6">
                <iframe
                  ref={iframeRef}
                  srcDoc={buildSrcDoc(entry.content_html)}
                  sandbox="allow-scripts"
                  className="w-full border-0"
                  style={{ minHeight: '200px' }}
                  title="Contenu"
                />
              </div>
            )}

            {/* Images */}
            {entry.images && entry.images.length > 0 && (
              <div className="px-8 py-4">
                <div className="space-y-6">
                  {entry.images.map((img, idx) => (
                    <figure key={idx} className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
                      <img
                        src={img.url}
                        alt={img.caption || entry.title}
                        className="w-full h-auto object-cover"
                      />
                      {img.caption && (
                        <figcaption className="px-4 py-3 bg-slate-50 text-sm text-slate-600 italic border-t border-slate-200">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Tests & Clusters utiles */}
            {(associatedTests.length > 0 || associatedClusters.length > 0) && (
              <div className="px-8 py-6 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <TestTube2 className="h-5 w-5 text-purple-600" />
                  Tests / Clusters utiles
                </h3>

                {associatedTests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Tests individuels</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {associatedTests.map((test) => (
                        <button
                          key={test.id}
                          onClick={() => openTestModal(test.id)}
                          className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-left"
                        >
                          <TestTube2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{test.name}</p>
                            {test.category && (
                              <p className="text-xs text-slate-500">{test.category}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {associatedClusters.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Clusters de tests</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {associatedClusters.map((cluster) => (
                        <button
                          key={cluster.id}
                          onClick={() => openClusterModal(cluster.id)}
                          className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition text-left"
                        >
                          <Layers className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{cluster.name}</p>
                            {cluster.region && (
                              <p className="text-xs text-slate-500">{cluster.region}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prev/Next Navigation */}
            {(prevEntry || nextEntry) && (
              <div className="px-8 py-6 border-t border-slate-200">
                <div className="flex justify-between gap-4">
                  {prevEntry ? (
                    <button
                      onClick={() => router.push(`/elearning/encyclopedie/${subjectId}/${prevEntry.id}`)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-left flex-1 max-w-xs"
                    >
                      <ArrowLeft className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">Précédent</div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{prevEntry.title}</div>
                      </div>
                    </button>
                  ) : <div />}

                  {nextEntry ? (
                    <button
                      onClick={() => router.push(`/elearning/encyclopedie/${subjectId}/${nextEntry.id}`)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-right flex-1 max-w-xs ml-auto"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500">Suivant</div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{nextEntry.title}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`bg-gradient-to-r ${gradient} px-8 py-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/favicon.svg"
                    alt="Ostéo-Upgrade"
                    className="h-10 w-10 rounded-lg bg-white p-1.5"
                  />
                  <div>
                    <p className="text-white font-bold">Encyclopédie OsteoUpgrade</p>
                    <p className="text-white/70 text-sm">{subject.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/elearning/encyclopedie/${subjectId}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition border border-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              </div>
            </div>
          </article>
        </FreeContentGate>
      </div>

      {/* Test Detail Modal */}
      <TestDetailModal
        test={selectedTest}
        isOpen={showTestModal}
        onClose={() => { setShowTestModal(false); setSelectedTest(null) }}
      />

      {/* Cluster Detail Modal */}
      {showClusterModal && selectedCluster && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">{selectedCluster.name}</h2>
                  </div>
                  {selectedCluster.region && (
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                      Région : {selectedCluster.region}
                    </span>
                  )}
                  {selectedCluster.indications && (
                    <p className="mt-2 text-white/80 text-sm">{selectedCluster.indications}</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowClusterModal(false); setSelectedCluster(null) }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              {selectedCluster.description && (
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Description</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedCluster.description}
                  </p>
                </div>
              )}

              {/* Tests in cluster */}
              {selectedCluster.tests && selectedCluster.tests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-purple-600" />
                    Tests du cluster ({selectedCluster.tests.length})
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedCluster.tests.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setShowClusterModal(false)
                          setSelectedCluster(null)
                          openTestModal(t.id)
                        }}
                        className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-left"
                      >
                        <TestTube2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                          {t.category && <p className="text-xs text-gray-500">{t.category}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {(selectedCluster.sensitivity !== null || selectedCluster.specificity !== null) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedCluster.sensitivity !== null && selectedCluster.sensitivity !== undefined && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-600 font-medium mb-1">Sensibilité</div>
                      <div className="text-2xl font-bold text-green-700">{selectedCluster.sensitivity}%</div>
                    </div>
                  )}
                  {selectedCluster.specificity !== null && selectedCluster.specificity !== undefined && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-600 font-medium mb-1">Spécificité</div>
                      <div className="text-2xl font-bold text-blue-700">{selectedCluster.specificity}%</div>
                    </div>
                  )}
                  {selectedCluster.rv_positive !== null && selectedCluster.rv_positive !== undefined && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs text-purple-600 font-medium mb-1">RV+</div>
                      <div className="text-2xl font-bold text-purple-700">{selectedCluster.rv_positive}</div>
                    </div>
                  )}
                  {selectedCluster.rv_negative !== null && selectedCluster.rv_negative !== undefined && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-xs text-orange-600 font-medium mb-1">RV-</div>
                      <div className="text-2xl font-bold text-orange-700">{selectedCluster.rv_negative}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Interest */}
              {selectedCluster.interest && (
                <div className="bg-purple-50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Intérêt clinique</h3>
                  </div>
                  <p className="text-purple-800 whitespace-pre-line leading-relaxed">
                    {selectedCluster.interest}
                  </p>
                </div>
              )}

              {/* Sources */}
              {selectedCluster.sources && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Sources</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {selectedCluster.sources}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
