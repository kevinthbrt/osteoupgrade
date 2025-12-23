'use client'

import AuthLayout from '@/components/AuthLayout'
import { HeartPulse } from 'lucide-react'

export default function PriseEnChargePage() {
  return (
    <AuthLayout>
      <div className="min-h-screen">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/30 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <HeartPulse className="h-3.5 w-3.5 text-rose-200" />
                <span className="text-xs font-semibold text-rose-100">Prise en charge</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-rose-100">
                Prise en charge des pathologies
              </h1>

              <p className="text-base md:text-lg text-rose-100 mb-6 max-w-2xl">
                Retrouvez ici tous les conseils de prise en charge par pathologie. Le contenu arrive très bientôt.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-slate-600">
          Contenu en préparation.
        </div>
      </div>
    </AuthLayout>
  )
}
