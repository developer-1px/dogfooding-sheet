import { describe, expect, it } from 'vitest'
import { classifyCellContent, createCellDisplayModel, isErrorLabel } from './cellDisplay'

describe('cell display classification', () => {
  it('classifies image URLs before generic links', () => {
    expect(classifyCellContent('https://example.com/a.png?size=1')).toEqual({
      kind: 'image',
      src: 'https://example.com/a.png?size=1',
    })
    expect(classifyCellContent('https://example.com')).toEqual({
      kind: 'link',
      href: 'https://example.com',
      label: 'https://example.com',
    })
  })

  it('classifies email and text values', () => {
    expect(classifyCellContent('ops@example.com')).toEqual({
      kind: 'email',
      href: 'mailto:ops@example.com',
      label: 'ops@example.com',
    })
    expect(classifyCellContent('hello')).toEqual({ kind: 'text', text: 'hello' })
  })
})

describe('cell display model', () => {
  it('builds aria labels and classes from cell state', () => {
    const model = createCellDisplayModel({
      address: 'A1',
      label: '#N/A',
      selected: true,
      focused: true,
      editing: true,
      mergeRange: 'A1:B1',
      numeric: false,
      highlighted: true,
      previewing: true,
      styleClass: 'bold',
    })

    expect(isErrorLabel('#DIV/0!')).toBe(true)
    expect(model.error).toBe(true)
    expect(model.ariaLabel).toBe('A1 #N/A 오류 병합 셀 A1:B1 선택됨 현재 셀 편집 중')
    expect(model.editLabel).toBe('A1 편집')
    expect(model.className).toBe('cell selected focused merged errcell ref-hi preview bold')
  })

  it('marks negative numeric cells and prefers note over tooltip over long label title', () => {
    expect(createCellDisplayModel({
      address: 'A2',
      label: '-3',
      selected: false,
      focused: false,
      editing: false,
      numeric: true,
      highlighted: false,
      previewing: false,
      styleClass: '',
      note: 'note',
      tooltip: '=A1',
    }).title).toBe('note')

    const model = createCellDisplayModel({
      address: 'A3',
      label: '-3',
      selected: false,
      focused: false,
      editing: false,
      numeric: true,
      highlighted: false,
      previewing: false,
      styleClass: '',
    })

    expect(model.className).toBe('cell numeric negative')
  })
})
