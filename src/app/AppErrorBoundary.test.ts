import { act, createElement } from 'react'
import { readFileSync } from 'node:fs'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

const appCss = () => readFileSync('src/app/App.css', 'utf8')

function Ok() {
  return createElement('div', null, 'ok')
}

describe('AppErrorBoundary', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  it('contains render failures and can retry', () => {
    let fail = true
    function MaybeThrow() {
      if (fail) throw new Error('render failed')
      return createElement(Ok)
    }

    act(() => {
      root.render(createElement(AppErrorBoundary, null, createElement(MaybeThrow)))
    })

    expect(document.querySelector('[role="alert"]')?.textContent).toContain('화면을 표시하지 못했습니다.')

    fail = false
    const retry = document.querySelector<HTMLButtonElement>('.app-error button')
    expect(retry).not.toBeNull()
    expect(retry?.type).toBe('button')
    expect(retry?.textContent).toBe('다시 시도')
    expect(retry?.getAttribute('title')).toBe('화면 다시 표시 시도')
    expect(retry?.getAttribute('aria-label')).toBe('화면 다시 표시 시도')
    act(() => retry!.click())

    expect(document.querySelector('[role="alert"]')).toBeNull()
    expect(host.textContent).toBe('ok')
  })

  it('keeps the fallback message and retry action wrapped on narrow screens', () => {
    const css = appCss()
    const errorRule = css.match(/\.app-error\s*\{[^}]+\}/)?.[0] ?? ''
    const buttonRule = css.match(/\.app-error button\s*\{[^}]+\}/)?.[0] ?? ''

    expect(errorRule).toContain('display: flex;')
    expect(errorRule).toContain('flex-wrap: wrap;')
    expect(errorRule).toContain('padding: var(--sheet-space-8);')
    expect(errorRule).toContain('text-align: center;')
    expect(css).toContain('--sheet-size-app-error-button-border: 1px;')
    expect(buttonRule).toContain('flex: 0 0 auto;')
    expect(buttonRule).toContain('border: var(--sheet-size-app-error-button-border, 1px) solid var(--sheet-color-border);')
  })
})
