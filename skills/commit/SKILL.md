---
name: commit
description: 현재 변경 사항을 분석하고 커밋 컨벤션에 맞춰 git 커밋을 생성한다. 커밋 요청, 커밋 메시지 작성, 스테이징 검토 시 사용한다.
---

# Commit

현재 변경 사항을 분석하여 하나의 잘 정의된 커밋을 만든다.

프로젝트의 AGENTS.md 또는 CLAUDE.md에 커밋 규칙이 있으면 그것이 우선한다.

## 커밋 메시지 포맷

### Subject

```
<type>: <short summary>
```

이슈 트래커 ID가 있는 경우:

```
<type>(<ISSUE-ID>): <short summary>
```

### Body

```
- <what and why changed>
- <what and why changed>
```

## Type (필수)

| type     | 용도                     |
| -------- | ------------------------ |
| feat     | 새 기능                  |
| fix      | 버그 수정                |
| refactor | 동작 변경 없는 구조 개선 |
| test     | 테스트 추가/수정         |
| docs     | 문서 변경                |
| chore    | 빌드, 설정, 의존성 등    |

## 규칙

- subject는 72자 이하
- body bullet은 `- <what and why changed>` 형태 — 변경 내용과 이유를 한 문장에 담는다
- 각 bullet도 72자 이하 — 초과 시 여러 bullet으로 분리
- body에 `Summary:`, `Rationale:`, `Tests:` 같은 섹션 헤더 금지
- 한국어 기본, 프로젝트 설정에 따라 영어 가능

## 커밋 단위

- 하나의 커밋은 하나의 논리적 변경
- 여러 파일을 수정해도 같은 목적이면 하나의 커밋
- 목적이 다른 변경이 섞여 있으면 사용자에게 분리를 제안한다

## 실행 흐름

1. `git status --short`, `git diff`, `git diff --staged` 확인
2. 변경 사항의 목적을 파악하고 커밋 단위를 판단
   - 목적이 다른 변경이 섞여 있으면 사용자에게 분리 제안
3. 스테이징되지 않은 파일 중 의도된 변경을 stage
4. 안전 점검:
   - `.env`, credentials, 시크릿 파일이 포함되지 않았는지 확인
   - 로그, 임시 파일, 빌드 아티팩트가 포함되지 않았는지 확인
5. 커밋 메시지 작성 (위 포맷 준수)
6. 커밋 실행

## 예시

```
feat: 실시간 알림 기능 추가

- 마켓 해결 시 구독자에게 알림을 보내도록 NotificationService 구현
- BullMQ 기반 큐로 비동기 전송 처리
```

```
fix(PROJ-42): 로그인 리다이렉트 조건 보정

- 세션 복원 시 의도한 화면으로 돌아가도록 리다이렉트 조건 수정
```

```
refactor: /commit 커맨드를 SKILL.md로 전환

- 외부 guide 참조 없이 자기완결적으로 동작하도록 규칙을 인라인으로 통합
```

```
chore: 의존성 버전 업데이트

- 보안 패치 적용을 위해 axios 1.6.0으로 업그레이드
```
