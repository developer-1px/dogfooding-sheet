export interface GridDelta {
  dRow: number
  dCol: number
}

export function formulaPickDeltaForKey(key: string): GridDelta | null {
  if (key === 'ArrowUp') return { dRow: -1, dCol: 0 }
  if (key === 'ArrowDown') return { dRow: 1, dCol: 0 }
  if (key === 'ArrowLeft') return { dRow: 0, dCol: -1 }
  if (key === 'ArrowRight') return { dRow: 0, dCol: 1 }
  return null
}
