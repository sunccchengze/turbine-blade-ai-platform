export const DEFAULT_PER_PAGE = 100
export const DEFAULT_PAGE_CAP = 10

/**
 * Compute how many GitHub Search API pages to fetch (max 100 results per page).
 */
export function getSearchMaxPages(
  totalCount: number,
  perPage: number = DEFAULT_PER_PAGE,
  pageCap: number = DEFAULT_PAGE_CAP,
): number {
  if (!totalCount || totalCount <= 0) {
    return 0
  }
  return Math.min(Math.ceil(totalCount / perPage), pageCap)
}
