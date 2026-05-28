'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import CourseCreationWizard from '../components/CourseCreationWizard'
import QuizComponent from '../components/QuizComponent'
import QuizManager from '../components/QuizManager'
import type { Quiz } from '../types/quiz'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Clock3,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Plus,
  Search,
  Shield,
  Sparkles,
  Video,
  X,
  Loader2,
  ClipboardCheck,
  Lock,
  Trophy,
  Trash2,
  Pencil,
  Tag
} from 'lucide-react'
import FreeContentGate from '@/components/FreeContentGate'
import FreeUserBanner from '@/components/FreeUserBanner'

type Subpart = {
  id: string
  title: string
  vimeo_url?: string
  description_html?: string
  order_index?: number
  completed?: boolean
  quiz?: Quiz
  quiz_passed?: boolean
}

type Chapter = {
  id: string
  title: string
  order_index?: number
  subparts: Subpart[]
}

type Subject = {
  id: string
  name: string
  color: string
  order_index: number
}

type Formation = {
  id: string
  title: string
  description?: string
  is_private?: boolean
  photo_url?: string
  is_free_access?: boolean
  is_featured_osteoflow?: boolean
  subject_id?: string | null
  chapters: Chapter[]
}

type Profile = {
  id: string
  role: string
  full_name?: string
}