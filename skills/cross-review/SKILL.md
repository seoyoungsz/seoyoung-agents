---
name: cross-review
description: 현재 에이전트와 다른 에이전트에게 작업 결과를 독립적으로 검증시킨다. second opinion이 필요할 때 사용.
---

# Cross-Review

현재 에이전트와 **다른** 에이전트에게 작업 결과를 독립적으로 검증시킨다.

## Step 1: 현재 에이전트 판별

아래 순서로 확인하여 첫 번째로 매칭되는 결과를 사용한다:

| 순서 | 확인 방법 | 결과 |
|------|----------|------|
| 1 | 현재 모델 ID가 `claude-` 접두사 | **Claude** |
| 2 | 현재 모델 ID가 `gpt-` 또는 `o1-` 또는 `codex-` 접두사 | **Codex** |
| 3 | 환경 변수 `CLAUDE_CODE` 존재 | **Claude** |
| 4 | 환경 변수 `CODEX_CLI` 존재 | **Codex** |
| 5 | 위 어느 것도 해당하지 않음 | **불명** |

양쪽 신호가 동시에 감지되는 경우(예: Claude Code에서 Codex 플러그인 사용) 모델 ID 기준(순서 1-2)을 우선한다.

## Step 2: 리뷰 대상 결정

아래 순서로 리뷰 대상을 결정한다:

1. 사용자가 파일/범위를 명시 → 그것을 사용
2. uncommitted 변경이 있으면 → `git diff` + `git diff --staged`
3. 둘 다 없으면 → 사용자에게 무엇을 리뷰할지 질문

## Step 3: 리뷰어 선택

**핵심 원칙: 반드시 교차 에이전트 위임을 먼저 시도한다. 대상 유형(코드/문서)과 무관하게 상대 에이전트가 1순위다. 어떤 경로든 같은 에이전트가 자기 작업을 리뷰하지 않는다.**

### 현재 에이전트가 Claude인 경우

1. **1순위 — Codex에 위임**: `/codex:rescue`에 대상(diff/파일/문서)과 함께 리뷰 요청
2. **2순위 — Codex 사용 불가 시에만** fallback 테이블로 전환

### 현재 에이전트가 Codex인 경우

1. **1순위 — Claude에 위임**: `claude -p` CLI로 리뷰 프롬프트를 전달하여 독립 세션에서 실행
2. **2순위 — Claude CLI 사용 불가 시에만** fallback 테이블로 전환

### Fallback 테이블 (교차 위임 실패 시에만 적용)

상대 에이전트 위임이 실패한 경우, 대상 유형에 따라 분류하여 위임한다. 현재 에이전트와 동일한 리뷰어는 건너뛰고 Fallback 체인의 다음 단계로 진행한다.

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

교차 위임이 실패하면 아래 순서로 대체한다. 어떤 경로든 같은 에이전트가 자기 작업을 리뷰하지 않는다.

1. 교차 위임 실패 (Codex 플러그인 불가 또는 Claude CLI 불가) → fallback 테이블(Step 3)로 전환
2. fallback 테이블의 리뷰어도 실패 → `ce-adversarial-reviewer` agent spawn
3. CE reviewer 사용 불가 → seoyoung-agents의 reviewer persona를 fallback으로 사용한다
4. 모든 외부 리뷰어 불가 → 사용자에게 보고 후 종료

## 플러그인

- compound-engineering 플러그인 — `ce-adversarial-document-reviewer`, `ce-coherence-reviewer`, `ce-adversarial-reviewer`
- codex 플러그인 — `/codex:rescue`
