export function normalizeNoteText(text: string): string {
  return text.replace(/\r\n?/g, '\n').trim()
}
