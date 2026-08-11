/**
 * Shared GitHub Search API pagination helpers.
 * GitHub returns at most 100 results per page; callers cap total pages to limit rate usage.
 */

const DEFAULT_PER_PAGE = 100;
const DEFAULT_PAGE_CAP = 10;

/**
 * @param {number} totalCount
 * @param {number} [perPage]
 * @param {number} [pageCap]
 * @returns {number}
 */
function getSearchMaxPages(totalCount, perPage = DEFAULT_PER_PAGE, pageCap = DEFAULT_PAGE_CAP) {
  if (!totalCount || totalCount <= 0) {
    return 0;
  }
  return Math.min(Math.ceil(totalCount / perPage), pageCap);
}

module.exports = {
  DEFAULT_PER_PAGE,
  DEFAULT_PAGE_CAP,
  getSearchMaxPages,
};
