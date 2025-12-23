export interface CommunicationDocument {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_size: number | null
  category: 'courrier' | 'attestation' | 'facture' | 'autre' | null
  display_order: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CommunicationDocumentInsert {
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size?: number | null
  category?: 'courrier' | 'attestation' | 'facture' | 'autre' | null
  display_order?: number
  is_active?: boolean
  created_by?: string | null
}

export interface CommunicationDocumentUpdate {
  title?: string
  description?: string | null
  category?: 'courrier' | 'attestation' | 'facture' | 'autre' | null
  display_order?: number
  is_active?: boolean
}
