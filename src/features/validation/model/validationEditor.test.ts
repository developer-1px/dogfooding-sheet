import { describe, expect, it } from 'vitest'
import {
  initialValidationEditorDraft,
  validationOptionsFromText,
} from './validationEditor'

describe('validation editor model', () => {
  it('prefills a validation rule shared by every target cell', () => {
    expect(initialValidationEditorDraft(
      ['A1', 'A2'],
      {
        A1: { type: 'list', options: ['Open', 'Closed'] },
        A2: { type: 'list', options: ['Open', 'Closed'] },
      },
    )).toEqual({ mode: 'list', optionsText: 'Open\nClosed' })

    expect(initialValidationEditorDraft(['A1', 'A2'], {})).toEqual({
      mode: 'none',
      optionsText: '',
    })
  })

  it('represents differing target rules as mixed without borrowing one rule', () => {
    expect(initialValidationEditorDraft(
      ['A1', 'A2'],
      { A1: { type: 'checkbox' } },
    )).toEqual({ mode: 'mixed', optionsText: '' })
  })

  it('normalizes line-delimited dropdown options through sheet limits', () => {
    expect(validationOptionsFromText(' Open \nClosed\nOpen\n\n Pending ')).toEqual([
      'Open',
      'Closed',
      'Pending',
    ])
  })
})
