---
name: cross-review
description: 현재 에이전트와 다른 에이전트에게 작업 결과를 독립적으로 검증시킨다. second opinion이 필요할 때 사용.
---

# Cross-Review

현재 에이전트와 **다른** 에이전트에게 작업 결과를 독립적으로 검증시킨다.

## Step 1: 현재 에이전트 판별

어떤 에이전트에서 실행 중인지 판별한다:

| 판별 방법 | 결과 |
|----------|------|
| Codex 런타임 감지 (codex CLI, gpt 모델) | **Codex** |
| Claude Code 런타임 감지 (claude CLI, claude 모델) | **Claude** |
| 위 두 가지 모두 해당하지 않음 | **불명** |

## Step 2: 리뷰 대상 결정

아래 순서로 리뷰 대상을 결정한다:

1. 사용자가 파일/범위를 명시 → 그것을 사용
2. uncommitted 변경이 있으면 → `git diff` + `git diff --staged`
3. 둘 다 없으면 → 사용자에게 무엇을 리뷰할지 질문

## Step 3: 리뷰어 선택

### 현재 에이전트가 Claude인 경우

Codex에게 위임한다: `/codex:rescue`에 diff/파일과 함께 리뷰 요청.

### 현재 에이전트가 Codex인 경우

Claude에게 위임한다: Claude Code sub-agent를 spawn하여 리뷰 요청.

### 현재 에이전트를 판별할 수 없는 경우 (fallback)

대상 유형에 따라 분류하여 위임한다:

| 대상 유형 | 리뷰어 | 방법 |
|----------|--------|------|
| 코드 변경 (diff) | Codex | `/codex:rescue`에 diff와 함께 리뷰 요청 |
| 문서/plan (.md) | CE adversarial document reviewer | `ce-adversarial-document-reviewer` agent spawn |
| 일관성 검증 (여러 파일) | CE coherence reviewer | `ce-coherence-reviewer` agent spawn |
| 혼합 (코드 + 문서) | 양쪽 모두 | 코드는 Codex, 문서는 CE reviewer로 분리 위임 |

## 위임 시 전달할 것

### 코드 리뷰 위임 시

```
리뷰 대상: [diff 또는 파일 목록]
관점: 정확성, 보안, 성능, 품질
맥락: [변경 목적 한 줄 요약]
```

### 문서 리뷰 위임 시

```
리뷰 대상: [파일 경로]
관점: 내부 일관성, 모순, 누락, 실현 가능성
관련 파일: [cross-reference로 읽어야 할 파일]
```

## 결과 종합

1. 리뷰어의 findings를 수집
2. severity별로 정렬 (high → medium)
3. 충돌하는 의견이 있으면 양쪽 근거를 나란히 제시
4. 최종 요약: 수정 필요 여부 + 구체적 action items

## Fallback 체인

위임 대상이 실패하면 아래 순서로 대체한다:

1. `/codex:rescue` 실패 또는 Codex 사용 불가 → `ce-adversarial-reviewer` agent spawn
2. CE reviewer 사용 불가 → seoyoung-agents의 reviewer persona를 fallback으로 사용한다
3. 모든 외부 리뷰어 불가 → 사용자에게 보고 후 종료

## 플러그인

- compound-engineering 플러그인 — `ce-adversarial-document-reviewer`, `ce-coherence-reviewer`, `ce-adversarial-reviewer`
- codex 플러그인 — `/codex:rescue`
