import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formulaFunctionCompletions, type FormulaFunctionCompletion } from '@spredsheet/formula'

interface Args {
  readonly formula: string
  readonly caretOffset: number
  readonly onAccept: (completion: FormulaFunctionCompletion) => void
  readonly enabled?: boolean
}

interface NavigationState {
  readonly signature: string
  readonly index: number
}

export interface FormulaAutocompleteController {
  readonly completions: readonly FormulaFunctionCompletion[]
  readonly open: boolean
  readonly activeIndex: number
  readonly listboxId: string
  readonly comboboxProps: {
    readonly role: 'combobox'
    readonly 'aria-autocomplete': 'list'
    readonly 'aria-haspopup': 'listbox'
    readonly 'aria-expanded': boolean
    readonly 'aria-controls': string | undefined
    readonly 'aria-activedescendant': string | undefined
  }
  readonly optionId: (index: number) => string
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => boolean
  readonly onOptionPointerDown: (completion: FormulaFunctionCompletion, event: PointerEvent<HTMLElement>) => void
}

export function useFormulaAutocomplete({ formula, caretOffset, onAccept, enabled = true }: Args): FormulaAutocompleteController {
  const reactId = useId()
  const listboxId = `formula-autocomplete-${reactId.replace(/:/g, '')}`
  const signature = `${formula}\u0000${caretOffset}`
  const completions = useMemo(
    () => formulaFunctionCompletions(formula, caretOffset),
    [caretOffset, formula],
  )
  const [navigation, setNavigation] = useState<NavigationState>({ signature: '', index: 0 })
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(null)
  const open = enabled && completions.length > 0 && dismissedSignature !== signature
  const activeIndex = navigation.signature === signature
    ? Math.min(navigation.index, Math.max(0, completions.length - 1))
    : 0
  const optionId = (index: number) => `${listboxId}-option-${index}`

  const accept = (completion: FormulaFunctionCompletion) => {
    setDismissedSignature(signature)
    onAccept(completion)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return false
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const index = (activeIndex + delta + completions.length) % completions.length
      setNavigation({ signature, index })
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      const completion = completions[activeIndex]
      if (completion) accept(completion)
      return true
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setDismissedSignature(signature)
      return true
    }
    return false
  }

  return {
    completions,
    open,
    activeIndex,
    listboxId,
    comboboxProps: {
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
      'aria-expanded': open,
      'aria-controls': open ? listboxId : undefined,
      'aria-activedescendant': open ? optionId(activeIndex) : undefined,
    },
    optionId,
    onKeyDown,
    onOptionPointerDown: (completion, event) => {
      event.preventDefault()
      event.stopPropagation()
      accept(completion)
    },
  }
}
