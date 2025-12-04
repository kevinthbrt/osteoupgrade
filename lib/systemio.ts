/**
 * System.io API Integration
 *
 * Documentation: https://systeme.io/api/v1/docs
 */

const SYSTEMIO_API_URL = process.env.SYSTEMIO_API_URL || 'https://systeme.io/api/v1'
const SYSTEMIO_API_KEY = process.env.SYSTEMIO_API_KEY || ''

interface SystemioContact {
  email: string
  first_name?: string
  last_name?: string
  tags?: string[]
  custom_fields?: Record<string, any>
}

interface SystemioCourse {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  url: string
}

/**
 * Create or update a contact in System.io
 */
export async function createOrUpdateSystemioContact(contact: SystemioContact): Promise<any> {
  if (!SYSTEMIO_API_KEY) {
    throw new Error('SYSTEMIO_API_KEY is not configured')
  }

  try {
    const response = await fetch(`${SYSTEMIO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYSTEMIO_API_KEY,
      },
      body: JSON.stringify(contact),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`System.io API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating/updating System.io contact:', error)
    throw error
  }
}

/**
 * Get a contact from System.io by email
 */
export async function getSystemioContactByEmail(email: string): Promise<any> {
  if (!SYSTEMIO_API_KEY) {
    throw new Error('SYSTEMIO_API_KEY is not configured')
  }

  try {
    const response = await fetch(`${SYSTEMIO_API_URL}/contacts?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYSTEMIO_API_KEY,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`System.io API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching System.io contact:', error)
    throw error
  }
}

/**
 * Add tags to a contact
 */
export async function addTagsToContact(contactId: string, tags: string[]): Promise<any> {
  if (!SYSTEMIO_API_KEY) {
    throw new Error('SYSTEMIO_API_KEY is not configured')
  }

  try {
    const response = await fetch(`${SYSTEMIO_API_URL}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYSTEMIO_API_KEY,
      },
      body: JSON.stringify({ tags }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`System.io API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error adding tags to System.io contact:', error)
    throw error
  }
}

/**
 * Get all courses from System.io
 * Note: This is a placeholder. You'll need to adapt this based on System.io's actual API
 * for courses/products.
 */
export async function getSystemioCourses(): Promise<SystemioCourse[]> {
  if (!SYSTEMIO_API_KEY) {
    throw new Error('SYSTEMIO_API_KEY is not configured')
  }

  try {
    // System.io might call this "products" or "courses" - adjust accordingly
    const response = await fetch(`${SYSTEMIO_API_URL}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYSTEMIO_API_KEY,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`System.io API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Transform System.io response to our format
    // Adjust this based on the actual response structure
    return data.products || data.courses || []
  } catch (error) {
    console.error('Error fetching System.io courses:', error)
    throw error
  }
}

/**
 * Enroll a contact in a course
 */
export async function enrollContactInCourse(contactId: string, courseId: string): Promise<any> {
  if (!SYSTEMIO_API_KEY) {
    throw new Error('SYSTEMIO_API_KEY is not configured')
  }

  try {
    const response = await fetch(`${SYSTEMIO_API_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYSTEMIO_API_KEY,
      },
      body: JSON.stringify({
        contact_id: contactId,
        course_id: courseId,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`System.io API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error enrolling contact in course:', error)
    throw error
  }
}

/**
 * Helper to get tags based on subscription role
 */
export function getRoleBasedTags(role: string): string[] {
  const tags: string[] = ['osteoupgrade']

  switch (role) {
    case 'premium_silver':
      tags.push('premium', 'silver')
      break
    case 'premium_gold':
      tags.push('premium', 'gold')
      break
    case 'admin':
      tags.push('admin')
      break
    case 'free':
      tags.push('free')
      break
  }

  return tags
}
