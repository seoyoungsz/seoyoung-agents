---
name: agents-template
description: 새 프로젝트에 합류할 때 AGENTS.md를 세팅하는 템플릿 + 기존 CLAUDE.md와의 충돌 확인 가이드.
metadata:
  type: guide
---

# AGENTS.md Template

새 프로젝트에 합류할 때 이 템플릿을 참고하여 프로젝트의 AGENTS.md를 세팅하거나, 기존 CLAUDE.md와 seoyoung-agents global 설정 간 충돌을 확인한다.

## 사용법

### 프로젝트에 CLAUDE.md/AGENTS.md가 이미 있을 때

1. 기존 파일을 읽는다
2. 아래 충돌 체크리스트로 seoyoung-agents global과 충돌하는 부분을 확인한다
3. 충돌이 있으면 프로젝트 파일이 우선한다 — global 규칙을 수정할 필요 없음

### 프로젝트에 CLAUDE.md/AGENTS.md가 없을 때

아래 템플릿을 기반으로 프로젝트 루트에 AGENTS.md를 생성한다.

## 충돌 체크리스트

seoyoung-agents global 설정과 프로젝트 설정이 다를 수 있는 영역:

| 영역 | global (seoyoung-agents) | 확인할 것 |
|------|------------------------|----------|
| 커밋 컨벤션 | `<type>: <summary>` | 프로젝트가 다른 포맷을 쓰는가? (prefix, scope 등) |
| 테스트 전략 | test-first (implementer) | 프로젝트가 TDD를 금지하는가? |
| 코드 스타일 | 불변성, 50줄 함수 제한 | 프로젝트의 lint 규칙과 다른가? |
| 리뷰 정책 | /review, /review-branch | 프로젝트에 자체 리뷰 command가 있는가? |

충돌 발견 시: 프로젝트 CLAUDE.md/AGENTS.md에 명시된 규칙이 우선한다.

---

## 템플릿

아래를 프로젝트 루트에 `AGENTS.md`로 저장한다. 각 섹션을 프로젝트에 맞게 채운다.

```markdown
# [프로젝트명] — AGENTS.md

## 에이전트 행동 원칙

seoyoung-agents의 AGENTS.md에서 4원칙을 복사한다:
1. Think Before Coding — 가정 명시, 질문
2. Simplicity First — 최소 코드, 추상화 금지
3. Surgical Changes — 필요한 것만 수정
4. Goal-Driven Execution — 검증 가능한 목표

프로젝트에 맞게 sub-bullet을 추가/수정한다.

## 프로젝트 개요

- 프로젝트명:
- 기술 스택:
- 주요 패키지/디렉토리:

## 출력 정책

- 언어: 한국어 기본, 프로젝트 설정에 따라 변경
- 톤:
- 이모지: 사용하지 않음 (명시적 요청 시에만)

## 코드 표준

- 린터:
- 포매터:
- 금지 패턴:

## 테스트 정책

- test-first: must_verify_behaviors에 대해 적용
- 커버리지 기준:
- 테스트 도구:

## 검증 게이트

- lint:
- typecheck:
- test:
- build:

## 운영 경계

- DB 접근: (read-only / read-write / 금지)
- 인프라: (read-only / 금지)
- 배포: 에이전트가 직접 배포하지 않음

## 커밋 정책

- 포맷: `<type>: <summary>`
- body: `- <what and why changed>`
- 프로젝트별 규칙이 있으면 여기에 명시

## 워크플로우

사용 가능한 seoyoung-agents 커맨드:
- `/plan` — 계획만 생성
- `/task` — 전체 오케스트레이션
- `/review` — 현재 변경 리뷰
- `/review-branch` — 브랜치 전체 리뷰
- `/commit` — 컨벤션에 맞춰 커밋

## 패키지 맵

(모노레포인 경우 각 패키지 역할을 기술)
```
