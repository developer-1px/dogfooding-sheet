export interface EngineEvent {
  kind?: string
  command: { type: string; payload?: unknown }
  diff: Array<{ path: string; kind: string; before?: unknown; after?: unknown }>
  error?: string
  originalType?: string
}

export interface LogEntry {
  kind?: string
  type: string
  payload?: unknown
  diff: Array<{ path: string; kind: string; before?: unknown; after?: unknown }>
  error?: string
}

export type Logger = (entry: LogEntry) => void

interface AriaActions {
  subscribe(listener: (event: EngineEvent) => void): () => void
}

const emptyRegistry = new Map<string, AriaActions>()

export function getAllAriaActions(): Map<string, AriaActions> {
  return emptyRegistry
}

