# seoyoung-agents

어디서 일하든 들고 다니는 개인 AI 에이전트/스킬 시스템.
하네스 엔지니어링(harness engineering) 관점으로 설계

## 설계 철학

에이전트에서 모델 자체를 제외한 모든 것(시스템 프롬프트, 도구, 컨텍스트 관리, 검증 루프)을 **하네스**라고 부른다.

| 구분                    | 시점    | 역할                     | 예시                 |
| ----------------------- | ------- | ------------------------ | -------------------- |
| **Guide** (feedforward) | 행동 전 | 좋은 결과를 내도록 유도  | guides/, personas/   |
| **Sensor** (feedback)   | 행동 후 | 자가수정하도록 신호 제공 | lint, test, reviewer |

**A 구조**: computational 센서(린터/타입체크/테스트)는 소유하지 않고, 회사 레포의 기존 것을 **바인딩**해서 쓴다. 그래서 회사를 옮겨도 그대로 동작한다.

## 디렉토리 구조

```
seoyoung-agents/
├── personas/           # 에이전트 — "누가" 보는가
│   ├── orchestrator    # 분배/조율 (메인 에이전트가 맡음, spawn 안 됨)
│   ├── planner         # 단위 분해 + spawn manifest
│   ├── implementer     # 구현 전담 leaf worker
│   ├── reviewer        # 컨텍스트 격리 리뷰
│   ├── handoff         # 최종 전달 요약
│   ├── architect       # 설계/의존성/기술부채
│   ├── qa-expert       # 테스트 설계/엣지케이스
│   ├── linear-expert   # 티켓/Epic 구조 검토
│   ├── slack-expert    # 커뮤니케이션 구조 검토
│   └── notion-expert   # Notion 기획 문서 읽기/결과물 정리
│
├── guides/             # 스킬 — "어떻게" 하는가
│   ├── typescript-patterns  # TS 코드 패턴/안티패턴
│   ├── react-patterns       # (틀)
│   ├── api-design           # (틀)
│   ├── security             # (틀)
│   ├── testing-strategy     # (틀)
│   ├── ci-cd                # (틀)
│   ├── infrastructure-as-code # (틀)
│   ├── git-workflow         # 커밋 컨벤션 완성, 브랜치/PR은 틀
│   ├── docker               # (틀)
│   ├── postgresql           # (틀)
│   ├── aws                  # (틀)
│   ├── monitoring           # (틀)
│   └── agents-template      # (틀) 회사별 AGENTS.md 템플릿
│
├── adapters/           # 회사 도구 연결
│   └── sensor-binding  # 프로젝트 센서 자동 감지 규칙
│
├── skills/             # 자기완결 SKILL.md — 외부 참조 없이 단독 실행
│   ├── task/SKILL.md       # /task — 전체 오케스트레이션 워크플로우
│   ├── commit/SKILL.md     # /commit — 컨벤션에 맞춰 커밋 생성
│   ├── e2e/SKILL.md        # /e2e — E2E 테스트 실행 + 결과 요약
│   ├── cross-review/SKILL.md # /cross-review — 에이전트 간 교차 리뷰
│   └── deep-interview/SKILL.md # /deep-interview — 소크라테스식 요구사항 명확화
│
├── commands/           # orchestrator 참조형 커맨드
│   ├── plan            # /plan — plan만 생성 (구현 안 함)
│   ├── review          # /review — unit scope 리뷰
│   └── review-branch   # /review-branch — full-branch 리뷰
│
├── scripts/            # hook 스크립트
│   ├── guard.py        # PreToolUse — 위험 명령어 차단
│   └── verify.py       # Stop — 코드 변경 시 자동 검증
│
├── sync.ts             # 배포 스크립트
└── package.json
```

## Guide vs Persona

|           | guides/                                             | personas/            |
| --------- | --------------------------------------------------- | -------------------- |
| 역할      | 스킬 (지식)                                         | 에이전트 (시각)      |
| 질문      | **어떻게** 하는가                                   | **누가** 보는가      |
| 로드 방식 | 컨텍스트에 읽어들임                                 | sub-agent로 spawn    |
| 바인딩    | persona의 `related_guides` + orchestrator 동적 판단 | orchestrator가 spawn |

## 워크플로우

### /plan — 계획만 생성

```
기존 plan 탐색 (.claude/docs/)
    ↓
요청 접수 → /deep-interview (모호하면) → planner → plan 제시
    ↓
.claude/docs/{slug}.md에 저장 (status: draft)
    ↓
사용자 승인 → status: approved로 업데이트 → 끝
```

plan만 뽑고 구현은 하지 않는다. plan이 마음에 들면 `/task`로 실행한다 — 저장된 plan을 자동 로드하여 planner spawn 없이 바로 실행한다.

### /task — 전체 오케스트레이션

```
요청 접수
    ↓
sensor-binding 확인
    ↓
저장된 plan 탐색 (.claude/docs/ → approved/draft 제안)
    ↓
요청 분류 (단순 / 복잡)
    ↓
[복잡 + 저장된 plan] plan 로드 → planner skip → implementer × N
                     → [unit reviewer] → full-branch reviewer → handoff
[복잡 + plan 없음]   /deep-interview → planner → plan 저장 → 사용자 승인
                     → implementer × N → [unit reviewer] → full-branch reviewer → handoff
[단순]               implementer → reviewer → 완료
```

### /review — 현재 변경 리뷰

```
sensor-binding 확인 → diff 생성 → computational 센서 → reviewer (unit scope)
```

### /review-branch — 브랜치 전체 리뷰

```
sensor-binding 확인 → base branch diff → computational 센서 (+ build) → reviewer (full-branch)
```

### /e2e — E2E 테스트 실행

```
sensor-binding 확인 → readiness 체크 → e2e 명령 실행 → 결과 요약
```

프로젝트에 E2E 명령이 감지된 경우에만 동작한다. `/task` 워크플로우에서는 full-branch reviewer 전에 자동 실행된다.

## 리뷰 루프

```
implementer 구현
    ↓
orchestrator가 computational 센서 실행 (lint, typecheck, test)
    ↓  실패 → implementer에게 반환
    ↓  통과
reviewer spawn (컨텍스트 격리)
    ↓
status: needs_fix → high findings를 implementer에게 전달 → 재구현 → 재리뷰
status: clean → 진행
    ↓
같은 finding이 3번 반복 → 사용자에게 escalation
```

## 센서 바인딩

프로젝트 진입 시 `package.json`, `pyproject.toml`, `go.mod` 등을 읽어 lint/typecheck/test/build 명령을 자동 감지한다. 감지 결과는 `.claude/sensor-cache.json`에 캐싱된다.

```json
{
  "sensors": {
    "lint": { "command": "pnpm lint" },
    "typecheck": { "command": "pnpm typecheck" },
    "test": { "command": "pnpm test" },
    "build": { "command": "pnpm build" },
    "e2e": { "command": "pnpm e2e" }
  },
  "base_branch": "dev"
}
```

## Plan 저장

`/plan`으로 생성한 계획은 프로젝트별 `.claude/docs/{slug}.md`에 저장된다. 세션이 끊겨도 다음 세션에서 이어서 작업할 수 있다.

```markdown
---
slug: auth-middleware-refactor
status: draft          # draft → approved (승인 시)
objective: "인증 미들웨어 리팩토링"
created_at: 2026-06-06
updated_at: 2026-06-06
---

plan:
  slug: "auth-middleware-refactor"
  status: ready
  ...
```

- **draft**: planner가 생성, 사용자 미승인 상태
- **approved**: 사용자 승인, `/task`에서 바로 실행 가능
- 같은 slug로 덮어쓰기 — git이 이력 추적
- `.claude/docs/`는 git 추적 대상 (`.gitignore`에 넣지 않음)

## 배포

```bash
# 설치
npm install

# 전체 배포
npm run sync

# 백업 후 배포 (기존 파일을 날짜 폴더로 백업)
npm run sync:backup
# → ~/.claude/backup/2026-06-06_1128/claude/{agents,skills,commands,adapters}/

# dry-run (변경 없이 확인만)
npm run sync:dry

# Claude Code만
npm run sync:claude

# Codex만
npm run sync:codex
```

배포 경로:

### Claude Code

| 소스 | 대상 | 포맷 |
|------|------|------|
| `personas/` | `~/.claude/agents/` | .md (복사) |
| `skills/` | `~/.claude/skills/<name>/` | SKILL.md (폴더 구조) |
| `guides/` | `~/.claude/skills/` | .md (복사) |
| `commands/` | `~/.claude/commands/` | .md (복사) |
| `adapters/` | `~/.claude/skills/adapters/` | .md (복사) |
| `scripts/` | `~/.claude/scripts/` | .py (복사) |

### Codex

| 소스 | 대상 | 포맷 |
|------|------|------|
| `personas/` | `~/.codex/agents/` | .toml (md → toml 변환) |

Codex는 personas만 배포한다. skills, guides, commands, adapters는 Codex에 해당 개념이 없다.

모델 매핑:

| md frontmatter | Codex model | model_reasoning_effort |
|---|---|---|
| `model: opus` | gpt-5.5 | xhigh |
| `model: sonnet` | gpt-5.5 | medium |
| model 없음 | gpt-5.5 | medium |

역할별로 effort를 오버라이드하려면 persona frontmatter에 `codex_effort` 필드를 추가한다:

```yaml
model: sonnet
codex_effort: low   # 기본 medium 대신 low 사용
```

`spawnable: false`인 persona(orchestrator)는 Codex에 배포하지 않는다.

## Hook 스크립트

`scripts/`의 hook 스크립트는 `~/.claude/scripts/`에 배포된다. 활성화하려면 `~/.claude/settings.json`에 수동으로 hook을 등록해야 한다:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|PowerShell",
        "hooks": [{ "type": "command", "command": "python3 ~/.claude/scripts/guard.py" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "python3 ~/.claude/scripts/verify.py" }]
      }
    ]
  }
}
```

| 스크립트 | hook | 역할 |
|---------|------|------|
| `guard.py` | PreToolUse | rm -rf, git push --force 등 위험 명령 차단 |
| `verify.py` | Stop | 코드 변경 있을 때 lint/test 자동 실행 (sensor-cache 사용, 없으면 자체 감지) |

`verify.py`는 `git status --porcelain`으로 변경 여부를 확인하고, 변경 없으면 skip한다. `SEOYOUNG_NO_VERIFY=1`로 일시 비활성화 가능.

settings.json은 sync가 자동 배포하지 않는다 — 기존 permissions/env/hook 설정을 보호하기 위해 수동 등록.

## Orphan 파일 관리

sync 시 소스에서 삭제/rename된 파일이 대상 디렉토리에 남아 있으면 "orphaned" 경고를 출력한다. **자동 삭제하지 않는다** — 수동으로 확인 후 삭제해야 한다.

```bash
# sync 출력에서 orphan 확인
npm run sync
# → "2 orphaned in dest (old-agent.md, renamed-guide.md) — not auto-deleted"

# 수동 삭제
rm ~/.claude/agents/old-agent.md
```

## 틀(skeleton) guides 채우기

`(틀)` 표시된 guides는 섹션 구조만 잡혀 있다. 실제 프로젝트에서 작업하면서 내용을 채운다:

1. guide 파일을 열고 TODO 섹션에 내용 작성
2. 내용이 채워지면 관련 persona의 `related_guides`에 추가
3. `npm run sync`로 배포

## 프로젝트별 guide 오버라이드

global guides는 범용 원칙만 담고 있다. 프로젝트에 맞는 내용이 필요하면 프로젝트 `.claude/skills/`에 같은 이름의 guide를 넣으면 자동으로 오버라이드된다.

```
~/.claude/skills/react-patterns.md               ← global (범용 원칙)
프로젝트/.claude/skills/react-patterns.md        ← 프로젝트 레벨 (자동 오버라이드)
```

별도 command 없이 자연어로 요청하면 된다:

```
"react-patterns guide를 이 프로젝트에 맞게 커스터마이즈해줘"
```

Claude가 global guide를 읽고 → 프로젝트 코드베이스를 분석하고 → `.claude/skills/react-patterns.md`를 생성한다.

## 새 프로젝트에서 AGENTS.md 세팅

### 프로젝트에 CLAUDE.md/AGENTS.md가 이미 있을 때

seoyoung-agents는 global 레이어(`~/.claude/`)에 배포되므로, 프로젝트의 CLAUDE.md와 자동으로 공존한다. 프로젝트 규칙이 global 규칙보다 우선한다.

`guides/agents-template.md`의 충돌 체크리스트로 확인할 것:
- 커밋 컨벤션이 다른가?
- 테스트 전략이 다른가?
- 자체 /review command가 있는가?

### 프로젝트에 CLAUDE.md/AGENTS.md가 없을 때

`guides/agents-template.md`의 템플릿을 기반으로 프로젝트 루트에 AGENTS.md를 생성한다.

### Cross-agent 호환성

| 파일 | 역할 | 적용 대상 |
|------|------|----------|
| `AGENTS.md` | canonical 규칙 (프로젝트 레벨) | Claude Code가 읽음 |
| `CLAUDE.md` | Claude Code 전용 companion | AGENTS.md 참조 + sync 명령/커맨드 목록 |

Codex는 AGENTS.md를 직접 읽지 않는다. Codex 에이전트가 따를 규칙은 persona `.md` 파일의 본문에 내장되어 있고, sync.ts가 `developer_instructions`로 변환하여 `.toml`에 포함시킨다.

## 참고

- [Harness engineering for coding agent users — Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)
- [The Anatomy of an Agent Harness — LangChain](https://blog.langchain.com/the-anatomy-of-an-agent-harness/)
- [Effective harnesses for long-running agents — Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [devbrother2024/skills](https://github.com/devbrother2024/skills) — deep-interview 패턴
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) — Karpathy 4원칙 (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)
