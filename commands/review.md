---
description: 현재 uncommitted 변경에 대해 computational 센서 + inferential 리뷰를 수행한다.
---

# Review (Unit Scope)

오케스트레이터 역할로 unit scope 리뷰를 수행한다.

## 실행 흐름

1. sensor-binding 확인 (`.claude/sensor-cache.json` 없으면 감지 실행)
2. `git diff` + `git diff --staged`로 diff 생성
3. computational 센서 실행 (lint, typecheck, test)
4. 센서 실패 시 → 결과 보고 후 종료
5. 센서 통과 시 → reviewer를 scope: unit으로 spawn
6. reviewer에게 전달: diff, computational_sensor_results, attempt_number: 1
7. reviewer의 review_result를 보고

## 참조

- `personas/orchestrator.md` — 센서 실행 책임, 리뷰 정책
- `personas/reviewer.md` — 컨텍스트 격리 리뷰, YAML 아웃풋
- `adapters/sensor-binding.md` — 센서 감지 규칙
