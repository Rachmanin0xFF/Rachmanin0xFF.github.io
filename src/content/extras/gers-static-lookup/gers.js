// Resolves a GERS ID to its registry row, feature record and changelog history,
// reading Overture's public parquet straight from S3 with HTTP range requests.

import { asyncBufferFromUrl, cachedAsyncBuffer, parquetMetadataAsync, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

export const S3 = 'https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com'
const STAC = 'https://stac.overturemaps.org/catalog.json'
export const TILES = 'https://tiles.overturemaps.org'

// gers.page covers the same window: the last six changelog releases.
const HISTORY_RELEASES = 6
const CONCURRENCY = 8
// Most footers here are a few KB; hyparquet's 512 KB default dominated transfer.
const FOOTER_FETCH = 1 << 16
const CHANGE_TYPES = ['added', 'data_changed', 'removed']

// Every theme/type the registry covers, smallest removed partitions first so
// the removed-ID scan usually finishes early.
const REGISTRY_TYPES = [
  ['places', 'place'],
  ['divisions', 'division'],
  ['divisions', 'division_area'],
  ['divisions', 'division_boundary'],
  ['transportation', 'connector'],
  ['transportation', 'segment'],
  ['buildings', 'building'],
]

const RETRIES = 3

/** Running totals of every response this module has read. */
export const transfer = { requests: 0, bytes: 0 }

/**
 * fetch that buffers the body and retries network failures and 5xx. S3
 * occasionally resets a connection mid-body, which a plain fetch only
 * surfaces later when the body is read.
 */
async function fetchRetry(url, init) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.status >= 500 && attempt < RETRIES) continue
      const body = await res.arrayBuffer()
      transfer.requests++
      transfer.bytes += body.byteLength
      return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers })
    } catch (err) {
      if (attempt >= RETRIES) throw err
    }
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** S3 ListObjectsV2 over anonymous HTTPS. Returns {keys: [{key, size}], prefixes}. */
async function listS3(prefix, delimiter) {
  const keys = []
  const prefixes = []
  let token = null
  do {
    const params = new URLSearchParams({ 'list-type': '2', prefix })
    if (delimiter) params.set('delimiter', delimiter)
    if (token) params.set('continuation-token', token)
    const res = await fetchRetry(`${S3}/?${params}`)
    if (!res.ok) throw new Error(`S3 listing failed for ${prefix}: HTTP ${res.status}`)
    const xml = await res.text()
    for (const m of xml.matchAll(/<Contents>.*?<Key>([^<]+)<\/Key>.*?<Size>(\d+)<\/Size>.*?<\/Contents>/gs)) {
      keys.push({ key: m[1], size: Number(m[2]) })
    }
    for (const m of xml.matchAll(/<CommonPrefixes><Prefix>([^<]+)<\/Prefix><\/CommonPrefixes>/g)) {
      prefixes.push(m[1])
    }
    token = xml.match(/<NextContinuationToken>([^<]+)</)?.[1] ?? null
  } while (token)
  return { keys, prefixes }
}

async function listReleaseNames(root) {
  const { prefixes } = await listS3(`${root}/`, '/')
  return prefixes.map(p => p.slice(root.length + 1, -1)).sort()
}

const partsCache = new Map()
/** Parquet files under a prefix, keyed by part number ("00002"). */
function listParts(prefix) {
  if (!partsCache.has(prefix)) {
    partsCache.set(prefix, listS3(prefix).then(({ keys }) => {
      const parts = new Map()
      for (const k of keys) {
        const part = k.key.match(/\/part-(\d+)-[^/]*\.parquet$/)?.[1]
        if (part) parts.set(part, k)
      }
      return parts
    }))
  }
  return partsCache.get(prefix)
}

async function openParquet(url, byteLength) {
  const file = cachedAsyncBuffer(await asyncBufferFromUrl({ url, byteLength, fetch: fetchRetry }))
  const metadata = await parquetMetadataAsync(file, { initialFetchSize: FOOTER_FETCH })
  return { file, metadata }
}

// Changelog rows from earlier releases can carry a slightly different bbox
// when the geometry was edited, so history matches within this many degrees.
const HISTORY_BBOX_TOLERANCE = 1e-3
const BBOX_KEYS = ['xmin', 'xmax', 'ymin', 'ymax']

function columnStats(rowGroup, path) {
  return rowGroup.columns.find(c => c.meta_data?.path_in_schema.join('.') === path)?.meta_data.statistics
}

/**
 * [start, end) row ranges of the row groups whose bbox statistics admit `b`.
 * Pruning here, instead of in the read filter, keeps the bbox columns from
 * being downloaded at all.
 */
function bboxRowRanges(metadata, b, tolerance) {
  const ranges = []
  let start = 0
  for (const rowGroup of metadata.row_groups) {
    const end = start + Number(rowGroup.num_rows)
    const admits = BBOX_KEYS.every(k => {
      const stats = columnStats(rowGroup, `bbox.${k}`)
      if (stats?.min_value === undefined || stats?.max_value === undefined) return true
      return stats.min_value <= b[k] + tolerance && stats.max_value >= b[k] - tolerance
    })
    if (admits) ranges.push([start, end])
    start = end
  }
  return ranges
}

/**
 * The row with this id, or null. With `bbox`, only row groups whose bbox stats
 * admit it are read; otherwise every group is, helped by any page index.
 * `columns` absent from this file's schema are skipped.
 */
async function readRow(url, byteLength, id, { bbox, tolerance = 0, columns } = {}) {
  const { file, metadata } = await openParquet(url, byteLength)
  if (columns) {
    const present = new Set(metadata.schema.map(e => e.name))
    columns = columns.filter(c => present.has(c))
  }
  const read = { file, metadata, columns, compressors, filter: { id: { $eq: id } } }
  if (!bbox) {
    const rows = await parquetReadObjects({ ...read, usePageIndex: true })
    return rows[0] ?? null
  }
  for (const [rowStart, rowEnd] of bboxRowRanges(metadata, bbox, tolerance)) {
    const rows = await parquetReadObjects({ ...read, rowStart, rowEnd })
    if (rows.length) return rows[0]
  }
  return null
}

/** Runs async tasks with bounded concurrency; stops scheduling once `done()` is true. */
async function pool(items, worker, done = () => false) {
  let next = 0
  async function run() {
    while (next < items.length && !done()) await worker(items[next++])
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run))
}

let catalogPromise = null
/** STAC root catalog: latest release plus the registry manifest of [file, max id] pairs. */
function catalog() {
  catalogPromise ??= fetchRetry(STAC).then(r => {
    if (!r.ok) throw new Error(`STAC catalog: HTTP ${r.status}`)
    return r.json()
  })
  return catalogPromise
}

/** Registry row for `id` plus the registry file it came from, or null when the ID was never in GERS. */
async function registryLookup(id) {
  const { registry } = await catalog()
  // The registry is sorted by id and each manifest entry is that file's max id.
  const entry = registry.manifest.find(([, maxId]) => id <= maxId)
  if (!entry) return null
  const url = `${S3}/registry/${entry[0]}`
  const row = await readRow(url, undefined, id)
  return row && { ...row, file: url }
}

function partOf(path) {
  const m = path.match(/^theme=([^/]+)\/type=([^/]+)\/part-(\d+)-/)
  return { theme: m[1], type: m[2], part: m[3] }
}

/** Finds a removed ID's changelog row by scanning every removed partition of `release`. */
async function findRemoved(id, release, progress) {
  for (const [theme, type] of REGISTRY_TYPES) {
    const parts = [...(await listParts(`changelog/${release}/theme=${theme}/type=${type}/change_type=removed/`)).entries()]
    let found = null
    let scanned = 0
    const report = () => progress(`Searching ${release}'s removed ${type.replace('_', ' ')}s (${scanned}/${parts.length} files)`)
    report()
    await pool(parts, async ([part, { key, size }]) => {
      // Only the id column is read across the partition; bbox comes from the hit.
      if (await readRow(`${S3}/${key}`, size, id, { columns: ['id'] })) {
        const row = await readRow(`${S3}/${key}`, size, id, { columns: ['id', 'bbox'] })
        found = { theme, type, part, bbox: row.bbox }
      }
      scanned++
      report()
    }, () => found)
    if (found) return found
  }
  return null
}

/** Release parquet file holding theme/type/part in `release`: {url, key, size}, or null. */
async function releaseFile(release, { theme, type, part }) {
  const hit = (await listParts(`release/${release}/theme=${theme}/type=${type}/`)).get(part)
  return hit ? { ...hit, url: `${S3}/${hit.key}` } : null
}

async function readFeature(release, where, id, bbox) {
  const file = await releaseFile(release, where)
  if (!file) return null
  const row = await readRow(file.url, file.size, id, { bbox })
  if (!row) return null
  const { geometry, ...properties } = row
  return { release, url: file.url, s3: `s3://overturemaps-us-west-2/${file.key}`, properties, geometry }
}

/**
 * The registry row, location and record for a GERS ID. History is separate
 * (`loadHistory`) because it costs several times more than everything else.
 * `progress(message)` reports each step. Status is 'current', 'removed' or 'missing'.
 */
export async function lookup(id, progress = () => {}) {
  progress('Reading the release catalog')
  const [cat, changelogReleases, publishedReleases] = await Promise.all([
    catalog(), listReleaseNames('changelog'), listReleaseNames('release'),
  ])
  const latest = cat.latest
  progress('Searching the GERS registry')
  const registry = await registryLookup(id)
  if (!registry) return { id, status: 'missing', latest }

  const published = new Set(publishedReleases)
  const historyReleases = changelogReleases.filter(r => r <= latest).slice(-HISTORY_RELEASES)
  const result = {
    id, latest, registry, published, historyReleases,
    status: registry.path ? 'current' : 'removed',
    removedIn: null, where: null, bbox: null, record: null,
  }

  if (registry.path) {
    result.where = partOf(registry.path)
    result.bbox = registry.bbox
  } else {
    result.removedIn = changelogReleases.find(r => r > registry.last_seen) ?? null
    const removal = result.removedIn && await findRemoved(id, result.removedIn, progress)
    if (removal) {
      const { bbox, ...where } = removal
      result.where = where
      result.bbox = bbox
    }
  }

  if (result.where && published.has(registry.last_seen)) {
    progress(`Reading the feature from release ${registry.last_seen}`)
    result.record = await readFeature(registry.last_seen, result.where, id, result.bbox)
  }
  return result
}

const EVENT_ORDER = { removed: 0, data_changed: 1, added: 2 }

/**
 * Changelog events for a `lookup` result within its history window, newest
 * first. Each event in a still-published release carries the release file `url`.
 * Changelog partitions share the release's spatial partitioning, so only the
 * part matching the feature's file is read.
 */
export async function loadHistory(result, progress = () => {}) {
  const { id, registry, where, bbox, removedIn, published } = result
  if (!where) return []
  const lastRelevant = removedIn ?? registry.last_seen
  const checks = []
  for (const release of result.historyReleases) {
    if (release < registry.first_seen || release > lastRelevant) continue
    for (const changeType of CHANGE_TYPES) {
      // A feature can't change after its last change, or be removed before it first appeared.
      if (changeType === 'data_changed' && release > registry.last_changed) continue
      if (changeType === 'removed' && release <= registry.first_seen) continue
      checks.push([release, changeType])
    }
  }
  let done = 0
  const report = () => progress(`Reading the changelog (${done}/${checks.length} files)`)
  report()
  const events = []
  await pool(checks, async ([release, changeType]) => {
    const parts = await listParts(`changelog/${release}/theme=${where.theme}/type=${where.type}/change_type=${changeType}/`)
    const hit = parts.get(where.part)
    const row = hit && await readRow(`${S3}/${hit.key}`, hit.size, id,
      { bbox, tolerance: HISTORY_BBOX_TOLERANCE, columns: ['id', 'columns_changed'] })
    if (row) {
      const event = { release, change_type: changeType, columns_changed: row.columns_changed ?? null }
      if (changeType !== 'removed' && published.has(release)) event.url = (await releaseFile(release, where))?.url
      events.push(event)
    }
    done++
    report()
  })
  return events.sort((a, b) => b.release.localeCompare(a.release) || EVENT_ORDER[a.change_type] - EVENT_ORDER[b.change_type])
}
