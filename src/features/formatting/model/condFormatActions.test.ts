import { describe, expect, it } from 'vitest'
import {
  COND_FORMAT_CONTAINS_EXAMPLE_COLOR,
  COND_FORMAT_GREATER_THAN_EXAMPLE_COLOR,
  DEFAULT_COND_FORMAT_COLOR,
  parseCondFormatSpec,
  promptCondFormatRule,
} from './condFormatActions'
import type { CondRule } from '../hooks/useCondFormat'
import type { Ask, PromptOptions } from '../../../shared/ports/dialog'
import { MAX_CELL_TEXT_LENGTH } from '../../../entities/CellValue/cellValue'

function askValue(value: string | null, prompts: PromptOptions[] = []): Ask {
  return (opts) => {
    prompts.push(opts)
    return Promise.resolve(value)
  }
}

const rejectingAsk = (): Ask => () => Promise.reject(new Error('closed'))

describe('condFormatActions', () => {
  it('parses comparison and contains specs', () => {
    expect(parseCondFormatSpec('B', `>100 ${COND_FORMAT_GREATER_THAN_EXAMPLE_COLOR}`)).toEqual({
      col: 'B',
      op: '>',
      value: '100',
      color: COND_FORMAT_GREATER_THAN_EXAMPLE_COLOR,
    })
    expect(parseCondFormatSpec('C', ` contains late ${COND_FORMAT_CONTAINS_EXAMPLE_COLOR} `)).toEqual({
      col: 'C',
      op: 'contains',
      value: 'late',
      color: COND_FORMAT_CONTAINS_EXAMPLE_COLOR,
    })
  })

  it('rejects invalid specs', () => {
    expect(parseCondFormatSpec('B', '>=100 #fff')).toBeNull()
    expect(parseCondFormatSpec('B', '>foo #fff')).toBeNull()
    expect(parseCondFormatSpec('B', '<Infinity #fff')).toBeNull()
    expect(parseCondFormatSpec('B', '>100 red')).toBeNull()
    expect(parseCondFormatSpec('B', 'contains #fff')).toBeNull()
    expect(parseCondFormatSpec('B', `contains ${'x'.repeat(MAX_CELL_TEXT_LENGTH + 1)} #fff`)).toBeNull()
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
      label: `D열 조건부 서식 (예: >100 ${COND_FORMAT_GREATER_THAN_EXAMPLE_COLOR} 또는 contains foo ${COND_FORMAT_CONTAINS_EXAMPLE_COLOR})`,
      initial: `>0 ${DEFAULT_COND_FORMAT_COLOR}`,
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

  it('treats rejected rule prompts as cancelled', async () => {
    const rules: CondRule[] = []

    await expect(promptCondFormatRule({
      col: 'A',
      ask: rejectingAsk(),
      addCondRule: (rule) => rules.push(rule),
    })).resolves.toBe('cancelled')

    expect(rules).toEqual([])
  })
})
