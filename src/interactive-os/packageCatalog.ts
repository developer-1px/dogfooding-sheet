import { docFor } from '@interactive-os/document'
import { createPackageDoc } from '@interactive-os/playground-catalog'

const CATALOG_SOURCE = `
/** Local package catalog for the spreadsheet dogfood runtime. */
export function interactiveOsPackages() {}
`

const summary = docFor(CATALOG_SOURCE, 'interactiveOsPackages') ?? ''

export const interactiveOsPackages = [
  '@interactive-os/aria-kernel',
  '@interactive-os/anyeditable',
  '@interactive-os/keyboard',
  '@interactive-os/devtools',
  '@interactive-os/document',
  '@interactive-os/playground-catalog',
  'zod-crud',
].map((name) => createPackageDoc({
  packageJson: { name, version: 'local', description: summary, license: 'MIT' },
  readme: summary,
  publicExports: [],
}))
