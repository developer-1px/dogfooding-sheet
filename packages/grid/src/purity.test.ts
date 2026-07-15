import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url).pathname
const packageRoot = new URL('..', import.meta.url).pathname

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })

describe('@spredsheet/grid package boundary', () => {
  it('has no runtime dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      private?: boolean
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    expect(pkg.private).not.toBe(true)
    expect(pkg.dependencies ?? {}).toEqual({})
    expect(pkg.peerDependencies ?? {}).toEqual({})
  })

  it('does not import UI, browser, persistence, or app frameworks', () => {
    const forbidden = [
      /\bfrom ['"]react['"]/,
      /\bfrom ['"]react-dom/,
      /\bfrom ['"]@interactive-os\//,
      /\bdocument\b/,
      /\bwindow\b/,
      /\bnavigator\b/,
      /\blocalStorage\b/,
    ]

    const offenders = sourceFiles(root).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return forbidden.some((pattern) => pattern.test(text)) ? [relative(packageRoot, file)] : []
    })

    expect(offenders).toEqual([])
  })
})
