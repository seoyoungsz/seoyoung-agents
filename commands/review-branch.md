---
description: base branch 이후 전체 커밋에 대해 computational 센서 + inferential 리뷰를 수행한다.
---

# Review Branch (Full-branch Scope)

오케스트레이터 역할로 full-branch scope 리뷰를 수행한다.

## 실행 흐름

1. sensor-binding 확인 (`.claude/sensor-cache.json` 없으면 감지 실행)
2. base_branch 확인 (sensor-cache에서 읽기)
3. `git diff {base_branch}...HEAD`로 diff 생성
4. computational 센서 실행 (lint, typecheck, test, build)
5. 센서 실패 시 → 결과 보고 후 종료 (standalone 명령이므로 implementer 반환 없음)
6. 센서 통과 시 → reviewer를 scope: full-branch로 spawn
7. reviewer에게 전달: diff, computational_sensor_results, attempt_number: 1, must_verify_behaviors: []
8. reviewer의 review_result를 보고

## 참조

- `personas/orchestrator.md` — 센서 실행 책임, 리뷰 정책
- `personas/reviewer.md` — 컨텍스트 격리 리뷰, YAML 아웃풋
- `adapters/sensor-binding.md` — 센서 감지 규칙, base branch 감지
