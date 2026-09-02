'use client'

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { BLOCK_LABELS, type FunnelBlock } from '@/lib/funnels'

/**
 * Édition d'un bloc de funnel.
 *
 * Les blocs sont manipulés en JSON libre (`any`) plutôt qu'avec le type
 * discriminé : pendant la saisie, un bloc est presque toujours incomplet —
 * une liste vide, un champ à remplir. Le typage strict est appliqué à
 * l'enregistrement par `funnelInputSchema`, qui est la seule barrière qui
 * compte puisque c'est elle qui protège la base.
 */

type Props = {
  block: any
  index: number
  total: number
  onChange: (block: any) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold text-slate-600">{children}</label>
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: any
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string
  value: any
  onChange: (v: string) => void
  rows?: number
  hint?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

/** Liste de chaînes (fonctionnalités, leçons…), une par ligne. */
function LinesField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string[] | undefined
  onChange: (v: string[]) => void
  hint?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={(value ?? []).join('\n')}
        onChange={(e) =>
          onChange(
            e.target.value
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
          )
        }
        rows={4}
        className={inputClass}
      />
      <p className="mt-1 text-xs text-slate-400">{hint || 'Une entrée par ligne.'}</p>
    </div>
  )
}

/** Liste d'objets répétables (témoignages, questions…). */
function RepeatableField({
  label,
  items,
  onChange,
  fields,
  addLabel,
}: {
  label: string
  items: any[] | undefined
  onChange: (items: any[]) => void
  fields: { key: string; label: string; multiline?: boolean }[]
  addLabel: string
}) {
  const list = items ?? []

  const update = (index: number, key: string, value: string) => {
    const next = [...list]
    next[index] = { ...next[index], [key]: value }
    onChange(next)
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
              <button
                type="button"
                onClick={() => onChange(list.filter((_, j) => j !== i))}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Retirer
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field) =>
                field.multiline ? (
                  <textarea
                    key={field.key}
                    value={item?.[field.key] ?? ''}
                    onChange={(e) => update(i, field.key, e.target.value)}
                    placeholder={field.label}
                    rows={3}
                    className={inputClass}
                  />
                ) : (
                  <input
                    key={field.key}
                    type="text"
                    value={item?.[field.key] ?? ''}
                    onChange={(e) => update(i, field.key, e.target.value)}
                    placeholder={field.label}
                    className={inputClass}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...list, {}])}
        className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
      >
        + {addLabel}
      </button>
    </div>
  )
}

/** Champ montant : saisi en euros, stocké en centimes. */
function AmountField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (cents: number | undefined) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value == null ? '' : (value / 100).toString()}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(undefined)
          const euros = parseFloat(raw)
          onChange(Number.isNaN(euros) ? undefined : Math.round(euros * 100))
        }}
        className={inputClass}
      />
    </div>
  )
}

const CTA_TARGETS = [
  { value: 'checkout', label: 'Souscription (offre du funnel)' },
  { value: 'optin', label: 'Aller au formulaire email' },
  { value: 'url', label: 'Lien libre' },
]

function CtaFields({ block, set }: { block: any; set: (patch: any) => void }) {
  return (
    <>
      <div>
        <Label>Action du bouton</Label>
        <select
          value={block.ctaTarget ?? 'checkout'}
          onChange={(e) => set({ ctaTarget: e.target.value })}
          className={inputClass}
        >
          {CTA_TARGETS.map((target) => (
            <option key={target.value} value={target.value}>
              {target.label}
            </option>
          ))}
        </select>
      </div>
      {block.ctaTarget === 'url' && (
        <Field label="URL du bouton" value={block.ctaUrl} onChange={(v) => set({ ctaUrl: v })} />
      )}
    </>
  )
}

export default function BlockEditor({ block, index, total, onChange, onMove, onRemove }: Props) {
  const set = (patch: any) => onChange({ ...block, ...patch })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          {BLOCK_LABELS[block.type as FunnelBlock['type']] ?? block.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            aria-label="Monter le bloc"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            aria-label="Descendre le bloc"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Supprimer le bloc"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {block.type === 'hero' && (
          <>
            <Field label="Sur-titre" value={block.eyebrow} onChange={(v) => set({ eyebrow: v })} />
            <Field label="Titre" value={block.title} onChange={(v) => set({ title: v })} />
            <TextArea label="Sous-titre" value={block.subtitle} onChange={(v) => set({ subtitle: v })} />
            <Field label="Libellé du bouton" value={block.ctaLabel} onChange={(v) => set({ ctaLabel: v })} />
            <CtaFields block={block} set={set} />
          </>
        )}

        {block.type === 'video' && (
          <>
            <Field label="Titre" value={block.title} onChange={(v) => set({ title: v })} />
            <Field
              label="URL d’intégration"
              value={block.embedUrl}
              onChange={(v) => set({ embedUrl: v })}
              placeholder="https://player.vimeo.com/video/123456789"
            />
            <p className="text-xs text-slate-400">
              Vimeo ou YouTube uniquement. Utilisez l’URL d’intégration (embed), pas celle de la barre
              d’adresse.
            </p>
            <Field label="Légende" value={block.caption} onChange={(v) => set({ caption: v })} />
          </>
        )}

        {block.type === 'benefits' && (
          <>
            <Field label="Titre de section" value={block.title} onChange={(v) => set({ title: v })} />
            <RepeatableField
              label="Bénéfices"
              items={block.items}
              onChange={(items) => set({ items })}
              fields={[
                { key: 'title', label: 'Titre' },
                { key: 'text', label: 'Description', multiline: true },
              ]}
              addLabel="Ajouter un bénéfice"
            />
          </>
        )}

        {block.type === 'testimonials' && (
          <>
            <Field label="Titre de section" value={block.title} onChange={(v) => set({ title: v })} />
            <RepeatableField
              label="Témoignages"
              items={block.items}
              onChange={(items) => set({ items })}
              fields={[
                { key: 'quote', label: 'Témoignage', multiline: true },
                { key: 'author', label: 'Auteur' },
                { key: 'role', label: 'Fonction / ville' },
              ]}
              addLabel="Ajouter un témoignage"
            />
          </>
        )}

        {block.type === 'curriculum' && (
          <>
            <Field label="Titre de section" value={block.title} onChange={(v) => set({ title: v })} />
            <Field label="Sous-titre" value={block.subtitle} onChange={(v) => set({ subtitle: v })} />
            <div>
              <Label>Modules</Label>
              <div className="space-y-3">
                {(block.modules ?? []).map((module: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Module {i + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          set({ modules: (block.modules ?? []).filter((_: any, j: number) => j !== i) })
                        }
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={module.title ?? ''}
                        onChange={(e) => {
                          const modules = [...(block.modules ?? [])]
                          modules[i] = { ...modules[i], title: e.target.value }
                          set({ modules })
                        }}
                        placeholder="Titre du module"
                        className={inputClass}
                      />
                      <textarea
                        value={module.description ?? ''}
                        onChange={(e) => {
                          const modules = [...(block.modules ?? [])]
                          modules[i] = { ...modules[i], description: e.target.value }
                          set({ modules })
                        }}
                        placeholder="Description"
                        rows={2}
                        className={inputClass}
                      />
                      <textarea
                        value={(module.lessons ?? []).join('\n')}
                        onChange={(e) => {
                          const modules = [...(block.modules ?? [])]
                          modules[i] = {
                            ...modules[i],
                            lessons: e.target.value
                              .split('\n')
                              .map((l) => l.trim())
                              .filter(Boolean),
                          }
                          set({ modules })
                        }}
                        placeholder="Leçons — une par ligne"
                        rows={3}
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => set({ modules: [...(block.modules ?? []), { lessons: [] }] })}
                className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
              >
                + Ajouter un module
              </button>
            </div>
          </>
        )}

        {block.type === 'pricing' && (
          <>
            <Field label="Titre de section" value={block.title} onChange={(v) => set({ title: v })} />
            <Field label="Sous-titre" value={block.subtitle} onChange={(v) => set({ subtitle: v })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <AmountField
                label="Prix barré (€)"
                value={block.originalAmount}
                onChange={(v) => set({ originalAmount: v })}
              />
              <AmountField label="Prix affiché (€)" value={block.amount} onChange={(v) => set({ amount: v })} />
            </div>
            <p className="text-xs text-slate-400">
              Ces montants sont <strong>affichés</strong>. Le montant facturé reste celui de l’offre Stripe
              choisie plus haut.
            </p>
            <Field label="Mention sous le prix" value={block.priceNote} onChange={(v) => set({ priceNote: v })} />
            <LinesField
              label="Ce qui est inclus"
              value={block.features}
              onChange={(features) => set({ features })}
            />
            <Field label="Libellé du bouton" value={block.ctaLabel} onChange={(v) => set({ ctaLabel: v })} />
          </>
        )}

        {block.type === 'guarantee' && (
          <>
            <Field label="Titre" value={block.title} onChange={(v) => set({ title: v })} />
            <TextArea label="Texte" value={block.text} onChange={(v) => set({ text: v })} rows={4} />
          </>
        )}

        {block.type === 'faq' && (
          <>
            <Field label="Titre de section" value={block.title} onChange={(v) => set({ title: v })} />
            <RepeatableField
              label="Questions"
              items={block.items}
              onChange={(items) => set({ items })}
              fields={[
                { key: 'question', label: 'Question' },
                { key: 'answer', label: 'Réponse', multiline: true },
              ]}
              addLabel="Ajouter une question"
            />
          </>
        )}

        {block.type === 'cta' && (
          <>
            <Field label="Titre" value={block.title} onChange={(v) => set({ title: v })} />
            <TextArea label="Texte" value={block.text} onChange={(v) => set({ text: v })} />
            <Field label="Libellé du bouton" value={block.ctaLabel} onChange={(v) => set({ ctaLabel: v })} />
            <CtaFields block={block} set={set} />
          </>
        )}

        {block.type === 'optin' && (
          <>
            <Field label="Titre" value={block.title} onChange={(v) => set({ title: v })} />
            <TextArea label="Texte" value={block.text} onChange={(v) => set({ text: v })} />
            <Field
              label="Libellé du bouton"
              value={block.buttonLabel}
              onChange={(v) => set({ buttonLabel: v })}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={block.askName ?? true}
                onChange={(e) => set({ askName: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Demander le prénom
            </label>
            <TextArea
              label="Mention de consentement"
              value={block.consentText}
              onChange={(v) => set({ consentText: v })}
              rows={2}
              hint="Laissez vide pour la mention par défaut (RGPD + désinscription)."
            />
            <Field
              label="Message de confirmation"
              value={block.successMessage}
              onChange={(v) => set({ successMessage: v })}
            />
          </>
        )}

        {block.type === 'text' && (
          <>
            <Field label="Titre de section" value={block.title} onChange={(v) => set({ title: v })} />
            <TextArea
              label="Texte"
              value={block.body}
              onChange={(v) => set({ body: v })}
              rows={6}
              hint="Les sauts de ligne sont conservés. Le HTML n’est pas interprété."
            />
          </>
        )}
      </div>
    </div>
  )
}
