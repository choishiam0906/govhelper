#!/bin/bash
OUTPUT_FILE="C:/Users/chois/AppData/Local/Temp/claude/C--Users-chois/tasks/b095590.output"

while true; do
  if grep -q "완료" "$OUTPUT_FILE" 2>/dev/null || grep -q "에러" "$OUTPUT_FILE" 2>/dev/null; then
    echo "=========================================="
    echo "DART 데이터 수집 완료!"
    echo "=========================================="
    tail -20 "$OUTPUT_FILE"
    break
  fi
  
  # 현재 진행 상황 출력
  LAST_LINE=$(tail -1 "$OUTPUT_FILE" 2>/dev/null)
  echo "[$(date '+%H:%M:%S')] $LAST_LINE"
  
  sleep 300  # 5분마다 체크
done
