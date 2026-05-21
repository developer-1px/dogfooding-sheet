import { divZeroError, finiteResult, hasFiniteArgs, valueError } from './mathResult'

export function dispatchTrig(F: string, argsN: number[]): string | null {
  if (F === 'SIN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.sin(argsN[0])) : valueError()
  if (F === 'COS') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.cos(argsN[0])) : valueError()
  if (F === 'TAN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.tan(argsN[0])) : valueError()
  if (F === 'ASIN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.asin(argsN[0])) : valueError()
  if (F === 'ACOS') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.acos(argsN[0])) : valueError()
  if (F === 'ATAN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.atan(argsN[0])) : valueError()
  if (F === 'ATAN2') return hasFiniteArgs(argsN, 2) ? finiteResult(Math.atan2(argsN[0], argsN[1])) : valueError()
  if (F === 'SINH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.sinh(argsN[0])) : valueError()
  if (F === 'COSH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.cosh(argsN[0])) : valueError()
  if (F === 'TANH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.tanh(argsN[0])) : valueError()
  if (F === 'ASINH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.asinh(argsN[0])) : valueError()
  if (F === 'ACOSH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.acosh(argsN[0])) : valueError()
  if (F === 'ATANH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.atanh(argsN[0])) : valueError()
  if (F === 'ACOT') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    return finiteResult(argsN[0] === 0 ? Math.PI / 2 : Math.atan(1 / argsN[0]))
  }
  if (F === 'ACOTH') return hasFiniteArgs(argsN, 1) ? finiteResult(0.5 * Math.log((argsN[0] + 1) / (argsN[0] - 1))) : valueError()
  if (F === 'SEC') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.cos(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'CSC') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.sin(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'COT') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.tan(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'SECH') return hasFiniteArgs(argsN, 1) ? finiteResult(1 / Math.cosh(argsN[0])) : valueError()
  if (F === 'CSCH') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.sinh(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'COTH') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.tanh(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'DEGREES') return hasFiniteArgs(argsN, 1) ? finiteResult(argsN[0] * 180 / Math.PI) : valueError()
  if (F === 'RADIANS') return hasFiniteArgs(argsN, 1) ? finiteResult(argsN[0] * Math.PI / 180) : valueError()
  return null
}
