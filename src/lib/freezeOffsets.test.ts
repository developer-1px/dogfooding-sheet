import { describe, it, expect } from 'vitest'
import { freezeOffsets } from './freezeOffsets'

describe('freezeOffsets', () => {
  const rowH = (_r: number) => 28
  const widthOf = (_c: string) => 100

  it('zero freeze → empty arrays', () => {
    const { tops, lefts } = freezeOffsets(0, 0, rowH, widthOf)
    expect(tops).toEqual([])
    expect(lefts).toEqual([])
  })

  it('1 frozen row starts at header_height (30)', () => {
    const { tops } = freezeOffsets(1, 0, rowH, widthOf)
    expect(tops).toEqual([30])
  })

  it('3 frozen rows accumulate row heights from 30 base', () => {
    const { tops } = freezeOffsets(3, 0, rowH, widthOf)
    expect(tops).toEqual([30, 58, 86]) // 30, 30+28, 30+28+28
  })

  it('1 frozen col starts at row_header_width (48)', () => {
    const { lefts } = freezeOffsets(0, 1, rowH, widthOf)
    expect(lefts).toEqual([48])
  })

  it('3 frozen cols accumulate col widths from 48 base', () => {
    const { lefts } = freezeOffsets(0, 3, rowH, widthOf)
    expect(lefts).toEqual([48, 148, 248])
  })

  it('uses per-row/per-col sizes from callbacks', () => {
    const { tops } = freezeOffsets(2, 0, (r) => r === 0 ? 50 : 28, widthOf)
    expect(tops).toEqual([30, 80])
  })
})
