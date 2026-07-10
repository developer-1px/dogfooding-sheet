import { describe, expect, it } from 'vitest'
import { classifyCellContent, createCellDisplayModel, isErrorLabel } from '@spredsheet/editable-grid/cell-display'

describe('cell display classification', () => {
  it('classifies image URLs before generic links', () => {
    expect(classifyCellContent('https://example.com/a.png?size=1')).toEqual({
      kind: 'image',
      src: 'https://example.com/a.png?size=1',
    })
    expect(classifyCellContent('https://example.com')).toEqual({
      kind: 'link',
      href: 'https://example.com/',
      label: 'https://example.com',
    })
  })

  it('does not auto-link malformed or non-http URLs', () => {
    expect(classifyCellContent('https://example.com/a png')).toEqual({ kind: 'text', text: 'https://example.com/a png' })
    expect(classifyCellContent('https://example.com/\nnext')).toEqual({ kind: 'text', text: 'https://example.com/\nnext' })
    expect(classifyCellContent('https:\\\\example.com\\path')).toEqual({ kind: 'text', text: 'https:\\\\example.com\\path' })
    expect(classifyCellContent('https://example.com@evil.test/path')).toEqual({ kind: 'text', text: 'https://example.com@evil.test/path' })
    expect(classifyCellContent('https://user:pass@example.com/a.png')).toEqual({ kind: 'text', text: 'https://user:pass@example.com/a.png' })
    expect(classifyCellContent('javascript:alert(1)')).toEqual({ kind: 'text', text: 'javascript:alert(1)' })
    expect(classifyCellContent('data:text/html,hi')).toEqual({ kind: 'text', text: 'data:text/html,hi' })
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
      note: '검토 필요',
      validationList: true,
      checkbox: true,
      formula: true,
    })

    expect(isErrorLabel('#DIV/0!')).toBe(true)
    expect(model.error).toBe(true)
    expect(model.ariaLabel).toBe('A1 #N/A 오류 병합 셀 A1:B1 메모 있음 드롭다운 목록 있음 체크박스 셀 수식 셀 수식 참조 강조됨 자동 채우기 미리보기 선택됨 현재 셀 편집 중')
    expect(model.editLabel).toBe('A1 편집')
    expect(model.className).toBe('cell selected focused merged errcell ref-hi preview bold')
    expect(model.title).toBe('검토 필요')
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

  it('exposes image-rendered cells in the accessible label', () => {
    const model = createCellDisplayModel({
      address: 'B2',
      label: 'https://example.com/chart.png',
      selected: false,
      focused: false,
      editing: false,
      numeric: false,
      highlighted: false,
      previewing: false,
      styleClass: '',
    })

    expect(model.content).toEqual({
      kind: 'image',
      src: 'https://example.com/chart.png',
    })
    expect(model.ariaLabel).toBe('B2 https://example.com/chart.png 이미지')
    expect(model.title).toBe('https://example.com/chart.png')
  })

  it('exposes link-rendered cells in the accessible label', () => {
    const url = createCellDisplayModel({
      address: 'C3',
      label: 'https://example.com',
      selected: false,
      focused: false,
      editing: false,
      numeric: false,
      highlighted: false,
      previewing: false,
      styleClass: '',
    })
    const email = createCellDisplayModel({
      address: 'D4',
      label: 'ops@example.com',
      selected: false,
      focused: false,
      editing: false,
      numeric: false,
      highlighted: false,
      previewing: false,
      styleClass: '',
    })

    expect(url.content).toMatchObject({ kind: 'link', href: 'https://example.com/' })
    expect(url.ariaLabel).toBe('C3 https://example.com 링크')
    expect(email.content).toMatchObject({ kind: 'email', href: 'mailto:ops@example.com' })
    expect(email.ariaLabel).toBe('D4 ops@example.com 이메일 링크')
  })
})
