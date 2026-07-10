import { useState } from 'react'

export function useSheetViewState() {
  const [helpOpen, setHelpOpen] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false)
  const [showGridlines, setShowGridlines] = useState(true)

  return {
    helpOpen,
    setHelpOpen,
    openHelp: () => setHelpOpen(true),
    showFormulas,
    toggleShowFormulas: () => setShowFormulas((value) => !value),
    showGridlines,
    toggleShowGridlines: () => setShowGridlines((value) => !value),
  }
}
