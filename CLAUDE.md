# seoyoung-agents — CLAUDE.md

공유 규칙은 `AGENTS.md`를 참조한다. 이 파일은 Claude Code 전용 규칙만 정의한다.

## sync 배포 명령

- `npm run sync` — claude + codex 동시 배포
- `npm run sync:claude` — Claude Code만
- `npm run sync:codex` — Codex만
- `npm run sync:backup` — 백업 후 배포
- `npm run sync:dry` — 변경 없이 확인만

## 사용 가능한 커맨드

### Skills (자기완결 SKILL.md)
- `/task` — 전체 오케스트레이션
- `/commit` — 컨벤션에 맞춰 커밋
- `/e2e` — E2E 테스트 실행 + 결과 요약
- `/cross-review` — 에이전트 간 교차 리뷰 (Claude↔Codex)
- `/deep-interview [scope]` — 요구사항 인터뷰 + 개발자 체크리스트 (scope: frontend/backend/infra/fullstack)

### Commands (orchestrator 참조형)
- `/plan` — 계획만 생성
- `/review` — unit scope 리뷰
- `/review-branch` — full-branch 리뷰

## Hook 스크립트

- `scripts/guard.py` — 위험 명령 차단 (PreToolUse)
- `scripts/verify.py` — 코드 변경 시 자동 검증 (Stop)
- 활성화: `~/.claude/settings.json`에 수동 등록 (README 참조)
