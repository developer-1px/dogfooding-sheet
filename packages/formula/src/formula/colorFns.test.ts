import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('color functions', () => {
  it('LUMA returns relative luminance', () => {
    expect(Number(evaluateCell({}, '=LUMA("#000000")'))).toBe(0)
    expect(Number(evaluateCell({}, '=LUMA("#ffffff")'))).toBeCloseTo(1, 4)
  })

  it('INVERTCOLOR flips RGB', () => {
    expect(evaluateCell({}, '=INVERTCOLOR("#000000")')).toBe('#ffffff')
    expect(evaluateCell({}, '=INVERTCOLOR("#ff8800")')).toBe('#0077ff')
  })

  it('MIX blends two hex colors', () => {
    expect(evaluateCell({}, '=MIX("#000000", "#ffffff", 0.5)')).toBe('#808080')
    expect(evaluateCell({}, '=MIX("#ff0000", "#0000ff", 1)')).toBe('#0000ff')
  })

  it('MIX rejects invalid inputs', () => {
    expect(evaluateCell({}, '=MIX("#000000", "#ffffff", "x")')).toBe('#VALUE!')
    expect(evaluateCell({}, '=MIX("#000000", "nope", 0.5)')).toBe('#VALUE!')
  })

  it('HSL converts to hex', () => {
    expect(evaluateCell({}, '=HSL(0, 100, 50)')).toBe('#ff0000')
    expect(evaluateCell({}, '=HSL(120, 100, 50)')).toBe('#00ff00')
    expect(evaluateCell({}, '=HSL(240, 100, 50)')).toBe('#0000ff')
  })

  it('HSL rejects missing and non-numeric inputs', () => {
    expect(evaluateCell({}, '=HSL()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=HSL(0, "x", 50)')).toBe('#VALUE!')
  })

  it('RANDCOLOR returns hex color', () => {
    expect(evaluateCell({}, '=RANDCOLOR()')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('RGB returns hex color', () => {
    expect(evaluateCell({}, '=RGB(255, 128, 0)')).toBe('#ff8000')
    expect(evaluateCell({}, '=RGB(300, -10, 50)')).toBe('#ff0032')
  })

  it('RGB rejects missing and non-numeric inputs', () => {
    expect(evaluateCell({}, '=RGB()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=RGB(255, "x", 0)')).toBe('#VALUE!')
  })
})
