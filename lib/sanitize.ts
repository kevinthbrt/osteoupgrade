import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with secure defaults
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'hr', 'sub', 'sup'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height'
    ],
    // Force all links to open in new tab with safe rel
    ALLOW_DATA_ATTR: false,
    // Additional security
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  })
}

/**
 * Sanitize HTML for use in dangerouslySetInnerHTML
 * Returns an object ready for React
 */
export function createSafeHtml(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) }
}
