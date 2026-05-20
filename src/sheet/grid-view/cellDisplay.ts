import { numericValue } from '@spredsheet/grid'

const ERROR_RE = /^#[A-Z0-9/?]+!?$/
const IMAGE_URL_RE = /^https?:\/\/.+\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i
const HTTP_URL_RE = /^https?:\/\//
const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.\w{2,}$/

export type CellContent =
  | { kind: 'image'; src: string }
  | { kind: 'link'; href: string; label: string }
  | { kind: 'email'; href: string; label: string }
  | { kind: 'text'; text: string }

interface CellDisplayArgs {
  address: string
  label: string
  selected: boolean
  focused: boolean
  editing: boolean
  mergeRange?: string
  numeric: boolean
  highlighted: boolean
  previewing: boolean
  styleClass: string
  note?: string
  tooltip?: string
}

export interface CellDisplayModel {
  error: boolean
  ariaLabel: string
  editLabel: string
  className: string
  title?: string
  content: CellContent
}

export const isErrorLabel = (label: string): boolean => ERROR_RE.test(label)

export function classifyCellContent(label: string): CellContent {
  if (IMAGE_URL_RE.test(label)) return { kind: 'image', src: label }
  if (HTTP_URL_RE.test(label)) return { kind: 'link', href: label, label }
  if (EMAIL_RE.test(label)) return { kind: 'email', href: `mailto:${label}`, label }
  return { kind: 'text', text: label }
}

export function createCellDisplayModel(args: CellDisplayArgs): CellDisplayModel {
  const error = isErrorLabel(args.label)
  const ariaLabel = [
    args.address,
    args.label === '' ? '빈 셀' : args.label,
    error ? '오류' : '',
    args.mergeRange ? `병합 셀 ${args.mergeRange}` : '',
    args.selected ? '선택됨' : '',
    args.focused ? '현재 셀' : '',
    args.editing ? '편집 중' : '',
  ].filter(Boolean).join(' ')
  const classes = [
    'cell',
    args.selected ? 'selected' : '',
    args.focused ? 'focused' : '',
    args.mergeRange ? 'merged' : '',
    args.numeric ? 'numeric' : '',
    args.numeric && numericValue(args.label) < 0 ? 'negative' : '',
    error ? 'errcell' : '',
    args.highlighted ? 'ref-hi' : '',
    args.previewing ? 'preview' : '',
    args.styleClass,
  ].filter(Boolean).join(' ')

  return {
    error,
    ariaLabel,
    editLabel: `${args.address} 편집`,
    className: classes,
    title: args.note ?? args.tooltip ?? (args.label.length > 20 ? args.label : undefined),
    content: classifyCellContent(args.label),
  }
}
