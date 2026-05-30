import React from 'react'

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
  const activeSize = size === 'sm' ? 'h-10 w-10 text-base' : size === 'lg' ? 'h-16 w-16 text-3xl' : 'h-13 w-13 text-xl'

  return (
    <div className="inline-block">
      {/* Label badge */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-md inline-flex flex-col items-stretch overflow-visible px-3 pt-2.5 pb-3 gap-2 min-w-[200px]">
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
                {/* Active "pill" raised above */}
                {isActive ? (
                  <div
                    className={`flex items-center justify-center rounded-full font-black shadow-lg z-10 ${activeSize}`}
                    style={{
                      backgroundColor: g.bg,
                      color: g.text,
                      width: size === 'sm' ? 40 : size === 'lg' ? 64 : 52,
                      height: size === 'sm' ? 40 : size === 'lg' ? 64 : 52,
                      fontSize: size === 'sm' ? 18 : size === 'lg' ? 30 : 22,
                      boxShadow: `0 4px 14px 0 ${g.bg}88`,
                      marginTop: -(size === 'sm' ? 6 : size === 'lg' ? 10 : 8),
                      marginBottom: -(size === 'sm' ? 6 : size === 'lg' ? 10 : 8),
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
        <p className={`${titleText} font-semibold text-center`} style={{ color: GRADES.find(g => g.letter === score)?.bg }}>
          {GRADES.find(g => g.letter === score)?.label}
        </p>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="mt-3 text-sm text-slate-600 leading-relaxed italic border-l-4 pl-3 py-1" style={{ borderColor: GRADES.find(g => g.letter === score)?.bg }}>
          {explanation}
        </div>
      )}
    </div>
  )
}
