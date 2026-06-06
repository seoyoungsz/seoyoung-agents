---
description: diff를 분석하고 git-workflow 컨벤션에 맞춰 커밋을 생성한다.
---

# Commit

`guides/git-workflow.md`의 커밋 컨벤션을 따라 커밋을 생성한다.

## 실행 흐름

1. `guides/git-workflow.md` 로드 — 커밋 컨벤션 참조
2. `git status --short`, `git diff`, `git diff --staged` 확인
3. 변경 사항의 목적을 파악하고 커밋 단위를 판단
   - 하나의 논리적 변경 → 하나의 커밋
   - 목적이 다른 변경이 섞여 있으면 → 사용자에게 분리 제안
4. 스테이징되지 않은 파일 중 의도된 변경을 stage
5. 안전 점검:
   - .env, credentials, 시크릿 파일이 포함되지 않았는지 확인
   - 로그, 임시 파일, 빌드 아티팩트가 포함되지 않았는지 확인
6. 커밋 메시지 작성:
   - subject: `<type>: <summary>` (72자 이하)
   - body: `- <what and why changed>` bullets
7. 커밋 메시지를 사용자에게 제시하고 확인 후 커밋

## 프로젝트별 커스터마이즈

프로젝트의 AGENTS.md 또는 CLAUDE.md에 커밋 규칙이 있으면 그것이 우선한다.
git-workflow guide는 기본 규칙이다.

## 참조

- `guides/git-workflow.md` — 커밋 컨벤션, type 목록, 예시
