// Renders a GERS ID page in the browser from gers.js lookups, matching the
// markup gers.page renders on its server. With no ?id= the home page stays.

import { qrcode } from 'qrcode-generator'
import { lookup, loadHistory, transfer, S3, TILES, UUID_RE } from './gers.js'

const main = document.getElementById('main')
const GERS_EPOCH = '2025-06-25.0'

const TYPE_LABEL = {
  place: 'Place', building: 'Building', segment: 'Transportation segment', connector: 'Transportation connector',
  division: 'Division', division_area: 'Division area', division_boundary: 'Division boundary',
}
const THEME_LABEL = { places: 'Places', buildings: 'Buildings', transportation: 'Transportation', divisions: 'Divisions' }
const CHANGE_LABEL = { added: 'Added', data_changed: 'Changed', removed: 'Removed' }
const DATASET_URL = {
  BrightQuery: 'https://brightquery.com/',
  'Esri Community Maps': 'https://communitymaps.arcgis.com/home/',
  'Microsoft ML Buildings': 'https://github.com/microsoft/GlobalMLBuildingFootprints',
  OpenStreetMap: 'https://www.openstreetmap.org/',
  Overture: 'https://docs.overturemaps.org/',
}
const LICENSE_URL = {
  'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CDLA-Permissive-2.0': 'https://cdla.dev/permissive-2-0/',
  'ODbL-1.0': 'https://opendatacommons.org/licenses/odbl/1-0/',
}
const OSM_TYPE = { n: 'node', w: 'way', r: 'relation' }
const ICON_COPY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/></svg>'
const ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13.5a4.5 4.5 0 0 0 6.4.5l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4-.5l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/></svg>'
const RECENT_KEY = 'gers-static-lookup:recent'
const RECENT_MAX = 10

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const humanize = s => s ? s[0].toUpperCase() + s.slice(1).replaceAll('_', ' ') : ''
const yesNo = b => b ? 'Yes' : 'No'
const fixed2 = n => typeof n === 'number' ? n.toFixed(2) : ''
const pageUrl = id => `${location.origin}${location.pathname}?id=${id}`
const idLink = id => `<a href="?id=${esc(id)}"><code>${esc(id)}</code></a>`
const extLink = url => `<a href="${esc(url)}" rel="nofollow noopener noreferrer">${esc(url)}</a>`
const copyButton = (text, label) => `<button type="button" class="copy" data-copy="${esc(text)}">${label}</button>`
const iconCopyButton = (text, label, icon) =>
  `<button type="button" class="copy icon" data-copy="${esc(text)}" aria-label="${label}">${icon}</button>`
const linkTo = (url, text) => url ? `<a href="${esc(url)}">${esc(text)}</a>` : esc(text)
const humanEsc = s => esc(humanize(s ?? ''))
const jsonText = v => JSON.stringify(v, (k, x) => typeof x === 'bigint' ? Number(x) : x, 2)
const isEmpty = v => v === null || v === undefined || (Array.isArray(v) && !v.length)

/** Nested record as gers.page shows it: dl for objects, ul for arrays, nulls dropped. */
function renderValue(value, key = '') {
  if (Array.isArray(value)) return `<ul class="arr">${value.map(v => `<li>${renderValue(v, key)}</li>`).join('')}</ul>`
  if (value && typeof value === 'object') {
    const rows = Object.entries(value).filter(([, v]) => !isEmpty(v))
    return `<dl class="obj">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${renderValue(v, k)}</dd>`).join('')}</dl>`
  }
  if (typeof value === 'string' && UUID_RE.test(value) && /ids?$/.test(key)) return idLink(value)
  if (typeof value === 'string' && /^https?:\/\//.test(value)) return extLink(value)
  return esc(value)
}

function formatAddress(a) {
  return a ? [a.freeform, a.locality, a.region, a.postcode, a.country].filter(Boolean).join(', ') : ''
}

function taxonomyPath(hierarchy) {
  return `<span class="path">${hierarchy.map(humanEsc).map(s => `<span>${s}</span>`)
    .join('<span class="sep" aria-hidden="true">›</span>')}</span>`
}

/** Hero subtitle and [label, html] key-attribute rows for each registry type. */
function describe(type, p) {
  const division = () => [
    ['Subtype', humanEsc(p.subtype)], ['Class', humanEsc(p.class)],
    ['Country', esc(p.country ?? '')], ['Region', esc(p.region ?? '')],
  ]
  switch (type) {
    case 'place': return {
      subtitle: [humanize(p.basic_category ?? p.categories?.primary), formatAddress(p.addresses?.[0])],
      rows: [
        ['Category', humanEsc(p.basic_category ?? p.categories?.primary)],
        ['Taxonomy', p.taxonomy?.hierarchy ? taxonomyPath(p.taxonomy.hierarchy) : ''],
        ['Address', esc(formatAddress(p.addresses?.[0]))],
        ['Brand', esc(p.brand?.names?.primary ?? '')],
        ['Websites', (p.websites ?? []).map(extLink).join('<br>')],
        ['Socials', (p.socials ?? []).map(extLink).join('<br>')],
        ['Emails', esc((p.emails ?? []).join(', '))],
        ['Phones', esc((p.phones ?? []).join(', '))],
        ['Operating status', humanEsc(p.operating_status)],
        ['Confidence', fixed2(p.confidence)],
      ],
    }
    case 'building': return {
      subtitle: [humanize(p.class ?? p.subtype) || 'Building', p.height ? `${p.height.toFixed(1)} m tall` : ''],
      rows: [
        ['Subtype', humanEsc(p.subtype)], ['Class', humanEsc(p.class)],
        ['Height', p.height ? `${p.height.toFixed(1)} m` : ''],
        ['Floors', esc(p.num_floors ?? '')],
        ['Underground', yesNo(p.is_underground)], ['Has parts', yesNo(p.has_parts)],
      ],
    }
    case 'segment': return {
      subtitle: [humanize(p.subtype), humanize(p.class)],
      rows: [
        ['Subtype', humanEsc(p.subtype)], ['Class', humanEsc(p.class)], ['Subclass', humanEsc(p.subclass)],
        ['Surface', isEmpty(p.road_surface) ? '' : renderValue(p.road_surface)],
        ['Speed limits', isEmpty(p.speed_limits) ? '' : renderValue(p.speed_limits)],
      ],
    }
    case 'division': return {
      subtitle: [humanize(p.subtype), p.region],
      rows: [
        ...division(),
        ['Population', p.population ? Number(p.population).toLocaleString('en-US') : ''],
        ['Wikidata', p.wikidata ? `<a href="https://www.wikidata.org/wiki/${esc(p.wikidata)}" rel="nofollow noopener noreferrer">${esc(p.wikidata)}</a>` : ''],
        ['Parent division', p.parent_division_id ? idLink(p.parent_division_id) : ''],
      ],
    }
    case 'division_area': return {
      subtitle: [humanize(p.subtype), p.region],
      rows: [
        ...division(), ['Admin level', esc(p.admin_level ?? '')],
        ['Division', p.division_id ? idLink(p.division_id) : ''],
        ['Land', yesNo(p.is_land)], ['Territorial', yesNo(p.is_territorial)],
      ],
    }
    case 'division_boundary': return {
      subtitle: [humanize(p.subtype), p.region],
      rows: [
        ...division(), ['Admin level', esc(p.admin_level ?? '')],
        ['Divisions', isEmpty(p.division_ids) ? '' : `<ul class="arr">${p.division_ids.map(i => `<li>${idLink(i)}</li>`).join('')}</ul>`],
        ['Disputed', yesNo(p.is_disputed)],
      ],
    }
    default: return { subtitle: [humanize(type)], rows: [] }
  }
}

function sectionHero(r) {
  const { registry, record, where } = r
  const p = record?.properties ?? {}
  const label = TYPE_LABEL[where?.type] ?? 'Feature'
  const { subtitle } = describe(where?.type, p)
  let banner = ''
  if (r.status === 'removed') {
    const detail = record
      ? `The details below come from release ${esc(record.release)}, the last one that contained it.`
      : `Release ${esc(registry.last_seen)} is no longer published, so its details aren't available.`
    const removed = r.removedIn ? ` and was removed in release <strong>${esc(r.removedIn)}</strong>` : ''
    banner = `<div class="banner retired" role="status">
    <strong class="pill">Removed</strong>
    <span>This GERS ID was last in release <strong>${esc(registry.last_seen)}</strong>${removed}. ${detail}</span>
  </div>`
  }
  const kind = where ? `<p class="kind">${label} · <span>${THEME_LABEL[where.theme]}</span></p>` : ''
  const subtitleText = subtitle.filter(Boolean).join(' · ')
  return `<section class="hero">${banner}${kind}
    <h1>${esc(p.names?.primary ?? `Unnamed ${label.toLowerCase()}`)}</h1>
    ${subtitleText ? `<p class="subtitle">${esc(subtitleText)}</p>` : ''}</section>`
}

function qrSvg(text) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  const quiet = 2
  let path = ''
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`
    }
  }
  const size = n + quiet * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`
    + `<path fill="#fff" d="M0 0h${size}v${size}H0z"/><path fill="#111" d="${path}"/></svg>`
}

function svgToPngUrl(svg, px) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = px
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, px, px)
      canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png')
    }
    img.onerror = reject
    img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  })
}

function explorerUrl(r) {
  const b = r.bbox
  if (!b) return null
  const span = Math.max(b.xmax - b.xmin, b.ymax - b.ymin)
  const zoom = span > 0 ? Math.min(18, Math.max(2, Math.log2(360 / span) - 1.5)) : 18
  const hash = `#${zoom.toFixed(2)}/${((b.ymin + b.ymax) / 2).toFixed(6)}/${((b.xmin + b.xmax) / 2).toFixed(6)}`
  const feature = r.status === 'current' ? `?feature=${r.where.theme}.${r.where.type}.${r.id}` : ''
  return `https://explore.overturemaps.org/${feature}${hash}`
}

function sectionIdAndMap(r) {
  const url = pageUrl(r.id)
  const explorer = explorerUrl(r)
  const gone = r.status === 'removed'
    ? ' <span class="muted small">The Explorer shows the latest release, which no longer has this feature.</span>' : ''
  return `<div class="grid">
  <section class="card id-card" aria-labelledby="id-h">
    <h2 id="id-h">GERS ID</h2>
    <div class="gers-id">
      <code id="gers-id">${esc(r.id)}</code>
      ${iconCopyButton(r.id, 'Copy ID', ICON_COPY)}
      ${iconCopyButton(url, 'Copy permanent link', ICON_LINK)}
    </div>
    <p class="visually-hidden" role="status" aria-live="polite" data-copy-status></p>
    <div class="share">
      <div class="qr" aria-label="QR code for this page">${qrSvg(url)}</div>
      <div class="share-text">
        <p class="label">QR code</p>
        <p class="muted small">Scan it to open this page.</p>
        <p class="small">Download <a id="qr-svg" download="gers-${esc(r.id)}.svg">SVG</a> ·
          <a id="qr-png" download="gers-${esc(r.id)}.png">PNG</a></p>
      </div>
    </div>
  </section>
  <section class="card map-card" aria-labelledby="map-h">
    <h2 id="map-h" class="visually-hidden">Map</h2>
    ${r.bbox ? `<div id="map" class="map" role="img" aria-label="Map showing where this feature is" title="Open in the Overture Explorer"></div>
    <p class="map-foot"><a href="${esc(explorer)}">Open in the Overture Explorer ↗</a>${gone}</p>`
      : '<p class="map map-empty muted">No location is recorded for this ID.</p>'}
  </section>
</div>`
}

function sectionAttributes(r) {
  const { record } = r
  if (!record) return ''
  const rows = describe(r.where.type, record.properties).rows.filter(([, html]) => html !== '')
  const table = rows.length
    ? `<table class="fields"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`
    : '<p class="muted">This type has no headline attributes; see the full record.</p>'
  return `<section class="card" aria-labelledby="attr-h">
  <h2 id="attr-h">Key attributes</h2>
  ${table}
  <details class="full-record">
    <summary>Full record (release ${esc(record.release)})</summary>
    ${renderValue(record.properties)}
  </details>
</section>`
}

function attributionName(s) {
  return s.dataset === 'OpenStreetMap' ? '© OpenStreetMap contributors' : s.dataset
}

function sourceOrigin(s) {
  return s.provider === s.resource ? s.provider ?? '' : `${s.provider ?? ''} / ${s.resource ?? ''}`
}

/** Record id, linked to the exact OSM version for OpenStreetMap ids like "w428248878@7". */
function recordCell(s) {
  if (!s.record_id) return ''
  const osm = s.dataset === 'OpenStreetMap' && s.record_id.match(/^([nwr])(\d+)@(\d+)$/)
  if (!osm) return `<code>${esc(s.record_id)}</code>`
  const url = `https://www.openstreetmap.org/${OSM_TYPE[osm[1]]}/${osm[2]}/history/${osm[3]}`
  return `<a href="${url}" title="View this version on OpenStreetMap" rel="nofollow noopener noreferrer"><code>${esc(s.record_id)}</code></a>`
}

function sectionSources(r) {
  const sources = r.record?.properties.sources
  if (isEmpty(sources)) return ''
  const credits = [...new Set(sources.map(s => `${attributionName(s)} (${s.license})`))]
  return `<section class="card" aria-labelledby="src-h">
  <h2 id="src-h">Sources</h2>
  <div class="scroll">
  <table class="sources">
    <thead><tr><th>Dataset</th><th>Property</th><th>Record</th><th>Updated</th><th>Confidence</th><th>Licence</th></tr></thead>
    <tbody>${sources.map(s => `
      <tr>
        <td>${linkTo(DATASET_URL[s.dataset], s.dataset ?? '')}<br><span class="muted">${esc(sourceOrigin(s))}</span></td>
        <td><code>${esc(s.property || '(whole feature)')}</code></td>
        <td>${recordCell(s)}</td>
        <td class="nowrap">${s.update_time ? `<time datetime="${esc(s.update_time)}" title="${esc(s.update_time)}">${esc(s.update_time.slice(0, 10))}</time>` : ''}</td>
        <td>${fixed2(s.confidence)}</td>
        <td class="nowrap">${linkTo(LICENSE_URL[s.license], s.license ?? '')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  </div>
  <p class="attribution">Attribution: ${esc(credits.join('; '))}.
    See <a href="https://docs.overturemaps.org/attribution/">Overture's attribution guide</a>.</p>
</section>`
}

/** DuckDB query that reads one feature from `url`, bbox-filtered so DuckDB skips most of the file. */
function duckdbQuery(url, id, b, pad) {
  const range = (lo, v) => `${lo} BETWEEN ${(v - pad).toFixed(6)} AND ${(v + pad).toFixed(6)}`
  return `SELECT * FROM read_parquet('${url}') WHERE id = '${id}' AND ${range('bbox.xmin', b.xmin)} AND ${range('bbox.ymin', b.ymin)};`
}

function querySnippet(query) {
  return `<div class="code">
  <div class="code-bar"><span>DuckDB</span>${copyButton(query, 'Copy query')}</div>
  <pre><code>${esc(query)}</code></pre>
</div>`
}

function sectionHistoryShell(r) {
  const { registry } = r
  const epoch = registry.first_seen === GERS_EPOCH
    ? `<p class="muted">${GERS_EPOCH} is when Overture switched to the current GERS ID scheme, so most IDs were first
    seen then whatever the feature's real age.</p>` : ''
  return `<section class="card" aria-labelledby="hist-h">
  <h2 id="hist-h">History</h2>
  <dl class="dates">
    <div><dt>First seen</dt><dd>${esc(registry.first_seen)}</dd></div>
    <div><dt>Last changed</dt><dd>${esc(registry.last_changed)}</dd></div>
    <div><dt>Last seen</dt><dd>${esc(registry.last_seen)}</dd></div>
    <div><dt>Registry version</dt><dd>${esc(registry.version)}</dd></div>
  </dl>
  ${epoch}
  <div id="history-events"><p class="loading"><span class="spinner" aria-hidden="true"></span><span id="history-progress">Reading the changelog</span></p></div>
  <p class="muted">From Overture's public GERS changelog, releases ${esc(r.historyReleases[0])} to ${esc(r.historyReleases.at(-1))}.
    It doesn't record changes to sources or confidence alone, or splits and merges; a restored feature shows as added.
    Only the last three months of releases are published, so older events have no data link.</p>
</section>`
}

function renderEvents(r, events) {
  if (!events.length) {
    return `<p class="muted">No changes recorded in releases ${esc(r.historyReleases[0])} to ${esc(r.historyReleases.at(-1))}.</p>`
  }
  return `<ol class="events">${events.map(e => {
    const cols = isEmpty(e.columns_changed) ? '' : `<span class="cols">${esc(e.columns_changed.join(', '))}</span>`
    const data = e.url ? `<details class="snippet">
        <summary>Data in ${esc(e.release)}</summary>
        <p><a href="${esc(e.url)}">${esc(e.url.split('/').pop())}</a></p>
        ${querySnippet(duckdbQuery(e.url, r.id, r.bbox, 1e-4))}
      </details>` : ''
    return `<li class="event ${esc(e.change_type)}">
      <span class="release">${esc(e.release)}</span>
      <span class="change">${CHANGE_LABEL[e.change_type]}</span>${cols}${data}
    </li>`
  }).join('')}</ol>`
}

function sectionDevelopers(r) {
  const { record, registry } = r
  const parquet = record ? `<li>Parquet file (${esc(record.release)}): <a href="${esc(record.url)}">${esc(record.url.split('/').pop())}</a><br>
      <code class="path">${esc(record.s3)}</code></li>` : ''
  const duckdb = record ? `<h3>DuckDB</h3>
  <p class="muted">The bbox filter lets DuckDB skip almost all of the file.</p>
  ${querySnippet(duckdbQuery(record.url, r.id, r.bbox, 1e-5))}` : ''
  return `<section class="card" aria-labelledby="dev-h">
  <h2 id="dev-h">For developers</h2>
  <ul class="dev">
    <li><a id="json-link" download="${esc(r.id)}.json">This page as JSON</a></li>
    ${parquet}
  </ul>
  ${duckdb}
  <h3>GERS registry</h3>
  ${querySnippet(`SELECT * FROM '${registry.file}' WHERE id = '${r.id}';`)}
  <p class="muted stats" id="stats"></p>
</section>`
}

function renderMissing(id) {
  document.title = 'Not found · GERS ID pages'
  main.innerHTML = `<section class="hero">
  <h1>No feature has this GERS ID</h1>
  <p class="subtitle"><code>${esc(id)}</code> isn't in Overture's GERS registry and has no recorded history.</p>
  <ul class="reasons">
    <li>It may be a base-theme feature, a building part or an address. Those have IDs but aren't registered.</li>
    <li>It may have a typo. Check it against where you copied it from.</li>
    <li>It may come from a release newer than the registry. Try again after the next release.</li>
  </ul>
  <form class="lookup big" action="./" method="get" role="search">
    <input name="id" placeholder="Paste a GERS ID" aria-label="GERS ID" autocomplete="off" spellcheck="false" required>
    <button type="submit">Look up</button>
  </form>
</section>`
}

function renderInvalid(raw) {
  document.title = 'Not a GERS ID · GERS ID pages'
  main.innerHTML = `<section class="hero">
  <h1>That isn't a GERS ID</h1>
  <p class="subtitle"><code>${esc(raw)}</code> isn't a UUID. GERS IDs look like
    <code>3b115ca6-ca2e-4704-9d05-941563714caf</code>.</p>
  <form class="lookup big" action="./" method="get" role="search">
    <input name="id" placeholder="Paste a GERS ID" aria-label="GERS ID" autocomplete="off" spellcheck="false" required>
    <button type="submit">Look up</button>
  </form>
</section>`
}

function renderError(id, err) {
  main.innerHTML = `<section class="hero">
  <h1>Couldn't load this GERS ID</h1>
  <p class="subtitle"><code>${esc(id)}</code></p>
  <p class="error">${esc(err.message ?? err)}</p>
  <p class="muted">Reads go straight from your browser to Overture's S3 bucket. A flaky connection or an
    ad blocker can interrupt them; <a href="">reload</a> to retry.</p>
</section>`
}

/** gers.page's JSON shape, built from what this page loaded. */
function pageJson(r, history) {
  const b = r.registry.bbox
  return {
    id: r.id,
    status: r.status,
    theme: r.where?.theme ?? null,
    type: r.where?.type ?? null,
    registry: { ...r.registry, file: undefined, bbox: b ? [b.xmin, b.ymin, b.xmax, b.ymax] : null },
    record: r.record && {
      release: r.record.release, files: [r.record.s3],
      properties: r.record.properties, geometry: r.record.geometry,
    },
    history: history?.map(({ url, ...e }) => ({ ...e, theme: r.where.theme, type: r.where.type })) ?? null,
    links: { page: pageUrl(r.id), explorer: explorerUrl(r) },
    history_releases: r.historyReleases,
  }
}

function setJsonLink(r, history) {
  const link = document.getElementById('json-link')
  if (link.href) URL.revokeObjectURL(link.href)
  link.href = URL.createObjectURL(new Blob([jsonText(pageJson(r, history))], { type: 'application/json' }))
}

function setStats(started) {
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  document.getElementById('stats').textContent =
    `Loaded in ${seconds} s: ${transfer.requests} requests, ${(transfer.bytes / 1e6).toFixed(1)} MB, straight from Overture's bucket. No server involved.`
}

function drawMap(r) {
  const el = document.getElementById('map')
  if (!el || !window.maplibregl || !window.pmtiles) return
  maplibregl.addProtocol('pmtiles', new pmtiles.Protocol().tile)

  const HIGHLIGHT = '#4051cc'
  const POLY = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false]
  const LINE = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false]
  const POINT = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false]
  const tiles = theme => ({ type: 'vector', url: `pmtiles://${TILES}/${r.latest}/${theme}.pmtiles` })
  const b = r.bbox
  const isPoint = b.xmin === b.xmax && b.ymin === b.ymax
  const ring = [[b.xmin, b.ymin], [b.xmax, b.ymin], [b.xmax, b.ymax], [b.xmin, b.ymax], [b.xmin, b.ymin]]
  const geometry = r.record?.geometry
    ?? (isPoint ? { type: 'Point', coordinates: [b.xmin, b.ymin] } : { type: 'Polygon', coordinates: [ring] })

  const map = new maplibregl.Map({
    container: el,
    style: {
      version: 8,
      sources: {
        base: tiles('base'), transportation: tiles('transportation'), buildings: tiles('buildings'),
        feature: { type: 'geojson', data: { type: 'Feature', geometry, properties: {} } },
      },
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#eef2f7' } },
        { id: 'land', type: 'fill', source: 'base', 'source-layer': 'land', filter: POLY, paint: { 'fill-color': '#e7ecf3' } },
        { id: 'water', type: 'fill', source: 'base', 'source-layer': 'water', filter: POLY, paint: { 'fill-color': '#bfe6e8' } },
        { id: 'roads', type: 'line', source: 'transportation', 'source-layer': 'segment',
          filter: ['==', ['get', 'subtype'], 'road'],
          paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 16, 6] } },
        { id: 'rail', type: 'line', source: 'transportation', 'source-layer': 'segment',
          filter: ['==', ['get', 'subtype'], 'rail'],
          paint: { 'line-color': '#a3acbd', 'line-width': 1, 'line-dasharray': [3, 2] } },
        { id: 'buildings', type: 'fill', source: 'buildings', 'source-layer': 'building', minzoom: 13,
          paint: { 'fill-color': '#d9dfea', 'fill-outline-color': '#c3cbdb' } },
        { id: 'hl-fill', type: 'fill', source: 'feature', filter: POLY, paint: { 'fill-color': HIGHLIGHT, 'fill-opacity': 0.25 } },
        { id: 'hl-line', type: 'line', source: 'feature', filter: ['any', POLY, LINE], paint: { 'line-color': HIGHLIGHT, 'line-width': 3 } },
        { id: 'hl-point', type: 'circle', source: 'feature', filter: POINT,
          paint: { 'circle-color': HIGHLIGHT, 'circle-radius': 7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } },
      ],
    },
    bounds: [[b.xmin, b.ymin], [b.xmax, b.ymax]],
    fitBoundsOptions: { padding: 40, maxZoom: isPoint ? 16 : 17 },
    interactive: false,
    attributionControl: {
      compact: true,
      customAttribution: '<a href="https://docs.overturemaps.org/attribution/">© Overture Maps Foundation and contributors</a>',
    },
  })
  map.on('error', e => console.warn('map:', e?.error))
  const explorer = explorerUrl(r)
  el.classList.add('clickable')
  el.addEventListener('click', ev => {
    if (!ev.target.closest('.maplibregl-ctrl')) location.href = explorer
  })
}

async function setQrDownloads(id) {
  const svg = qrSvg(pageUrl(id))
  document.getElementById('qr-svg').href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  document.getElementById('qr-png').href = await svgToPngUrl(svg, 1024)
}

function flash(btn, text) {
  const status = document.querySelector('[data-copy-status]')
  if (status) status.textContent = text
  if (btn.classList.contains('icon')) {
    btn.dataset.flash = text
    setTimeout(() => { delete btn.dataset.flash }, 1500)
    return
  }
  btn.dataset.label ??= btn.textContent
  btn.textContent = text
  setTimeout(() => { btn.textContent = btn.dataset.label }, 1500)
}

// Per-browser stand-in for gers.page's server-side "Recently looked up" list.
function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []
  } catch {
    return []
  }
}

function rememberLookup(entry) {
  const recent = [entry, ...readRecent().filter(e => e.id !== entry.id)].slice(0, RECENT_MAX)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    // Storage can be blocked (private mode); the list is a convenience.
  }
}

function renderRecent() {
  const recent = readRecent()
  if (!recent.length) return
  document.getElementById('recent-list').innerHTML = recent.map(e => `<li><a href="?id=${esc(e.id)}">
  <span class="name">${esc(e.name)}</span>
  <span class="meta">${esc(e.label)}${e.removed ? ' <span class="tag">Removed</span>' : ''}</span>
</a></li>`).join('')
  document.getElementById('recent').hidden = false
}

document.addEventListener('click', ev => {
  const btn = ev.target.closest?.('button.copy')
  if (!btn) return
  navigator.clipboard.writeText(btn.dataset.copy).then(() => flash(btn, 'Copied'), () => flash(btn, 'Copy failed'))
})

async function show(raw) {
  document.getElementById('home-hero').hidden = true
  document.getElementById('header-lookup').hidden = false
  const id = raw.trim().toLowerCase()
  for (const input of document.querySelectorAll('form.lookup input')) input.value = id
  if (!UUID_RE.test(id)) return renderInvalid(raw)

  const started = performance.now()
  main.innerHTML = `<section class="hero"><p class="kind">GERS ID</p><h1><code>${esc(id)}</code></h1>
    <p class="loading"><span class="spinner" aria-hidden="true"></span><span id="progress">Starting</span></p></section>`
  const progress = msg => { document.getElementById('progress').textContent = msg }

  let r
  try {
    r = await lookup(id, progress)
  } catch (err) {
    console.error(err)
    return renderError(id, err)
  }
  if (r.status === 'missing') return renderMissing(id)

  const name = r.record?.properties.names?.primary ?? `Unnamed ${(TYPE_LABEL[r.where?.type] ?? 'feature').toLowerCase()}`
  document.title = `${name} · GERS ID ${id}`
  rememberLookup({ id, name, label: TYPE_LABEL[r.where?.type] ?? 'Feature', removed: r.status === 'removed' })
  main.innerHTML = sectionHero(r) + sectionIdAndMap(r) + sectionAttributes(r) + sectionSources(r)
    + sectionHistoryShell(r) + sectionDevelopers(r)
  setJsonLink(r, null)
  setStats(started)
  setQrDownloads(id)
  if (r.bbox) drawMap(r)

  const historyEl = document.getElementById('history-events')
  try {
    const events = await loadHistory(r, msg => { document.getElementById('history-progress').textContent = msg })
    historyEl.innerHTML = renderEvents(r, events)
    setJsonLink(r, events)
  } catch (err) {
    console.error(err)
    historyEl.innerHTML = `<p class="error">Couldn't read the changelog: ${esc(err.message ?? err)}</p>`
  }
  setStats(started)
}

const requested = new URLSearchParams(location.search).get('id')
if (requested) show(requested)
else renderRecent()
