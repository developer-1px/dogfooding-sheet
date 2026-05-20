import { describe, expect, it } from 'vitest'
import { parseCondFormatSpec, promptCondFormatRule } from './condFormatActions'
import type { CondRule } from './useCondFormat'
import type { Ask, PromptOptions } from '../usePrompt'

function askValue(value: string | null, prompts: PromptOptions[] = []): Ask {
  return (opts) => {
    prompts.push(opts)
    return Promise.resolve(value)
  }
}

describe('condFormatActions', () => {
  it('parses comparison and contains specs', () => {
    expect(parseCondFormatSpec('B', '>100 #ffeb3b')).toEqual({
      col: 'B',
      op: '>',
      value: '100',
      color: '#ffeb3b',
    })
    expect(parseCondFormatSpec('C', ' contains late #c8e6c9 ')).toEqual({
      col: 'C',
      op: 'contains',
      value: 'late',
      color: '#c8e6c9',
    })
  })

  it('rejects invalid specs', () => {
    expect(parseCondFormatSpec('B', '>=100 #fff')).toBeNull()
    expect(parseCondFormatSpec('B', '>100 red')).toBeNull()
    expect(parseCondFormatSpec('B', 'contains #fff')).toBeNull()
  })

  it('prompts and applies a parsed rule', async () => {
    const prompts: PromptOptions[] = []
    const rules: CondRule[] = []

    await expect(promptCondFormatRule({
      col: 'D',
      ask: askValue('!= done #abcdef', prompts),
      addCondRule: (rule) => rules.push(rule),
    })).resolves.toBe('applied')

    expect(prompts[0]).toMatchObject({
      label: 'D열 조건부 서식 (예: >100 #ffeb3b 또는 contains foo #c8e6c9)',
      initial: '>0 #fff59d',
      submitLabel: '추가',
    })
    expect(rules).toEqual([{ col: 'D', op: '!=', value: 'done', color: '#abcdef' }])
  })

  it('skips prompting without a column and ignores cancelled or invalid specs', async () => {
    const prompts: PromptOptions[] = []
    const rules: CondRule[] = []
    const addCondRule = (rule: CondRule) => rules.push(rule)

    await expect(promptCondFormatRule({ col: null, ask: askValue('>0 #fff', prompts), addCondRule })).resolves.toBe('no-column')
    await expect(promptCondFormatRule({ col: 'A', ask: askValue(null, prompts), addCondRule })).resolves.toBe('cancelled')
    await expect(promptCondFormatRule({ col: 'A', ask: askValue('bad', prompts), addCondRule })).resolves.toBe('invalid')

    expect(prompts).toHaveLength(2)
    expect(rules).toEqual([])
  })
})
