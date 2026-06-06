---
description: 오케스트레이터 역할을 맡아 전체 워크플로우를 실행한다. 복잡한 요청에 사용.
---

# Task — Full Orchestrated Workflow

`personas/orchestrator.md`를 읽고 오케스트레이터 역할을 맡는다.

## 실행 흐름

1. `personas/orchestrator.md` 로드 — 역할 전환
2. `adapters/sensor-binding.md` 확인 — 센서 바인딩 초기화
3. `.claude/docs/`에서 저장된 plan 탐색 — approved/draft 제안 (아래 참조)
4. 요청 분류 (단순/복잡/불명확)
5. 이후 orchestrator.md의 분배 흐름을 따른다

## 저장된 plan 로드

step 3에서 `.claude/docs/`의 `.md` 파일을 탐색한다. 상세 규칙(plan 인식 조건, 복수 plan 처리, slug 정본)은 `personas/orchestrator.md`의 Plan 로드 섹션을 따른다.

- `status: approved` plan → 실행 여부 제안 (수락: planner skip, 거절: 기존 flow)
- `status: draft` plan → 이어서/새로 시작 제안
- plan 없음 → 건너뛰고 기존 flow

## 단순 요청 시

planner와 handoff 없이 바로 implementer → reviewer → 완료.

## 복잡 요청 시

저장된 plan 로드(approved) → planner skip → manifest 검증 → implementer × N → [unit reviewer (선택)] → full-branch reviewer (필수) → handoff.

plan이 없거나 거절한 경우: deep-interview (필요 시) → planner → 사용자 승인 → implementer × N → [unit reviewer (선택)] → full-branch reviewer (필수) → handoff.

## plan만 먼저 보고 싶다면

`/plan`을 사용한다. plan만 생성하고 구현은 하지 않는다. plan이 마음에 들면 그 후 `/task`로 실행할 수 있다.

## 참조

- `personas/orchestrator.md` — 전체 분배 흐름, 리뷰 정책, 핸드오프 기준
- `guides/deep-interview.md` — 요구사항 명확화
- `personas/planner.md` — 단위 분해, spawn manifest
- `personas/implementer.md` — 구현 전담
- `personas/reviewer.md` — 컨텍스트 격리 리뷰
- `personas/handoff.md` — 최종 전달 요약
