#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs']
const layerRank = new Map([
  ['shared', 0],
  ['entities', 1],
  ['features', 2],
  ['widgets', 3],
  ['app', 4],
])

const walk = (directory, files = []) => {
  if (!fs.existsSync(directory)) return files
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else if (extensions.includes(path.extname(entry.name))) files.push(file)
  }
  return files
}

const relativePath = (file) => path.relative(root, file).split(path.sep).join('/')

const resolveRelative = (fromFile, specifier) => {
  const base = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [
    base,
    ...extensions.map((extension) => `${base}${extension}`),
    ...extensions.map((extension) => path.join(base, `index${extension}`)),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
}

const moduleSpecifiers = (file) => {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') || file.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const specifiers = []
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments
      if (argument && ts.isStringLiteral(argument)) specifiers.push(argument.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return specifiers
}

const sourceTarget = (fromFile, specifier) => {
  if (specifier.startsWith('.')) {
    const resolved = resolveRelative(fromFile, specifier)
    return resolved ? relativePath(resolved) : null
  }
  if (specifier.startsWith('@/')) return `src/${specifier.slice(2)}`
  if (specifier.startsWith('src/')) return specifier
  return null
}

const sourceLayer = (file) => {
  if (!file.startsWith('src/')) return null
  const layer = file.split('/')[1]
  return layerRank.has(layer) ? layer : null
}

const packageSourceImports = new Set()
for (const file of walk(path.join(root, 'packages'))) {
  for (const specifier of moduleSpecifiers(file)) {
    const target = sourceTarget(file, specifier)
    if (target?.startsWith('src/')) packageSourceImports.add(`${relativePath(file)} -> ${target}`)
  }
}

const featureCrossImports = new Set()
const upwardImports = new Set()
for (const file of walk(path.join(root, 'src'))) {
  const source = relativePath(file)
  const fromLayer = sourceLayer(source)
  if (!fromLayer) continue
  const fromFeature = source.startsWith('src/features/') ? source.split('/')[2] : null

  for (const specifier of moduleSpecifiers(file)) {
    const target = sourceTarget(file, specifier)
    if (!target) continue
    const targetLayer = sourceLayer(target)
    if (!targetLayer) continue

    if (fromFeature && target.startsWith('src/features/')) {
      const targetFeature = target.split('/')[2]
      if (targetFeature !== fromFeature) featureCrossImports.add(`${source} -> ${target}`)
    }
    if (layerRank.get(targetLayer) > layerRank.get(fromLayer)) {
      upwardImports.add(`${source} -> ${target}`)
    }
  }
}

const groups = [
  ['Package src imports', packageSourceImports],
  ['Feature cross imports', featureCrossImports],
  ['Layer upward imports', upwardImports],
]

for (const [label, rows] of groups) {
  console.log(`${label}: ${rows.size}`)
  for (const row of rows) console.log(`  ${row}`)
}

if (groups.some(([, rows]) => rows.size > 0)) process.exitCode = 1
