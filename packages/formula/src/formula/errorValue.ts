export const isErrorValue = (value: string): boolean => /^#[A-Z0-9/]+!?$/.test(value)
