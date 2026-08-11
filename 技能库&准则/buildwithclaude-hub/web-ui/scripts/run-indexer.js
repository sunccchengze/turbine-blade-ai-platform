#!/usr/bin/env node
/**
 * Railway cron / local runner for catalog indexing.
 *
 * Reuses the same pure indexer functions as Trigger.dev tasks and /api/cron.
 * Must exit when finished so Railway cron can schedule the next run.
 *
 * Usage:
 *   node scripts/run-indexer.js [task]
 *   INDEXER_TASK=plugins node scripts/run-indexer.js
 *   npm run index:cron -- stats
 *
 * Tasks:
 *   mcp | marketplaces | plugins | skills | stats | markdown | scheduled | all
 *
 * Default (scheduled): day-rotated primary task + skills.sh + markdown reindex.
 */
const path = require('path')

const webuiRoot = path.join(__dirname, '..')

// Load .env.local locally; on Railway vars are already injected.
try {
  require('@next/env').loadEnvConfig(webuiRoot)
} catch {
  // @next/env may be unavailable in a minimal install; Railway supplies env.
}

const jiti = require('jiti')(__filename, { alias: { '@': webuiRoot } })
const { indexMCPServers, syncMCPServerStats } = jiti(
  '../lib/indexer/mcp-server-indexer.ts'
)
const { indexMarketplaces } = jiti('../lib/indexer/marketplace-indexer.ts')
const { indexPlugins } = jiti('../lib/indexer/plugin-indexer.ts')
const { indexSkillsFromSkillsSh } = jiti('../lib/indexer/skills-sh-indexer.ts')

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://buildwithclaude.com'

const TASK_NAMES = {
  mcp: 'MCP servers',
  marketplaces: 'Marketplaces',
  plugins: 'Plugins',
  skills: 'skills.sh',
  stats: 'MCP server stats',
  markdown: 'Deploy-static content reindex',
  scheduled: 'Scheduled (day-rotated + skills + markdown)',
  all: 'All indexing tasks',
}

/** @type {Record<number, keyof typeof TASK_NAMES | null>} */
const DAY_TO_TASK = {
  0: 'stats',
  1: 'mcp',
  2: 'marketplaces',
  3: 'plugins',
  4: 'stats',
  5: 'marketplaces',
  6: 'plugins',
}

/**
 * Ask the web app to refresh Meilisearch for the given types.
 * Never throws — search hiccups must not fail the DB sync.
 * @param {string[]} types
 */
async function reindexSearch(types) {
  const adminToken = process.env.ADMIN_API_TOKEN
  if (!adminToken) {
    console.warn('[search] ADMIN_API_TOKEN not set; skipping reindex')
    return
  }
  for (const type of types) {
    try {
      const res = await fetch(
        `${APP_BASE_URL}/api/admin/reindex-search?mode=type&type=${type}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      )
      console.log(`[search] reindex ${type} -> HTTP ${res.status}`)
    } catch (error) {
      console.error(`[search] reindex ${type} failed:`, error)
    }
  }
}

/**
 * @param {string} task
 * @returns {Promise<unknown>}
 */
async function runPrimaryTask(task) {
  switch (task) {
    case 'mcp': {
      const result = await indexMCPServers()
      await reindexSearch(['mcp-server'])
      return result
    }
    case 'marketplaces': {
      const result = await indexMarketplaces()
      await reindexSearch(['marketplace'])
      return result
    }
    case 'plugins': {
      const result = await indexPlugins()
      await reindexSearch(['plugin', 'skill'])
      return result
    }
    case 'skills': {
      const result = await indexSkillsFromSkillsSh()
      await reindexSearch(['skill'])
      return result
    }
    case 'stats': {
      const result = await syncMCPServerStats()
      await reindexSearch(['mcp-server'])
      return result
    }
    case 'markdown': {
      const reindexed = ['subagent', 'command', 'hook', 'plugin', 'skill']
      await reindexSearch(reindexed)
      return { reindexed }
    }
    default:
      throw new Error(`Unknown task: ${task}`)
  }
}

async function main() {
  // CLI argv overrides INDEXER_TASK so one-off tests work while cron keeps scheduled.
  const arg = process.argv[2] || process.env.INDEXER_TASK || 'scheduled'
  const task = arg.toLowerCase()

  if (!(task in TASK_NAMES) && task !== 'scheduled' && task !== 'all') {
    console.error(
      `Unknown task "${task}". Valid: ${Object.keys(TASK_NAMES).join(', ')}`
    )
    process.exit(1)
  }

  const startTime = Date.now()
  console.log(`[indexer] Starting task="${task}" (${TASK_NAMES[task] || task})`)

  /** @type {Record<string, unknown>} */
  const results = {}

  if (task === 'all') {
    for (const name of [
      'mcp',
      'marketplaces',
      'plugins',
      'skills',
      'stats',
      'markdown',
    ]) {
      console.log(`[indexer] --- ${name} ---`)
      results[name] = await runPrimaryTask(name)
    }
  } else if (task === 'scheduled') {
    const dayOfWeek = new Date().getUTCDay()
    const primary = DAY_TO_TASK[dayOfWeek]
    if (primary) {
      console.log(
        `[indexer] Day ${dayOfWeek}: primary=${primary} (${TASK_NAMES[primary]})`
      )
      results.primary = primary
      results[primary] = await runPrimaryTask(primary)
    } else {
      console.log(`[indexer] Day ${dayOfWeek}: no primary indexing scheduled`)
      results.primary = null
    }

    console.log('[indexer] --- skills (daily) ---')
    results.skills = await runPrimaryTask('skills')

    console.log('[indexer] --- markdown (daily) ---')
    results.markdown = await runPrimaryTask('markdown')
  } else {
    results[task] = await runPrimaryTask(task)
  }

  const durationMs = Date.now() - startTime
  console.log(`[indexer] Completed in ${durationMs}ms`)
  console.log('[indexer] Result:', JSON.stringify(results, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[indexer] Failed:', err)
    process.exit(1)
  })
