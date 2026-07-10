export interface PromptOptions {
  label: string
  initial?: string
  placeholder?: string
  submitLabel?: string
}

export type Ask = (options: PromptOptions) => Promise<string | null>

export interface ConfirmOptions {
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>
