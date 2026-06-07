---
description: planner를 직접 spawn하여 plan만 생성한다. 구현은 하지 않는다.
---

# Plan — 계획만 생성

orchestrator를 거치지 않고 planner를 직접 spawn한다. plan만 필요할 때 사용한다.

## 실행 흐름

1. `.claude/docs/`에서 기존 plan 탐색 (상세 규칙은 `personas/orchestrator.md`의 Plan 로드 참조)
   - frontmatter에 `slug`와 `status`가 모두 있는 `.md` 파일만 plan으로 인식
   - `status: approved`인 plan이 있으면 수정/새로 시작 제안
   - `status: draft`인 plan만 있으면 이어서/새로 시작 제안
   - 해당하는 plan이 없으면 이 단계를 건너뛰고 진행
2. 요구사항이 모호하면 `guides/deep-interview.md`를 로드하여 인터뷰 수행
3. 영향받는 패키지/디렉토리를 코드베이스에서 파악
4. sensor-binding 확인 (`.claude/sensor-cache.json` 없으면 감지 실행)
5. `.claude/docs/`의 파일 목록을 확인하고 slug 목록을 `existing_plan_slugs`로 전달하여 planner spawn
6. plan을 사용자에게 제시
7. plan을 `.claude/docs/{slug}.md`에 `status: draft`로 저장
8. 사용자가 plan을 승인하면 `status: approved`로 업데이트하고 `updated_at` 갱신
9. 끝 — implementer spawn 안 함

## plan 이후

- 마음에 들면 → `/task`로 전체 워크플로우 실행 (저장된 plan을 자동으로 로드하여 planner spawn 없이 바로 실행)
- 수정이 필요하면 → 피드백 후 planner 재spawn, 같은 slug로 덮어쓰기 (updated_at 갱신)
- plan만 필요했으면 → 그대로 종료

## 참조

- `guides/deep-interview.md` — 요구사항 명확화
- `personas/planner.md` — 단위 분해, spawn manifest
- `adapters/sensor-binding.md` — 센서 감지 규칙
- `personas/orchestrator.md` — Plan Persistence 원칙
- `skills/task/SKILL.md` — Step 1-5, Step 2 상세 운영 로직
