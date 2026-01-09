import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks while allowing safe HTML tags
 *
 * Allows common formatting tags: headings, paragraphs, lists, links, emphasis, etc.
 * Removes dangerous elements: script tags, event handlers, iframes, etc.
 *
 * @param html - The raw HTML string to sanitize
 * @returns Safe HTML string ready for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'span', 'div',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Emphasis
      'strong', 'b', 'em', 'i', 'u', 's', 'mark',
      // Links and media
      'a', 'img',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Code
      'code', 'pre',
      // Quotes
      'blockquote', 'q', 'cite',
      // Other semantic elements
      'hr', 'small', 'sub', 'sup',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',  // Links
      'src', 'alt', 'width', 'height',  // Images
      'class', 'id',  // Styling
      'colspan', 'rowspan',  // Tables
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  })
}
