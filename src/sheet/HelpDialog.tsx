import type { KeyboardEvent } from 'react'
import { useDialogModalPattern } from '@interactive-os/aria-kernel/patterns'

interface Props {
  open: boolean
  onClose: () => void
}

const stopButtonActivationKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl/⌘ + Z', '실행 취소'],
  ['Ctrl/⌘ + Shift + Z / Y', '다시 실행'],
  ['Ctrl/⌘ + C / X / V', '복사 / 잘라내기 / 붙여넣기'],
  ['Ctrl/⌘ + B / I / U', '굵게 / 기울임 / 밑줄'],
  ['Alt + Shift + 5', '취소선'],
  ['Ctrl/⌘ + \\\\', '서식 모두 해제'],
  ['Ctrl/⌘ + S', 'CSV 내보내기'],
  ['Ctrl/⌘ + D / R', '아래로 / 오른쪽으로 채우기'],
  ['Ctrl/⌘ + ;', '오늘 날짜 입력'],
  ['Ctrl/⌘ + Shift + ;', '현재 시각 입력'],
  ['Ctrl/⌘ + F', '찾기'],
  ['Ctrl/⌘ + G', '셀/범위로 이동 (예: B5, A1:C3, B:B, 2:2)'],
  ['Ctrl/⌘ + A', '시트 전체 선택'],
  ['Ctrl/⌘ + H', '찾기 및 바꾸기'],
  ['Ctrl/⌘ + K', '하이퍼링크 삽입'],
  ['Enter / Shift+Enter', '편집 후 아래/위 셀 이동'],
  ['Ctrl/⌘ + Enter', '커밋 후 같은 셀 유지'],
  ['Tab / Shift+Tab', '편집 후 오른쪽/왼쪽 셀 이동'],
  ['Ctrl/⌘ + 화살표', '데이터 영역 가장자리로 이동'],
  ['Ctrl/⌘ + Shift + 화살표', '가장자리까지 선택 확장'],
  ['Ctrl + Space / Shift + Space', '열 / 행 전체 선택'],
  ['Home / End', '현재 행의 처음 / 끝 셀로'],
  ['Ctrl/⌘ + Home / End', '시트의 처음 (A1) / 끝 셀로'],
  ['PageUp / PageDown', '10행 위 / 아래로 (Shift = 선택 확장)'],
  ['Ctrl/⌘ + PageUp / PageDown', '이전 / 다음 시트 탭으로 이동'],
  ['Delete / Backspace', '선택 셀 비우기'],
  ['F2', '셀 편집 시작'],
  ['F4 (수식 입력 중)', '마지막 셀 참조의 절대/상대 형식 순환'],
  ['F9', '선택한 셀의 수식을 평가된 값으로 고정'],
  ['Ctrl/⌘ + Shift + 1 / 3 / 4 / 5', '서식: 일반 / 날짜 / 통화 / 백분율'],
  ['Ctrl/⌘ + Shift + M', '셀 노트 추가 / 편집'],
  ['툴바 ☑체크', '선택 셀을 체크박스로 변환 (TRUE/FALSE 토글)'],
  ['Alt + Shift + M', '선택 범위를 병합 / 단일 셀 클릭 시 해제'],
  ['Alt + Enter (편집 중)', '줄바꿈 입력 (wrap 셀에서 textarea로 자동 전환)'],
  ['툴바 ▢', '셀 테두리 토글'],
  ['Ctrl/⌘ + `', '수식 표시 토글 (값 ↔ 수식 원문)'],
  ['Ctrl/⌘ + Alt + = / -', '현재 위치에 행 삽입 / 삭제'],
  ['Ctrl/⌘ + Alt + Shift + = / -', '현재 위치에 열 삽입 / 삭제'],
  ['Ctrl/⌘ + Alt + 9 / 0', '현재 행 / 열 숨기기'],
  ['Ctrl/⌘ + Shift + 0', '숨김 행/열 모두 표시'],
  ['행/열 헤더 드래그', '너비/높이 조정 (더블클릭 = 자동 맞춤 / 기본값 복원)'],
  ['행/열 헤더 우클릭', '컨텍스트 메뉴 (고정·숨김·정렬·삽입·삭제 등)'],
  ['탭 드래그', '시트 순서 변경 / 탭 색상 picker는 hover 시 표시'],
  ['F1 / ? / Ctrl+/', '이 도움말 열기'],
  ['Esc', '편집 취소 / 대화상자 닫기'],
]

export function HelpDialog({ open, onClose }: Props) {
  const { rootProps, backdropProps } = useDialogModalPattern({
    open, modal: true, label: '키보드 단축키',
    onOpenChange: (next) => { if (!next) onClose() },
  })
  if (!open) return null
  return (
    <>
      <div {...backdropProps} className="dialog-backdrop" />
      <div {...rootProps} className="help-dialog">
        <h2 id="help-title">키보드 단축키</h2>
        <table>
          <caption>키보드 단축키 목록</caption>
          <thead>
            <tr><th scope="col">단축키</th><th scope="col">동작</th></tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(([k, d]) => (
              <tr key={k}><th scope="row"><kbd>{k}</kbd></th><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={onClose} onKeyDown={stopButtonActivationKeyDown} title="닫기 (Esc)" aria-label="키보드 단축키 도움말 닫기" aria-keyshortcuts="Escape">닫기</button>
      </div>
    </>
  )
}
