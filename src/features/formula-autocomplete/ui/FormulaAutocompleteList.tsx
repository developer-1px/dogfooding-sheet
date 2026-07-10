import type { FormulaAutocompleteController } from '../hooks/useFormulaAutocomplete'
import './formulaAutocomplete.css'

export function FormulaAutocompleteList({ autocomplete }: { autocomplete: FormulaAutocompleteController }) {
  if (!autocomplete.open) return null

  return (
    <ul
      id={autocomplete.listboxId}
      className="formula-autocomplete-list"
      role="listbox"
      aria-label="수식 함수 제안"
    >
      {autocomplete.completions.map((completion, index) => (
        <li
          id={autocomplete.optionId(index)}
          key={completion.name}
          role="option"
          aria-selected={index === autocomplete.activeIndex}
          onPointerDown={(event) => autocomplete.onOptionPointerDown(completion, event)}
        >
          {completion.name}
        </li>
      ))}
    </ul>
  )
}
