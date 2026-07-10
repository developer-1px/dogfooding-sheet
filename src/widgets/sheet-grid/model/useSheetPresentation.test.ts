import { describe, expect, it } from 'vitest'
import { createDisplay } from './useSheetPresentation'
import type { Format } from '../../../entities/CellFormat/formatTypes'

const plain = () => 'plain' as Format

describe('createDisplay', () => {
  it('evaluates formulas and applies cell formats', () => {
    const display = createDisplay({ A1: '2', A2: '=A1*3', A3: '0.25' }, false, (key) => key === 'A3' ? 'percent' : 'plain')

    expect(display('A2')).toBe('6')
    expect(display('A3')).toBe('25.0%')
  })

  it('returns raw formulas when formula display is enabled', () => {
    const display = createDisplay({ A1: '=1+2' }, true, plain)

    expect(display('A1')).toBe('=1+2')
  })
})
