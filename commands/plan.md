---
description: planner를 직접 spawn하여 plan만 생성한다. 구현은 하지 않는다.
---

# Plan — 계획만 생성

orchestrator를 거치지 않고 planner를 직접 spawn한다. plan만 필요할 때 사용한다.

## 실행 흐름

1. 요구사항이 모호하면 `guides/deep-interview.md`를 로드하여 인터뷰 수행
2. 영향받는 패키지/디렉토리를 코드베이스에서 파악
3. sensor-binding 확인 (`.claude/sensor-cache.json` 없으면 감지 실행)
4. planner를 spawn하여 plan 생성
5. plan을 사용자에게 제시
6. 끝 — implementer spawn 안 함

## plan 이후

- 마음에 들면 → `/task`로 전체 워크플로우 실행
- 수정이 필요하면 → 피드백 후 planner 재spawn
- plan만 필요했으면 → 그대로 종료

## 참조

- `guides/deep-interview.md` — 요구사항 명확화
- `personas/planner.md` — 단위 분해, spawn manifest
- `adapters/sensor-binding.md` — 센서 감지 규칙
