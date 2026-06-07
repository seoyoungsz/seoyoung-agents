---
name: cross-review
description: 현재 에이전트의 작업 결과를 다른 에이전트에게 독립적으로 검증시킨다. second opinion이 필요할 때 사용.
---

# Cross-Review

한 에이전트의 작업 결과를 다른 에이전트에게 독립적으로 검증시킨다.

## 리뷰 대상 결정

아래 순서로 리뷰 대상을 결정한다:

1. 사용자가 파일/범위를 명시 → 그것을 사용
2. uncommitted 변경이 있으면 → `git diff` + `git diff --staged`
3. 둘 다 없으면 → 사용자에게 무엇을 리뷰할지 질문

## 리뷰 대상 분류 + 위임

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

## Fallback

- `/codex:rescue`가 실패하거나 Codex가 사용 불가 → compound-engineering 플러그인의 `ce-adversarial-reviewer` agent로 대체
- CE reviewer가 사용 불가 → seoyoung-agents의 reviewer persona를 fallback으로 사용한다
- 모든 외부 리뷰어 불가 → 사용자에게 보고 후 종료

## 플러그인

- compound-engineering 플러그인 — `ce-adversarial-document-reviewer`, `ce-coherence-reviewer`, `ce-adversarial-reviewer`
- codex 플러그인 — `/codex:rescue`
