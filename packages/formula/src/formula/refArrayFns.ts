import { dispatchRefArrayShape } from './refArrayShapeFns'
import { dispatchRefArrayStack } from './refArrayStackFns'
import { dispatchRefArrayWrap } from './refArrayWrapFns'
import type { RefCtx } from './refMatrix'

export function dispatchRefArray(F: string, argsT: string[], rawArgs: string, c: RefCtx): string | null {
  const shape = dispatchRefArrayShape(F, argsT, rawArgs, c)
  if (shape !== null) return shape
  const wrap = dispatchRefArrayWrap(F, argsT, rawArgs, c)
  if (wrap !== null) return wrap
  return dispatchRefArrayStack(F, argsT, rawArgs, c)
}
