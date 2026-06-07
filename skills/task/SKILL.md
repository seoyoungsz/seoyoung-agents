---
name: task
description: 오케스트레이터 역할을 맡아 전체 워크플로우를 실행한다. 복잡한 요청에 사용.
---

# Task — Full Orchestrated Workflow

`personas/orchestrator.md`를 읽고 오케스트레이터 역할을 맡은 상태에서 이 프로토콜을 실행한다.

---

## Step 0: Environment Check — Sensor-binding 초기화

프로젝트에 처음 진입하면 sensor-binding 감지를 1회 실행한다. 감지 결과가 없는 상태에서는 어떤 작업도 시작하지 않는다.

`adapters/sensor-binding.md`를 확인하여 실행 가능한 센서를 감지한다. 감지 결과는 `.claude/sensor-cache.json`에 저장한다.

### 캐시 재사용과 만료

캐시가 존재하면 재사용한다. 단, 아래 조건에서 재감지한다:

- `package.json`, `pyproject.toml`, `go.mod`, `Makefile`, `Justfile`, `docker-compose.yml`, `playwright.config.*`, `cypress.config.*` 등 프로젝트 설정 파일의 mtime이 `detected_at`보다 최신인 경우
- 캐시에 기록된 명령이 실행 시 "command not found"로 실패하는 경우
- 사용자가 명시적으로 재감지를 요청하는 경우

재감지가 필요하면 사용자에게 알리고 재감지를 수행한 후 진행한다.

---

## Step 1: Bootstrap — 요청 분류, Linear, Deep-interview, Plan 로드

### 1-1. 요청 분류

요청을 받으면 먼저 영향 범위를 판단하여 분류한다.

| 조건 | 분류 | planner |
|------|------|---------|
| 수정 파일 1~2개, 의존성 없음 | 단순 | skip — 바로 implementer |
| 수정 파일 3개+, 또는 패키지 간 의존성 있음 | 복잡 | 필요 |
| 영향 범위를 확신할 수 없음 | 불명확 | 필요 — 범위 파악 자체가 planner의 가치 |

단순 요청 분기는 Step 1 완료 후 Step 3(Execute)으로 바로 이동한다.

### 1-2. Linear 이슈 자동 읽기

요청에 Linear 이슈 ID가 포함되어 있으면 (예: `PROJ-123`, `MED-42` 등) Linear MCP 도구로 이슈 메타데이터를 자동으로 가져온다.

가져오는 정보:
- 이슈 제목, 설명, 상태
- 담당자, 우선순위, 라벨
- 상위 Epic/Milestone (있는 경우)
- 관련 이슈 (있는 경우)

가져온 정보는 bootstrap context에 포함되어 planner에게 전달된다. deep-interview에서 이미 명확한 정보가 있으면 중복 질문을 피한다.

이슈 ID가 없으면 이 단계를 건너뛴다.

### 1-3. Notion 기획 문서 읽기 (읽기 모드)

사용자가 Notion 기획 문서를 지정한 경우, notion-expert를 읽기 모드로 spawn한다.

읽기 모드 notion-expert는 advisory-only가 아닌 **bootstrap context 공급자**다. `extracted` 필드의 데이터를 Linear 이슈 메타데이터, interview_result와 합쳐 planner의 bootstrap context로 전달한다.

Notion 문서가 지정되지 않은 경우 이 단계를 건너뛴다.

### 1-4. Deep-interview 트리거 조건

복잡한 요청에서 아래 중 하나라도 해당하면 planner 전에 `guides/deep-interview.md`를 로드하여 인터뷰를 수행한다:

- 목표가 명시되지 않았거나 여러 해석이 가능
- 범위(포함/제외)가 불분명
- 완료 기준이 없거나 모호
- 사용자의 요청이 한 문장 이하로 짧고 맥락이 부족

요구사항이 이미 명확하면 (목표, 범위, 제약, 완료 기준이 모두 식별 가능) 건너뛴다.

interview_result는 bootstrap context의 일부다. 오케스트레이터가 영향받는 패키지/디렉토리 목록과 sensor-binding 결과를 추가하여 완전한 bootstrap context를 구성한 후 planner에게 전달한다.

### 1-5. Plan 로드

`.claude/docs/`에서 `.md` 파일을 탐색한다. frontmatter에 `slug`와 `status` 필드가 모두 존재하는 파일만 plan으로 인식한다. slug의 정본(source of truth)은 frontmatter의 `slug` 필드다. 파일명은 slug와 일치시키되, 불일치 시 frontmatter를 우선한다.

분기 처리:

1. `status: approved`인 plan이 있으면 사용자에게 제안한다
   - 여러 개 있으면 `updated_at` 기준 최신을 우선 제안하되, 전체 목록도 함께 보여준다
   - 수락 시: planner spawn을 건너뛰고 바로 manifest 검증 → implementer 실행 (Step 2 skip → Step 3)
   - 거절 시: 기존 flow(planner spawn)로 진행 (Step 2)

2. `status: draft`인 plan만 있으면 "이전 draft가 있다. 이어서 할까, 새로 시작할까?" 제안한다
   - 이어서: draft를 planner에게 bootstrap context로 전달하여 재개
   - 새로 시작: draft를 무시하고 기존 flow로 진행

3. 해당하는 plan이 없으면 탐색 단계를 건너뛰고 기존 flow로 진행한다

---

## Step 2: Plan — Planner Spawn, Manifest 검증, Plan 저장

### 2-1. Planner Spawn

bootstrap context(objective, scope, constraints, Linear 메타데이터, interview_result, notion-expert extracted)와 함께 planner를 spawn한다.

planner를 spawn할 때 `.claude/docs/`의 파일 목록을 확인하고, 각 파일명에서 `.md`를 제거한 slug 목록을 `existing_plan_slugs`로 전달한다.

planner가 반환하는 것:
- 인간이 읽을 수 있는 plan 요약
- 기계가 읽을 수 있는 spawn manifest (unit별 objective, scope, depends_on, done_criteria, must_verify_behaviors 포함)
- 필요한 전문가 목록 (architect, qa-expert 등)
- `review_strategy` 권장 (`"unit + full-branch"` 또는 `"full-branch-only"`)

planner 실패 시 사용자에게 보고하고, 수동 범위 지정을 요청한다.

### 2-2. Plan 저장

planner가 plan을 반환하면 `.claude/docs/{slug}.md`에 저장한다.

저장 포맷:

```markdown
---
slug: {slug}
status: draft
objective: "..."
created_at: {date}
updated_at: {date}
---

{plan YAML 본문}
```

- planner 재spawn 시 같은 slug로 덮어쓴다 (updated_at 갱신)

### 2-3. 사용자 Plan 승인

plan을 사용자에게 제시한다. 사용자는 plan 승인 시 전문가(architect, qa-expert 등)를 추가하거나 제거할 수 있다.

사용자가 승인하면 frontmatter의 `status`를 `approved`로 업데이트하고 `updated_at`을 갱신한다.

승인 없이 다음 단계로 진행하지 않는다.

### 2-4. Spawn Manifest 검증

planner가 반환한 manifest를 실행 전에 검증한다. 아래 조건을 모두 만족해야 통과:

- 모든 unit에 unit_id, objective, scope_read, scope_write, depends_on, done_criteria, must_verify_behaviors가 있음
- conflict-safe: scope_write에서 같은 파일을 쓰는 unit이 2개 이상 없음
- 의존성에 순환이 없음
- scope에 존재하지 않는 파일 경로가 없음 (신규 파일 생성은 허용)

검증 실패 시 planner를 재spawn하여 수정을 요청한다. 2회 연속 실패하면 사용자에게 escalation한다.

### 2-5. must_verify_behaviors 생성 규칙

복잡한 요청: planner가 각 unit의 must_verify_behaviors를 생성한다.

단순한 요청: planner를 거치지 않으므로 오케스트레이터가 사용자 요청에서 직접 추출한다. 명시적인 검증 동작이 없으면 빈 목록으로 둔다.

---

## Step 3: Execute — Implementer Spawn, 병렬 그룹

### 3-1. 실행 큐 구성

depends_on 기준으로 의존성 순서와 병렬 그룹을 구성한다. conflict-safe 단위끼리만 병렬로 spawn한다 (같은 파일을 쓰는 단위가 없어야 함).

worktree 격리는 사용하지 않는다. 비용이 높고, 충돌을 뒤로 미룰 뿐이다. planner에서 미리 잡는 것이 feedforward 원칙에 맞다.

### 3-2. Implementer Spawn

각 unit에 아래를 포함하여 implementer를 spawn한다:

- 전체 목표 (global objective)
- 단위 목표 (unit objective)
- scope_read — 컨텍스트를 위해 읽어야 할 파일
- scope_write — 수정 가능한 파일
- depends_on — 다른 단위와의 의존성
- done_criteria — 검증 가능한 완료 조건
- must_verify_behaviors — 반드시 검증해야 할 동작 목록
- attempt_number — 몇 번째 시도인지
- review_findings — 재dispatch 시 이전 `review_result.findings` 배열 (high severity만 전달)
- related guides — persona의 related_guides + guide 바인딩 휴리스틱으로 추가된 guide

implementer는 코드 작성만 하고, 커밋은 unit 완료 후 오케스트레이터가 변경 단위별로 분리하여 수행한다. 커밋 메시지는 `guides/git-workflow.md`의 컨벤션을 따른다.

### 3-3. scope_exceeded 처리

implementer가 `status: scope_exceeded`를 반환하면, 오케스트레이터는 복잡한 요청으로 재분류하여 planner를 spawn한다.

선행 unit이 실패하면 의존하는 unit을 진행하지 않는다.

---

## Step 4: Review — Unit/Full-branch 리뷰, 피드백 루프, E2E

### 4-1. Unit-level 리뷰

복잡한 요청: 기본값 off. 다음 경우에 활성화:
- 사용자가 명시적으로 요청
- planner가 `review_strategy: "unit + full-branch"`를 추천하고 사용자가 plan 승인 시 수락

단순한 요청: 기본값 on. planner와 full-branch 리뷰가 없으므로 unit 리뷰가 유일한 inferential 게이트다.

unit-level 리뷰 활성화 시: computational 센서 실행(unit scope) → 통과하면 reviewer spawn(scope: unit) → 피드백 루프(필요 시).

### 4-2. Computational 센서 실행

computational 센서는 오케스트레이터가 직접 실행한다. reviewer는 센서를 실행하지 않는다.

센서 실패 시 reviewer를 spawn하지 않고 implementer에게 바로 반환한다. 센서 통과 시 결과를 reviewer에게 전달한다.

| scope | 실행 센서 |
|-------|----------|
| unit | lint, typecheck, test |
| full-branch | lint, typecheck, test, build |
| full-branch + e2e | lint, typecheck, test, build, e2e (감지 + readiness 충족 시) |

프로젝트에 `check` 스크립트(lint+typecheck 통합)가 있으면 lint, typecheck 대신 check를 실행한다. sensor-binding 감지 결과에 따른다. reviewer에게 전달할 때는 check 결과를 `lint: pass, typecheck: pass`로 분리하여 전달한다. reviewer의 YAML 스키마는 항상 lint, typecheck를 개별 필드로 사용한다.

### 4-3. E2E 실행 및 재시도 흐름

e2e 센서가 감지되어 있고 readiness가 충족된 경우 full-branch 리뷰 전에 e2e를 실행한다.

e2e 실패 시:
1. 실패한 테스트 정보와 함께 해당 implementer에게 반환
2. implementer가 수정 후 재실행
3. 같은 E2E 실패가 3번 반복되면 사용자에게 escalation한다 (flaky 가능성)

e2e 결과(성공/실패 정보)는 full-branch reviewer에게도 전달한다.

### 4-4. Full-branch 리뷰

복잡한 요청에서 핸드오프 전 필수. 생략할 수 없다. 단순한 요청에서는 수행하지 않는다.

computational 센서 실행(full-branch scope, build 포함) → 통과하면 reviewer spawn(scope: full-branch).

### 4-5. 피드백 루프 재시도 흐름

reviewer가 `status: needs_fix`를 반환한 경우에만 루프에 진입한다.

```
reviewer (needs_fix) → high findings를 implementer에 전달 → 재구현 → 재리뷰
```

`status: clean` (medium-only 포함)이면 루프 없이 진행한다. medium findings가 있으면 사용자에게 목록을 제시하고, 사용자가 선택한 항목만 보완한다.

escalation 판단을 위한 반복 횟수는 오케스트레이터가 추적한다. reviewer는 매번 새로 spawn되므로 이전 라운드를 기억하지 못한다. 오케스트레이터가 spawn 시 `attempt_number`를 전달하여 reviewer가 몇 번째 리뷰인지 알 수 있게 한다.

같은 finding이 3번 반복되면 사용자에게 escalation한다. "같은 finding"의 기준은 동일 file + 동일 category 조합이다. 에이전트끼리 무한 루프를 돌지 않는다.

---

## Step 5: Handoff — 판단 기준, Handoff Spawn, Notion-expert

### 5-1. 핸드오프 판단 기준

아래 조건을 모두 만족해야 핸드오프한다:

- 모든 단위의 구현이 완료됨
- full-branch 리뷰에서 status: clean
- computational 센서 전체 통과
- must_verify_behaviors 전체 검증 완료

단순한 요청에서는 unit 리뷰 clean + 센서 통과 시 오케스트레이터가 변경 사항과 검증 결과를 인라인으로 요약하고 완료한다 (handoff spawn 없음).

### 5-2. Handoff Spawn

복잡한 요청에서 판단 기준 통과 시 handoff를 spawn하여 최종 전달 요약을 생성한다.

handoff 아웃풋에 포함되는 것:
- 완료된 단위와 결과
- 변경된 파일 목록
- 검증 증거 (센서 결과, 테스트 결과)
- 리뷰 이력 (라운드 수, 해결된 findings)
- 잔여 리스크 및 후속 작업

### 5-3. Notion-expert 쓰기 모드

핸드오프 후, 아래 조건에 해당하면 notion-expert를 쓰기 모드로 실행한다:

- 사용자가 명시적으로 Notion 기록을 요청한 경우
- planner가 spawn manifest에 notion-expert(쓰기)를 포함하고 사용자가 plan 승인 시 수락한 경우

위 조건에 해당하지 않으면 쓰기 모드를 실행하지 않는다.

쓰기 모드는 side-effect를 수반하므로, 오케스트레이터는 쓰기 내용을 사용자에게 먼저 보여주고 승인을 받은 후 실행한다.

---

## 전체 분배 흐름

### 복잡한 요청

```
요청 접수
    ↓
sensor-binding 확인 (캐시 있으면 skip, Step 0)
    ↓
Linear 이슈 감지 (Step 1-2)
    ↓
notion-expert 읽기 (Notion 기획 문서가 지정된 경우, Step 1-3)
    ↓
plan 로드 탐색 (.claude/docs/ 탐색 → approved/draft 제안, Step 1-5)
    ↓
deep-interview (조건 해당 시, Step 1-4)
    ↓
planner spawn (단위 분해 + spawn manifest + 전문가 포함, existing_plan_slugs 전달, Step 2-1)
    ↓
planner 실패 시 → 사용자에게 보고, 수동 범위 지정 요청
    ↓
plan 저장 (.claude/docs/{slug}.md, status: draft, Step 2-2)
    ↓
사용자 plan 승인 (전문가 추가/제거 가능, Step 2-3)
    ↓
plan 업데이트 (status: approved, updated_at 갱신)
    ↓
spawn manifest 검증 (Step 2-4)
    ↓
implementer × N spawn (conflict-safe 단위는 병렬로, Step 3)
    ↓
[unit-level 리뷰가 활성화된 경우]
    computational 센서 실행 (unit scope)
    → reviewer spawn (scope: unit)
    → 피드백 루프 (필요 시)
    ↓
computational 센서 실행 (full-branch scope, build 포함)
    ↓
[e2e 센서가 감지되어 있고 readiness 충족 시]
    e2e 실행 → 실패 시 실패한 테스트 정보와 함께 implementer에게 반환
    → 재실행 (e2e만, computational 센서 재실행 불필요)
    → 같은 E2E 실패가 3번 반복 시 사용자에게 escalation (flaky 가능성)
    ↓
reviewer spawn (scope: full-branch) — 필수
    (e2e 결과도 reviewer에게 전달)
    ↓
피드백 루프 (필요 시)
    ↓
handoff spawn (최종 전달 요약)
    ↓
[notion-expert 쓰기가 요청된 경우]
    notion-expert spawn (쓰기 모드) → 사용자 확인 → Notion 기록
```

### 단순한 요청

```
요청 접수
    ↓
sensor-binding 확인 (캐시 있으면 skip)
    ↓
implementer spawn (1개)
    ↓
computational 센서 실행
    ↓
reviewer spawn (scope: unit)
    ↓
피드백 루프 (필요 시)
    ↓
완료 (오케스트레이터가 변경 사항과 검증 결과 인라인 요약)
```

단순한 요청에서는 planner, handoff를 거치지 않는다. 전문가가 필요하면 사용자가 직접 지정한다.
