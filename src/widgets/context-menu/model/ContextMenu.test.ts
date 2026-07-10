import { describe, expect, it, vi } from 'vitest'
import { runMenuItemAction } from './contextMenuActions'

const flush = () => Promise.resolve()

describe('ContextMenu actions', () => {
  it('runs actions and absorbs sync or async failures', async () => {
    const ok = vi.fn()

    expect(() => runMenuItemAction(() => { throw new Error('blocked') })).not.toThrow()
    expect(() => runMenuItemAction(() => Promise.reject(new Error('blocked')))).not.toThrow()
    runMenuItemAction(ok)
    await flush()

    expect(ok).toHaveBeenCalledOnce()
  })
})
