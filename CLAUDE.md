# seoyoung-agents — CLAUDE.md

공유 규칙은 `AGENTS.md`를 참조한다. 이 파일은 Claude Code 전용 규칙만 정의한다.

## sync 배포 명령

- `npm run sync` — claude + codex 동시 배포
- `npm run sync:claude` — Claude Code만
- `npm run sync:codex` — Codex만
- `npm run sync:backup` — 백업 후 배포
- `npm run sync:dry` — 변경 없이 확인만

## 사용 가능한 커맨드

- `/plan` — 계획만 생성
- `/task` — 전체 오케스트레이션
- `/review` — unit scope 리뷰
- `/review-branch` — full-branch 리뷰
- `/commit` — 컨벤션에 맞춰 커밋
