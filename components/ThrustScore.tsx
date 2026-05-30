import React from 'react'
import { MarkdownContent } from './MarkdownContent'

type Score = 'A' | 'B' | 'C' | 'D' | 'E'

interface Props {
  score: Score
  explanation?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const GRADES: { letter: Score; bg: string; text: string; label: string }[] = [
  { letter: 'A', bg: '#2e7d32', text: '#fff', label: 'Très fiable' },
  { letter: 'B', bg: '#558b2f', text: '#fff', label: 'Fiable' },
  { letter: 'C', bg: '#f9a825', text: '#fff', label: 'Modéré' },
  { letter: 'D', bg: '#e65100', text: '#fff', label: 'Limité' },
  { letter: 'E', bg: '#c62828', text: '#fff', label: 'Faible' },
]

export function ThrustScore({ score, explanation, size = 'md' }: Props) {
  const barH = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-11'
  const barText = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const titleText = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'

  const activeWidth = size === 'sm' ? 40 : size === 'lg' ? 72 : 60
  const activeHeight = size === 'sm' ? 40 : size === 'lg' ? 72 : 60
  const activeFontSize = size === 'sm' ? 18 : size === 'lg' ? 34 : 26
  const activeMargin = -(size === 'sm' ? 6 : size === 'lg' ? 12 : 10)

  const activeGrade = GRADES.find(g => g.letter === score)

  return (
    <div className="inline-block w-full">
      {/* Score widget */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-md inline-flex flex-col items-stretch overflow-visible px-3 pt-2.5 pb-3 gap-2 min-w-[220px]">
        {/* Title */}
        <p className={`${titleText} font-bold text-slate-600 tracking-widest uppercase text-center`}>
          T(H)rust Score
        </p>

        {/* Bars */}
        <div className="flex items-center gap-0.5">
          {GRADES.map((g) => {
            const isActive = g.letter === score
            return (
              <div key={g.letter} className="relative flex-1 flex items-center justify-center">
                {isActive ? (
                  <div
                    className="flex items-center justify-center rounded-full font-black shadow-lg z-10"
                    style={{
                      backgroundColor: g.bg,
                      color: g.text,
                      width: activeWidth,
                      height: activeHeight,
                      fontSize: activeFontSize,
                      boxShadow: `0 4px 18px 0 ${g.bg}99`,
                      marginTop: activeMargin,
                      marginBottom: activeMargin,
                    }}
                  >
                    {g.letter}
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-center w-full ${barH} ${barText} font-bold opacity-40`}
                    style={{
                      backgroundColor: g.bg,
                      color: g.text,
                      borderRadius:
                        g.letter === 'A'
                          ? '6px 0 0 6px'
                          : g.letter === 'E'
                          ? '0 6px 6px 0'
                          : '0',
                    }}
                  >
                    {g.letter}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Active grade label */}
        <p className={`${titleText} font-semibold text-center`} style={{ color: activeGrade?.bg }}>
          {activeGrade?.label}
        </p>
      </div>

      {/* Explanation with markdown rendering */}
      {explanation && (
        <div
          className="mt-4 rounded-xl p-4 border-l-4"
          style={{ borderColor: activeGrade?.bg, backgroundColor: `${activeGrade?.bg}10` }}
        >
          <MarkdownContent
            content={explanation}
            className="[&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:text-sm [&_h2]:text-slate-800 [&_h3]:text-slate-700 [&_strong]:text-slate-900"
          />
        </div>
      )}
    </div>
  )
}
