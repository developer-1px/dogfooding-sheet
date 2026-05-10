#!/bin/bash
HAS_LONG=$(find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) 2>/dev/null -exec sh -c 'l=$(wc -l <"$1"); [ "$l" -gt 100 ] && echo 1 && exit' _ {} \;)
if [ -n "$HAS_LONG" ]; then
  REASON="변경사항을 커밋하세요. 100행 초과 파일이 있습니다 — 적합한 리팩토링 스킬을 알아서 사용하세요."
else
  REASON="변경사항을 커밋하세요."
fi
printf '{"decision":"block","reason":"%s"}\n' "$REASON"
