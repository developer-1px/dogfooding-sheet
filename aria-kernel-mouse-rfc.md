# RFC: 마우스 raw 인터랙션 primitive 추가 + `useGridPattern` dogfood 보고

> 제출자: spredsheet 프로젝트 (aria-kernel `^0.0.2` 소비자)
> aria-kernel 버전: `0.0.2`
> 작성일: 2026-05-11

## 요약 (TL;DR)

aria-kernel은 **키보드 + ARIA 패턴**을 거의 완전히 커버하지만, **마우스 raw 인터랙션 primitive가 빈 자리**입니다 (`/gesture`에 `useZoomPanGesture` 하나뿐). 스프레드시트 데모 앱(이 RFC의 dogfood 환경)에서 4개의 마우스 hook을 자체 구현하면서 발견한 갭을 정리합니다.

또한 **`useGridPattern`과 `gridMultiSelect` axis가 이미 구현되어 있는데** 소비자가 모르고 자체 키보드 nav를 작성하는 경우(이 프로젝트가 그러함)가 있어, 마이그레이션 가이드 형태의 dogfood 보고도 같이 포함합니다.

---

## 1. 현황 — aria-kernel이 *이미* 해주는 것 (검증)

`node_modules/@p/aria-kernel/dist/`를 실제로 확인한 결과 (`PATTERNS.md` 기준):

### `/key`
- `useShortcut(key, handler)` — 전역 단축키 ✓ (이 프로젝트 사용 중)
- `useKeyMap`, `bindGlobalKeyMap`, `insideEditable`

### `/axes` — 빌딩블록 23개
- `navigate`, **`gridNavigate`** (2D Arrow + Home/End + Ctrl+Home/End), **`gridMultiSelect`** (Ctrl+Space/Shift+Space/Ctrl+A/Shift+Arrow rect), `multiSelect`, `numericStep`, `pageNavigate`, `treeNavigate`, `treeExpand`, `typeahead`, `activate`, `select`, `toggle`, `expand`, `escape`, `openControl`, `submenu`, `chord`, `intents`, `intentChords`

### `/patterns` — ARIA APG 27개
**`useGridPattern`** · `useTreeGridPattern` · `useTabsPattern` · `useListboxPattern` · `useTreePattern` · `useToolbarPattern` · `useRadioGroupPattern` · `useMenuPattern` · `useMenubarPattern` · `useMenuButtonPattern` · `useComboboxPattern` (+ `comboboxDialog`/`comboboxGrid`/`comboboxSelect`) · `useDialogPattern` ✓ · `alertDialogPattern` · `alertPattern` · `useTooltipPattern` · `sliderPattern` · `sliderRange` · `splitterPattern` · `spinbuttonPattern` · `switchPattern` · `disclosurePattern` · `useAccordionPattern` · `useFeedPattern` · `useCarouselPattern` · `navigationListPattern` · `useFocusTrap` · `usePatternClipboard` (⚠️ ARIA APG에 없는 패턴 — 후술)

### `/gesture` — 단 하나
- `useZoomPanGesture` (마우스 + 터치)

→ **마우스 영역은 zoom/pan 하나만 정식 primitive로 존재.**

---

## 2. 진짜 갭 — 마우스 raw 인터랙션

이 프로젝트가 자체 구현한 마우스 hook 4개와 그 갭:

### 2.1 셀 직사각 선택 드래그 (`useDragSelect`)

**전체 코드 (`src/sheet/useDragSelect.ts`, 50라인):**

```ts
export function useDragSelect({ focusId, setFocusId, setSelectedIds }: Args) {
  const anchor = useRef<string | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const onUp = () => { dragging.current = false }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const onMouseDown = (id: string, e: React.MouseEvent) => {
    const p = parseCellId(id)
    if (!p) return
    if (e.shiftKey && focusId) {                        // ← Shift+Click extend
      const a = parseCellId(focusId)
      if (a) setSelectedIds(rangeIds(a, p))
      return
    }
    anchor.current = id
    dragging.current = true
    setFocusId(id)
    setSelectedIds([id])
  }

  const onMouseEnter = (id: string) => {                 // ← drag-extend
    if (!dragging.current || !anchor.current) return
    const a = parseCellId(anchor.current)
    const b = parseCellId(id)
    if (!a || !b) return
    setSelectedIds(rangeIds(a, b))
  }

  return { onMouseDown, onMouseEnter }
}
```

ARIA Grid 패턴이 표준화하는 마우스 동작:
- ☑ Click → focus + select
- ☑ Shift+Click → rect extend
- ☐ **Ctrl+Click → 비연속 다중 선택** (이 프로젝트 미구현, `gridMultiSelect`에 키보드만 있음)
- ☑ mousedown → mouseenter loop (drag-extend)

### 2.2 컬럼 헤더 핸들 리사이즈 (`useColWidths`)

```ts
// 의사코드 — 실제 구현 파일: src/sheet/useColWidths.ts
const startResize = (col: string, e: React.MouseEvent) => {
  const startX = e.clientX
  const startWidth = widthOf(col)
  const onMove = (m: MouseEvent) => setWidth(col, startWidth + (m.clientX - startX))
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
```

ARIA APG에 가까운 패턴: **Window Splitter**. 키보드 쪽은 aria-kernel `splitterPattern` + `numericStep` axis로 풀려 있음. 마우스 드래그 부분이 빈 자리.

### 2.3 Fill Handle 드래그 (`useAutoFill`)

**전체 코드 (`src/sheet/useAutoFill.ts`, 70라인 — 발췌):**

```ts
const onHandleMouseDown = (e: React.MouseEvent) => {
  const src = sourceRect()
  if (!src) return
  e.preventDefault()
  e.stopPropagation()
  sourceRef.current = src
  setPreview(src)
}

const onCellEnterDuringFill = (cellId: string) => {
  if (!sourceRef.current) return
  // ... 좌/우/상/하 중 가장 큰 델타 방향으로 rect 확장
}

useEffect(() => {
  const onUp = () => {
    const src = sourceRef.current!
    const tgt = preview
    sourceRef.current = null
    setPreview(null)
    if (!tgt || (tgt.rMax === src.rMax && tgt.cMax === src.cMax)) return
    applyFill(src, tgt, cells, writeCell, writeCells)
    // ...
  }
  window.addEventListener('mouseup', onUp)
  return () => window.removeEventListener('mouseup', onUp)
}, [preview, cells, writeCell, setSelectedIds])
```

⚠️ **fill handle은 ARIA APG에 없는 위젯입니다** — Excel/Sheets가 만든 발명. aria-kernel이 흡수할지 *경계 판단*이 필요한 영역. 후술 §4.

### 2.4 컨텍스트 메뉴 (`useCellMenu`)

오른쪽 클릭 → 메뉴 열기. `e.preventDefault()` + 좌표 저장 + Menu 패턴 트리거.

ARIA APG: Menu 패턴 + Menu Button (`useMenuPattern` + `useMenuButtonPattern`)이 있음. *Trigger 부분*(contextmenu 이벤트 흡수)이 빈 자리.

---

## 3. 제안 — 신규 마우스 primitive

### 3.1 `useDragPattern` (P0)

```ts
import { useDragPattern } from '@p/aria-kernel/gesture'

const { handleProps } = useDragPattern({
  onStart: (e) => { anchor = pickedCell(e) },
  onMove: (delta, e) => { extendRectTo(pickedCell(e)) },
  onEnd: (e) => { commit() },
  preventDefault: true,           // optional
  modifiers: ['shiftKey'],        // optional — only fire when shift held
})

// 소비자 markup
<div {...handleProps}>fill handle</div>
```

내부적으로 `mousedown` → `window.mousemove` / `window.mouseup` lifecycle을 자동 관리 (4개 hook이 모두 반복하던 `useEffect` 보일러플레이트 제거).

### 3.2 `useClickOutside` (P0)

```ts
const ref = useRef<HTMLDivElement>(null)
useClickOutside(ref, () => closeDialog())
```

Dialog/Popover에 필수. 현재 `useDialogPattern`이 *focus return*만 하고 outside-click close는 소비자 책임.

### 3.3 `useResizeHandle` (P1)

```ts
const { handleProps } = useResizeHandle({
  axis: 'x',                       // 'x' | 'y' | 'both'
  initial: () => widthOf(col),
  onChange: (next) => setWidth(col, next),
  min: 20,
  max: 600,
})
```

splitterPattern의 마우스 짝. 컬럼/행 리사이즈가 정형화됨.

### 3.4 `useContextMenuTrigger` (P2)

```ts
const triggerProps = useContextMenuTrigger({
  onOpen: (x, y, target) => openMenu({ x, y, target }),
})

<div {...triggerProps}>cell</div>
```

`contextmenu` 이벤트 → `e.preventDefault()` + 좌표 정규화. Menu 패턴과 연결.

### 3.5 `useGridPattern` 옵션 확장 — Click 핸들러

현재 `useGridPattern`이 키보드 입력만 받는다면, 마우스 클릭/드래그/Ctrl+Click도 옵션으로 받을 수 있게:

```ts
const { rootProps, cellProps, rows } = useGridPattern(data, onEvent, {
  multiSelectable: true,
  // 신규:
  onCellClick: (id, e) => focus(id),
  onCellShiftClick: (id) => extendRect(id),
  onCellCtrlClick: (id) => toggleInSelection(id),      // ← 이 프로젝트의 🔴 갭
  onCellDrag: (fromId, toId) => extendRect(toId),
})
```

이거 하나만으로 `useDragSelect`가 거의 사라집니다.

---

## 4. 정체성 invariant와의 관계 (논의 필요)

`PATTERNS.md`에 명시된 invariant:

> ✅ INVARIANTS C17 (출처 없으면 구현 없다) — recipe 의 모든 동작은 axis/gesture 파생, 새 어휘 0

마우스 raw 인터랙션이 이 invariant와 충돌하는지:

| 신규 primitive | "출처"(=W3C 표준 근거) |
|--------------|--------------------|
| `useDragPattern` | ❌ ARIA APG에 없음. HTML `pointerdown`/`pointermove`/`pointerup` 표준 활용 |
| `useClickOutside` | ❌ ARIA APG에 없음. Dialog 패턴 *암묵적* 요구 (focus return + outside dismiss는 함께) |
| `useResizeHandle` | △ Window Splitter 패턴이 마우스 동작을 *언급은* 함 ("pointer drag adjusts position") |
| `useContextMenuTrigger` | ⚠️ HTML `contextmenu` 이벤트는 표준. ARIA가 흡수하라고 명시는 안 함 |

### 선례 — `usePatternClipboard`

`/dist/patterns/` 에 `usePatternClipboard.js` 가 존재합니다. **ARIA APG에는 클립보드 패턴이 없습니다.** 그래도 aria-kernel은 흡수했음.

→ "ARIA APG에 *없는* 횡단 인프라"가 이미 들어와 있다는 선례. 마우스 raw 인터랙션도 같은 자격으로 들어올 명분이 있음.

다만 invariant C17과의 정합을 위해 별도 subpath로 격리 제안:

```
@p/aria-kernel/gesture
  ├ useZoomPanGesture       (현재)
  ├ useDragPattern          (신규 — pointer events 표준 위에)
  ├ useClickOutside         (신규)
  ├ useResizeHandle         (신규)
  └ useContextMenuTrigger   (신규)
```

→ `/patterns`(ARIA 출처 있음)와 `/gesture`(pointer/mouse 표준 출처)를 명확히 분리.

---

## 5. 이 프로젝트의 마이그레이션 시나리오 (dogfood)

신규 primitive가 들어왔을 때 우리 코드 변화:

### Before — 5개 파일 / ~180라인

```
src/sheet/
  useDragSelect.ts        50 lines   ← 자체 mousedown+enter 시스템
  useColWidths.ts (부분)  30 lines   ← startResize / mousemove / mouseup
  useAutoFill.ts          70 lines   ← fill handle 드래그
  useCellMenu.ts (부분)   10 lines   ← contextmenu 이벤트
  shortcutsNav.ts         40 lines   ← 키보드 nav (gridNavigate axis로 대체 가능)
```

### After — useGridPattern + 신규 primitive 마이그레이션

```ts
// useDragSelect 폐기, useGridPattern으로 흡수
const { rootProps, cellProps, rows } = useGridPattern(cellData, onEvent, {
  multiSelectable: true,
  onCellClick: (id) => { setFocus(id); setSelectedIds([id]) },
  onCellShiftClick: (id) => setSelectedIds(rangeIds(focusId, id)),
  onCellCtrlClick: (id) => toggleInSelection(id),
  onCellDrag: (from, to) => setSelectedIds(rangeIds(from, to)),
})

// useAutoFill — fill handle만 신규 primitive로 raw 드래그 분리
const { handleProps } = useDragPattern({
  onStart: () => { sourceRef.current = sourceRect() },
  onMove: (_, e) => onCellEnterDuringFill(cellUnderMouse(e)),
  onEnd: () => commitFill(),
})

// useColWidths — splitter 마우스 짝
const { handleProps } = useResizeHandle({
  axis: 'x',
  initial: () => widthOf(col),
  onChange: (w) => setWidth(col, w),
  min: 20, max: 600,
})

// useCellMenu — contextmenu trigger
const triggerProps = useContextMenuTrigger({
  onOpen: (x, y, target) => setMenu({ x, y, cellId: pickCell(target) }),
})

// shortcutsNav — gridNavigate axis로 흡수 (대부분 자동)
// useGridPattern이 이미 Arrow/Home/End/Ctrl+Home/End/PageUp/PageDown 처리
```

**예상 라인 감소:** ~180 → ~40. 도메인 의미만 남음.

**예상 기능 *추가*:**
- Ctrl+Click 비연속 다중 선택 (현재 🔴 없음)
- Shift+Arrow extend (현재 부분만 — `shortcutsNav.ts`의 `idsBetween`)
- roving tabindex (현재 미확인)
- aria-rowindex/aria-colindex/aria-selected (현재 미적용)

→ **코드는 줄고 접근성은 표준 준수로 올라감.** sidecar dogfood의 모범 사례.

---

## 6. 우선순위 제안 (Cynefin)

| # | 항목 | Cynefin | 비용 | 효과 |
|---|------|---------|-----|-----|
| 1 | `useGridPattern`의 `onCellClick`/`onCellShiftClick`/`onCellCtrlClick`/`onCellDrag` 옵션 추가 | Clear | 소 (기존 패턴 확장) | 그리드 앱들의 마우스 인터랙션 표준화. **이 프로젝트가 즉시 dogfood 가능** |
| 2 | `useDragPattern` 신규 primitive (`/gesture` subpath) | Clear | 중 (4개 hook의 공통 lifecycle 추상화) | fill handle / 일반 drag widget 전부 단일 API |
| 3 | `useClickOutside` 신규 | Clear | 소 | Dialog/Popover 폐쇄 표준화 |
| 4 | `useResizeHandle` 신규 (splitterPattern 마우스 짝) | Complicated | 중 (axis 합성 검토) | 컬럼/행/패널 리사이즈 표준화 |
| 5 | `useContextMenuTrigger` 신규 | Complicated | 소 | Menu 패턴 진입점 표준화 |
| 6 | INVARIANT C17과 신규 primitive의 정합 명문화 (`/gesture`는 *pointer events 표준* 위) | Clear | 문서만 | 향후 확장 명분 |

**가장 ROI 높은 첫 단계: #1.** 기존 `useGridPattern`에 click 옵션 추가만으로 큰 변화 — 이 프로젝트가 즉시 마이그레이션해서 검증할 수 있음.

---

## 7. 의문 / 논의 포인트

1. **fill handle은 흡수 대상인가?** — ARIA APG에 없음. 도메인 위젯으로 영원히 외부에 두는 게 맞나, 아니면 `useDragPattern`은 일반 raw drag이라 fill handle도 그 위에 올라가는 게 자연스러운가?
2. **`usePatternClipboard` 위치 재고** — 클립보드도 사실 ARIA APG 없음. `/patterns` 가 아니라 `/io` 같은 별도 subpath가 더 정직할 수도?
3. **pointer events vs mouse events** — 신규 primitive는 `pointerdown`/`pointermove`/`pointerup` 표준 (터치/펜 호환) 위에 짓는 게 좋아 보임. 현재 `useZoomPanGesture`는 어느 쪽?
4. **이미 `@use-gesture/react`(주간 4.2M)가 존재.** aria-kernel이 직접 구현할지, `@use-gesture`를 의존성으로 가져가서 그 위에 ARIA 의미 얹기만 할지의 선택.

---

## 8. 결론

- aria-kernel은 키보드+패턴 영역에서 **완성도 매우 높음** (27개 패턴 + 23개 axis)
- **마우스 raw 인터랙션이 명확한 갭** — `/gesture`에 zoom/pan 하나만 존재
- 이 갭이 채워지면 **소비자가 ARIA 의미를 더 일관되게 표현 가능** (이 프로젝트의 4개 자체 hook이 ~140라인 감소 + 접근성 향상)
- 기존 `useGridPattern` 확장(#1)부터 시작하면 가장 낮은 비용으로 가장 큰 효과
- 정체성 invariant(C17 "출처 없으면 구현 없다")는 `usePatternClipboard` 선례를 따라 `/gesture` subpath의 *pointer events 표준* 출처로 정합 가능

이 RFC에 대한 의견을 부탁드립니다. 특히:
- §4의 invariant 정합성 판단
- §7.1의 fill handle 같은 *ARIA 밖 도메인 위젯*과의 경계
- §6의 우선순위 #1(`useGridPattern` 마우스 옵션 확장)부터 진행해도 되는지

소비 프로젝트(spredsheet)는 PR 검토/dogfood 협력 가능합니다.

---

## 부록 — aria-kernel 활용 현황 (이 프로젝트)

**사용 중:**
- `useShortcut` × 39회 (`useGlobalShortcuts.ts`)
- `useDialogPattern` × 1회 (`Find.tsx`)

**미사용 (활용 가능):**
- `useGridPattern` ← Grid 핵심. 즉시 마이그레이션 후보
- `gridMultiSelect` axis ← Ctrl+Click 다중 선택 기능 즉시 획득
- `useTooltipPattern` ← `title=` 속성 대체 가능 (a11y 향상)
- `useToolbarPattern` ← `Toolbar.tsx` 마이그레이션 후보
- `useMenuPattern` + `useMenuButtonPattern` ← `useCellMenu` 대체
- `useFocusTrap` ← `PromptDialog`/`ConfirmDialog` 검증

**관찰:** 소비자가 패턴 목록을 발견하기 어려운 구조. README나 `PATTERNS.md`에 "소비자 마이그레이션 체크리스트" 섹션이 있으면 도움될 듯.
