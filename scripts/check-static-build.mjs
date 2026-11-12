import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const output = resolve('dist')
const html = readFileSync(resolve(output, 'index.html'), 'utf8')
const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
  .map(match => match[1])
  .filter(path => !/^(https?:|data:)/.test(path))

assert(assets.length >= 3, 'Build must contain its entry script, stylesheet and favicon')
for (const asset of assets) {
  assert(asset.startsWith('./'), `GitHub Pages needs a relative entry asset: ${asset}`)
  const file = resolve(output, asset)
  assert(existsSync(file), `Missing build asset: ${asset}`)
  if (!file.endsWith('.css')) continue
  const css = readFileSync(file, 'utf8')
  for (const match of css.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)) {
    const url = match[2]
    if (/^(data:|https?:)/.test(url)) continue
    assert(!url.startsWith('/'), `CSS asset breaks a Pages subpath: ${url}`)
    assert(existsSync(resolve(dirname(file), url)), `Missing CSS asset: ${url}`)
  }
}
console.log('Static build OK: relative entry assets and CSS resources resolve.')
