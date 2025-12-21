'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, LucideIcon } from 'lucide-react'

export type RelatedItem = {
  id: string
  title: string
  description?: string
  module: string
  href: string
  gradient: string
  icon: LucideIcon
}

type RelatedContentProps = {
  title: string
  items: RelatedItem[]
  emptyMessage?: string
}

export default function RelatedContent({ title, items, emptyMessage }: RelatedContentProps) {
  const router = useRouter()

  if (items.length === 0 && !emptyMessage) {
    return null
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600 italic">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className="group relative overflow-hidden rounded-xl bg-white border-2 border-slate-200 hover:border-sky-300 p-4 text-left shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className="relative flex items-center gap-3">
                  <div className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} shadow-sm transform transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {item.module}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <ArrowRight className="flex-shrink-0 h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
