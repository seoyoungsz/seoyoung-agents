# seoyoung-agents — AGENTS.md

이 파일은 seoyoung-agents 레포에서 작업할 때 적용되는 규칙이다.

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

## 프로젝트 구조

```
personas/    — 에이전트 역할 계약 (.md)
skills/      — 자기완결 SKILL.md (commit, e2e, cross-review, task)
commands/    — orchestrator 참조형 커맨드 (.md) (plan, review, review-branch)
guides/      — 도메인 지식 (.md)
adapters/    — 회사 도구 연결 (.md)
sync.ts      — 배포 스크립트
```

## 코드 표준

### sync.ts
- TypeScript strict mode
- `as any` 금지
- 새 TARGETS 추가 시 TargetConfig 인터페이스를 따른다
- TOML 변환 시 escapeTomlString/escapeTomlMultiline 사용 필수
- 변경 후 `npx tsc --noEmit` 통과 확인

### persona (.md)
- frontmatter 필수: name, description, tools, model
- spawnable: false는 orchestrator에만 사용
- codex_effort는 역할별 오버라이드가 필요할 때만 추가
- related_guides에 skeleton guide를 넣지 않는다 (내용이 채워진 후 추가)

### SKILL.md (skills/<name>/SKILL.md)
- frontmatter 필수: name, description
- name은 폴더명과 일치
- 자기완결: 외부 파일을 "로드하라"고 하지 않는다
- 배포 대상: Claude만 (Codex에는 배포하지 않음)

### guide (.md)
- frontmatter 필수: name, description, metadata.type
- 완성된 guide만 persona의 related_guides에 연결

## 검증

- TypeScript: `npx tsc --noEmit`
- Sync 테스트: `npm run sync:dry`
- 변경 후 리뷰: `/review` 또는 `/review-branch`

## 커밋 정책

- `guides/git-workflow.md`의 컨벤션을 따른다
- type: feat, fix, refactor, test, docs, chore
- subject 72자 이하
- body: `- <what and why changed>`

## 워크플로우

- persona/guide 수정 → `/review` → 리뷰 CLEAN 후 커밋
- sync.ts 수정 → `npx tsc --noEmit` + `/review` → 커밋
- 배포 → `npm run sync` (claude + codex 동시 배포)
- 배포 전 확인 → `npm run sync:dry`
