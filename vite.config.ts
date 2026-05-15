import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@spredsheet\/formula$/, replacement: local('./packages/formula/src/index.ts') },
      { find: /^@aria\/engine$/, replacement: local('./src/interactive-os/devtoolsAriaShims.ts') },
      { find: /^@aria\/primitives$/, replacement: local('./src/interactive-os/devtoolsAriaShims.ts') },
      { find: /^@interactive-os\/aria-kernel$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/index.js') },
      { find: /^@interactive-os\/aria-kernel\/patterns$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/patterns/index.js') },
      { find: /^@interactive-os\/aria-kernel\/gesture$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/gesture/index.js') },
      { find: /^@interactive-os\/aria-kernel\/key$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/key/index.js') },
      { find: /^@interactive-os\/aria-kernel\/(.+)$/, replacement: local('./node_modules/@interactive-os/aria-kernel/dist/$1.js') },
      { find: /^@interactive-os\/anyeditable$/, replacement: local('./node_modules/@interactive-os/anyeditable/dist/index.js') },
      { find: /^zod-crud$/, replacement: local('./node_modules/zod-crud/dist/index.js') },
    ],
    conditions: ['import', 'module', 'browser', 'default'],
  },
})
