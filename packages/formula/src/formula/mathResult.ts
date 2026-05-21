import { wrap } from './marker'

export const valueError = (): string => wrap('#VALUE!')
export const numError = (): string => wrap('#NUM!')
export const divZeroError = (): string => wrap('#DIV/0!')

export const hasFiniteArgs = (argsN: number[], required: number): boolean =>
  argsN.length >= required && argsN.slice(0, required).every(Number.isFinite)

export const allFiniteArgs = (argsN: number[]): boolean =>
  argsN.every(Number.isFinite)

export const finiteResult = (value: number): string =>
  Number.isFinite(value) ? String(value) : numError()
