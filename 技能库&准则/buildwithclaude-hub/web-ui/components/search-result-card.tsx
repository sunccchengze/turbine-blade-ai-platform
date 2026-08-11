import Link from 'next/link'
import { Download, Star } from 'lucide-react'
import { HighlightedText } from '@/components/highlighted-text'
import {
  TYPE_LABELS,
  getTypeBadgeClasses,
  formatCategoryName,
  type SearchHit,
} from '@/lib/content-types'

/** Mixed-type result card for the /search results grid. */
export function SearchResultCard({ hit }: { hit: SearchHit }) {
  const isExternal = hit.url.startsWith('http')
  const snippet = hit._formatted?.description || hit._formatted?.content || hit.description

  const inner = (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeClasses(hit.type)}`}>
          {TYPE_LABELS[hit.type]}
        </span>
        {hit.category && hit.category !== 'uncategorized' && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {formatCategoryName(hit.category)}
          </span>
        )}
        {hit.marketplace && (
          <span className="max-w-[140px] truncate rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-500">
            {hit.marketplace}
          </span>
        )}
      </div>

      <h3 className="mb-1 truncate font-medium">
        <HighlightedText text={hit._formatted?.name || hit.name} />
      </h3>

      <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
        <HighlightedText text={snippet} />
      </p>

      {(hit.stars || hit.installs) ? (
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {hit.stars ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3" />
              {hit.stars.toLocaleString()}
            </span>
          ) : null}
          {hit.installs ? (
            <span className="inline-flex items-center gap-1">
              <Download className="h-3 w-3" />
              {hit.installs.toLocaleString()}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  if (isExternal) {
    return (
      <a href={hit.url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return <Link href={hit.url}>{inner}</Link>
}
