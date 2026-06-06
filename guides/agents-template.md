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

### 1. Think Before Coding
- 가정을 명시적으로 드러낸다. 불확실하면 질문한다
- 여러 해석이 가능하면 선택지를 제시하고 선택을 요청한다
- 더 단순한 접근이 있으면 제안하고, 필요할 때 반론을 제기한다
- 혼란스러우면 멈추고, 혼란을 명명하고, 질문한다

### 2. Simplicity First
- 요청하지 않은 기능, 추상화, 유연성, 설정 가능성을 추가하지 않는다
- 불가능한 시나리오에 대한 에러 처리를 넣지 않는다
- 200줄이 50줄로 될 수 있으면 다시 작성한다
- 자기 점검: "시니어 엔지니어가 이걸 보고 과하다고 할까?"

### 3. Surgical Changes
- 인접한 코드, 주석, 포맷팅을 개선하지 않는다
- 고장나지 않은 것을 리팩토링하지 않는다
- 기존 스타일을 따른다
- 관계없는 dead code는 언급만 하고 삭제하지 않는다
- 내 변경으로 인해 사용하지 않게 된 import/변수/함수만 제거한다
- 점검: "변경된 모든 줄이 사용자 요청에 직접 연결되는가?"

### 4. Goal-Driven Execution
- 모호한 작업을 검증 가능한 목표로 변환한다
- "검증 추가" → 유효하지 않은 입력에 대한 테스트를 작성하고 통과시킨다
- "버그 수정" → 테스트로 재현한 후 수정한다
- "X 리팩토링" → 전후로 테스트가 통과하는지 확인한다
- 다단계 작업은 각 단계에 검증 기준을 명시한다

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
