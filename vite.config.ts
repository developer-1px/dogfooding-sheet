import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: [
      { find: /^@spredsheet\/editable-grid\/cell-display$/, replacement: local('./packages/editable-grid/src/cellDisplay.ts') },
      { find: /^@spredsheet\/editable-grid\/contract$/, replacement: local('./packages/editable-grid/src/contract.ts') },
      { find: /^@spredsheet\/editable-grid\/primitives$/, replacement: local('./packages/editable-grid/src/primitives.ts') },
      { find: /^@spredsheet\/editable-grid\/resize-rules$/, replacement: local('./packages/editable-grid/src/resizeRules.ts') },
      { find: /^@spredsheet\/editable-grid$/, replacement: local('./packages/editable-grid/src/index.ts') },
      { find: /^@spredsheet\/formula$/, replacement: local('./packages/formula/src/index.ts') },
      { find: /^@spredsheet\/grid$/, replacement: local('./packages/grid/src/index.ts') },
      { find: /^@spredsheet\/surface$/, replacement: local('./packages/surface/src/index.ts') },
      { find: /^@aria\/engine$/, replacement: local('./src/interactive-os/devtoolsARIAShims.ts') },
      { find: /^@aria\/primitives$/, replacement: local('./src/interactive-os/devtoolsARIAShims.ts') },
      { find: /^@interactive-os\/aria$/, replacement: local('./node_modules/@interactive-os/aria/dist/index.js') },
      { find: /^@interactive-os\/aria\/react$/, replacement: local('./node_modules/@interactive-os/aria/dist/react.js') },
      { find: /^@interactive-os\/aria-kernel$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/index.js') },
      { find: /^@interactive-os\/aria-kernel\/patterns$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/patterns/index.js') },
      { find: /^@interactive-os\/aria-kernel\/gesture$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/gesture/index.js') },
      { find: /^@interactive-os\/aria-kernel\/key$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/key/index.js') },
      { find: /^@interactive-os\/aria-kernel\/(.+)$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/$1.js') },
      { find: /^@interactive-os\/anyeditable$/, replacement: local('./node_modules/@interactive-os/anyeditable/dist/index.js') },
      { find: /^@interactive-os\/playground-catalog$/, replacement: local('../playground-catalog/src/index.mjs') },
      { find: /^zod-crud$/, replacement: local('./node_modules/zod-crud/dist/index.js') },
    ],
    conditions: ['import', 'module', 'browser', 'default'],
  },
})
