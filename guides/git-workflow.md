---
name: git-workflow
description: 커밋 컨벤션, 브랜치 전략, PR 규칙. /commit command가 참조한다.
metadata:
  type: guide
---

# Git Workflow

## 커밋 컨벤션

### Subject 포맷

```
<type>: <short summary>
```

이슈 트래커 ID가 있는 경우:

```
<type>(<ISSUE-ID>): <short summary>
```

### Type (필수)

| type     | 용도                     |
| -------- | ------------------------ |
| feat     | 새 기능                  |
| fix      | 버그 수정                |
| refactor | 동작 변경 없는 구조 개선 |
| test     | 테스트 추가/수정         |
| docs     | 문서 변경                |
| chore    | 빌드, 설정, 의존성 등    |

### 규칙

- subject는 72자 이하
- body bullet은 `- <what and why changed>` 형태
- 각 bullet도 72자 이하 — 초과 시 여러 bullet으로 분리
- body에 `Summary:`, `Rationale:`, `Tests:` 같은 섹션 헤더 금지
- 한국어 기본, 프로젝트 설정에 따라 영어 가능

### 예시

```
feat: 실시간 알림 기능 추가

- 마켓 해결 시 구독자에게 알림을 보내도록 NotificationService 구현
- BullMQ 기반 큐로 비동기 전송 처리
```

```
fix(PROJ-42): 로그인 리다이렉트 조건 보정

- 세션 복원 시 의도한 화면으로 돌아가도록 리다이렉트 조건 수정
```

### 커밋 단위

- 하나의 커밋은 하나의 논리적 변경
- 여러 파일을 수정해도 같은 목적이면 하나의 커밋
- 목적이 다른 변경은 분리

## 브랜치 전략

<!-- TODO: 회사 합류 시 실제 규칙으로 채운다 (git-flow / trunk-based / GitHub flow) -->

## PR 규칙

<!-- TODO: PR 크기, 리뷰 필수 인원, 머지 전략 등 -->

## 보호 브랜치

<!-- TODO: main/dev 직접 push 금지, CI 통과 필수 등 -->
