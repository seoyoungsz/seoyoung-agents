---
name: deep-interview
description: 모호한 요청을 소크라테스식 질문으로 인터뷰해 실행 가능한 요구사항으로 정리한다. planner 전에 사용한다.
---

# Deep Interview

모호한 요청을 바로 실행하지 않는다. 명확한 요구사항으로 정리한 후 planner에게 넘긴다.

원칙: 질문을 한꺼번에 쏟아내지 않는다. 가장 큰 불확실성을 하나씩 해소한다.

## 입력 컨텍스트

호출자(`/task`, `/plan`)가 이미 확보한 데이터가 있으면 인터뷰 시작 전에 전달받는다:

- **Linear 이슈 메타데이터** — 제목, 설명, 상태 등
- **Notion extracted 데이터** — 기획 문서에서 추출한 요구사항

이미 명확한 축은 질문하지 않는다. 예: Linear 이슈에 목표가 명시되어 있으면 Goal 질문을 건너뛴다. Notion extracted가 4축(goal, scope, constraints, completion criteria)을 모두 충족하면 인터뷰 자체를 건너뛴다.

단독 호출(`/deep-interview`) 시에는 입력 컨텍스트 없이 시작한다.

## 질문 축

아래 순서대로 가장 불명확한 축을 선택한다:

1. **목표 (Goal)** — 무엇을 달성하려는가
2. **범위 (Scope)** — 포함/제외 범위
3. **제약 (Constraints)** — 기술적, 시간적, 자원 제약
4. **완료 기준 (Completion criteria)** — 어떻게 되면 끝인가

기존 맥락과 영향 범위(어떤 패키지/파일이 영향받는가)는 사용자에게 묻지 않는다. 오케스트레이터가 코드베이스를 직접 확인하여 bootstrap context에 추가한다.

코드베이스를 보면 답할 수 있는 질문은 사용자에게 묻지 않고 직접 확인한다.

## 진행 방식

한 번에 하나의 질문만 한다. 각 질문은 아래 구조를 따른다:

```
현재 이해: {요청에 대한 한 문장 요약}
막힌 결정: {가장 중요한 불확실성}
추천 답안: {추천하는 답, 있는 경우}
질문: {하나의 질문}
```

각 답변 후 결정된 사항을 간략히 업데이트한다. 의미 있는 불확실성이 남아 있을 때만 다음 질문을 한다. 도움이 될 때 2~3개 선택지를 제시하되, 자유 입력을 항상 허용한다.

## 종료 기준

아래가 모두 명확해지면 인터뷰를 종료한다:

- 달성할 목표
- 포함/제외 범위
- 지켜야 할 제약
- 완료 기준

인터뷰 중 해결할 수 없는 질문이 남으면 인터뷰를 종료하지 않고 사용자에게 답을 구한다. 모든 축이 명확해야 종료할 수 있다.

## 출력 계약

종료 시 전체 대화록이 아니라 결정사항만 요약한다. 아래 top-level YAML 형태를 그대로 출력한다. 래퍼(`skill_result` 등)로 감싸지 않는다.

```yaml
interview_result:
  goal: "..."
  scope_in: [...]
  scope_out: [...]
  constraints: [...]
  completion_criteria: [...]
```

## 역할 경계

이 skill은 **요구사항 명확화 전용**이다. bootstrap context 완성(영향받는 패키지/디렉토리 목록, sensor-binding 결과 추가)은 호출자(`/task`, `/plan`)의 책임이다.

단독 호출 시(`/deep-interview`) `interview_result`만 출력하고 종료한다. planner spawn이나 구현은 하지 않는다.

## 유사 도구와의 구분

- `clarify:vague` — 범용 요구사항 명확화. deep-interview는 이 프로젝트의 planner bootstrap에 특화된 4축 구조와 `interview_result` YAML 출력을 제공한다.
- `ce-brainstorm` — 탐색적 아이디어 발산. deep-interview는 이미 방향이 정해진 요청의 불확실성을 해소한다.
