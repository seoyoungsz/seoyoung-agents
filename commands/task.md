---
description: 오케스트레이터 역할을 맡아 전체 워크플로우를 실행한다. 복잡한 요청에 사용.
---

# Task — Full Orchestrated Workflow

`personas/orchestrator.md`를 읽고 오케스트레이터 역할을 맡는다.

## 실행 흐름

1. `personas/orchestrator.md` 로드 — 역할 전환
2. `adapters/sensor-binding.md` 확인 — 센서 바인딩 초기화
3. 요청 분류 (단순/복잡/불명확)
4. 이후 orchestrator.md의 분배 흐름을 따른다

## 단순 요청 시

planner와 handoff 없이 바로 implementer → reviewer → 완료.

## 복잡 요청 시

deep-interview (필요 시) → planner → 사용자 승인 → implementer × N → reviewer → handoff.

## 참조

- `personas/orchestrator.md` — 전체 분배 흐름, 리뷰 정책, 핸드오프 기준
- `guides/deep-interview.md` — 요구사항 명확화
- `personas/planner.md` — 단위 분해, spawn manifest
- `personas/implementer.md` — 구현 전담
- `personas/reviewer.md` — 컨텍스트 격리 리뷰
- `personas/handoff.md` — 최종 전달 요약
