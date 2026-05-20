import { afterEach, describe, expect, it, vi } from 'vitest'
import { contentTypeForDownload, downloadFile } from './downloadFile'

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('chooses content types from file names', () => {
    expect(contentTypeForDownload('sheet.csv')).toBe('text/csv;charset=utf-8')
    expect(contentTypeForDownload('sheet.JSON')).toBe('application/json;charset=utf-8')
    expect(contentTypeForDownload('notes.txt')).toBe('text/plain;charset=utf-8')
  })

  it('downloads through a temporary anchor and revokes the object URL', () => {
    vi.useFakeTimers()
    let blobType = ''
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobType = (blob as Blob).type
      return 'blob:sheet'
    })
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toBe('blob:sheet')
      expect(this.download).toBe('sheet.json')
      expect(document.body.contains(this)).toBe(true)
    })

    downloadFile('sheet.json', '{"ok":true}')

    expect(blobType).toBe('application/json;charset=utf-8')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download="sheet.json"]')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:sheet')
  })
})
