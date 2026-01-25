type ProfilePayload = {
  user: { id: string; email: string | null }
  profile: { id: string; email: string | null; full_name: string | null; role: string } | null
}

export const fetchProfilePayload = async (): Promise<ProfilePayload | null> => {
  const response = await fetch('/api/profile', { cache: 'no-store' })
  if (!response.ok) {
    return null
  }

  return response.json()
}
