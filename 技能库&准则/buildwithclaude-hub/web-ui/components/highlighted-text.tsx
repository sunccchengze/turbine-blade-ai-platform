import * as React from 'react'

// Must match the backend's HIGHLIGHT_PRE_TAG / HIGHLIGHT_POST_TAG
// (lib/search/search-types.ts). U+0001 / U+0002 never appear in real content.
const PRE = ''
const POST = ''

/**
 * Renders a Meilisearch `_formatted` string, turning the sentinel-delimited
 * matches into <mark> elements. We split the string and build React nodes —
 * no raw HTML is ever injected, so this is XSS-safe by construction.
 */
export function HighlightedText({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null

  const nodes: React.ReactNode[] = []
  let cursor = 0
  let key = 0

  while (cursor < text.length) {
    const start = text.indexOf(PRE, cursor)
    if (start === -1) {
      nodes.push(text.slice(cursor))
      break
    }
    if (start > cursor) nodes.push(text.slice(cursor, start))

    const end = text.indexOf(POST, start + 1)
    if (end === -1) {
      // Unbalanced marker — render the remainder as plain text.
      nodes.push(text.slice(start + 1))
      break
    }

    nodes.push(
      <mark
        key={key++}
        className="rounded-[2px] bg-primary/20 px-0.5 font-medium not-italic text-foreground"
      >
        {text.slice(start + 1, end)}
      </mark>,
    )
    cursor = end + 1
  }

  return <span className={className}>{nodes}</span>
}
