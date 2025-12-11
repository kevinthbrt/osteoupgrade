'use client'

import { X, TestTube2, Info, TrendingUp, FileText } from 'lucide-react'

interface OrthopedicTest {
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

interface TestDetailModalProps {
  test: OrthopedicTest | null
  isOpen: boolean
  onClose: () => void
}

export default function TestDetailModal({ test, isOpen, onClose }: TestDetailModalProps) {
  if (!isOpen || !test) return null

  // Extraire l'ID Vimeo de l'URL
  const getVimeoId = (url: string | null) => {
    if (!url) return null
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
  }

  const vimeoId = getVimeoId(test.video_url)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <TestTube2 className="h-6 w-6" />
                <h2 className="text-2xl font-bold">{test.name}</h2>
              </div>
              {test.category && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                  {test.category}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Video */}
          {vimeoId && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* Métriques de performance */}
          {(test.sensitivity || test.specificity || test.rv_positive || test.rv_negative) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {test.sensitivity && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-xs text-green-600 font-medium mb-1">Sensibilité</div>
                  <div className="text-2xl font-bold text-green-700">{test.sensitivity}%</div>
                </div>
              )}
              {test.specificity && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-medium mb-1">Spécificité</div>
                  <div className="text-2xl font-bold text-blue-700">{test.specificity}%</div>
                </div>
              )}
              {test.rv_positive && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-xs text-purple-600 font-medium mb-1">RV+</div>
                  <div className="text-2xl font-bold text-purple-700">{test.rv_positive}</div>
                </div>
              )}
              {test.rv_negative && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-xs text-orange-600 font-medium mb-1">RV-</div>
                  <div className="text-2xl font-bold text-orange-700">{test.rv_negative}</div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {test.description && (
            <div className="bg-gray-50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Description</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {test.description}
              </p>
            </div>
          )}

          {/* Indications */}
          {test.indications && (
            <div className="bg-blue-50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Indications</h3>
              </div>
              <p className="text-blue-800 whitespace-pre-line leading-relaxed">
                {test.indications}
              </p>
            </div>
          )}

          {/* Intérêt */}
          {test.interest && (
            <div className="bg-purple-50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Intérêt clinique</h3>
              </div>
              <p className="text-purple-800 whitespace-pre-line leading-relaxed">
                {test.interest}
              </p>
            </div>
          )}

          {/* Sources */}
          {test.sources && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Sources</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {test.sources}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
