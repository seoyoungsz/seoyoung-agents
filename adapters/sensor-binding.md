---
name: sensor-binding
description: 프로젝트의 computational 센서(lint, typecheck, test, build)를 자동 감지하고 바인딩하는 규칙
metadata:
  type: adapter
---

# Sensor Binding

프로젝트 진입 시 1회 감지하여, 이후 모든 검증 단계에서 재사용한다.

## 감지 규칙

### Node.js (package.json)

`package.json`의 `scripts` 필드에서 추론한다.

| 센서      | 탐색 순서                                    | fallback                                 |
| --------- | -------------------------------------------- | ---------------------------------------- |
| lint      | `lint` → `eslint` → `oxlint` → `biome check` | 없으면 skip                              |
| typecheck | `typecheck` → `tsc --noEmit` → `tsc -b`      | tsconfig.json 존재 시 `npx tsc --noEmit` |
| test      | `test` → `vitest` → `jest`                   | 없으면 skip                              |
| build     | `build` → `next build` → `vite build`        | 없으면 skip                              |
| check     | `check` (lint+typecheck 통합)                | 없으면 lint + typecheck 개별 실행        |

패키지 매니저는 lockfile로 판단한다:

- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm
- `bun.lockb` → bun

### Python (pyproject.toml / setup.py)

| 센서      | 탐색 순서                               | fallback    |
| --------- | --------------------------------------- | ----------- |
| lint      | `ruff check` → `flake8` → `pylint`      | 없으면 skip |
| typecheck | `mypy` → `pyright`                      | 없으면 skip |
| test      | `pytest` → `python -m unittest`         | 없으면 skip |
| format    | `ruff format --check` → `black --check` | 없으면 skip |

### Go (go.mod)

| 센서  | 명령                |
| ----- | ------------------- |
| lint  | `golangci-lint run` |
| test  | `go test ./...`     |
| build | `go build ./...`    |

### Makefile / Justfile

위 규칙으로 감지 실패 시, `Makefile` 또는 `Justfile`에서 `lint`, `test`, `check`, `build` 타겟을 탐색한다.

### Docker (docker-compose.yml / Dockerfile)

| 센서  | 명령                   |
| ----- | ---------------------- |
| build | `docker compose build` |
| up    | `docker compose up -d` |

## Base Branch 감지

reviewer의 `full-branch` 리뷰 시 diff 기준점이 되는 base branch를 감지한다.

탐색 순서:
1. `.claude/sensor-cache.json`에 명시된 `base_branch` 값
2. `git remote show origin`의 HEAD branch
3. 존재하는 branch 중: `dev` → `develop` → `main` → `master`

감지된 base branch는 sensor-cache.json에 기록한다.

### Diff 명령 매핑

| scope | 대상 | 명령 |
|-------|------|------|
| `unit` | uncommitted 변경 | `git diff` + `git diff --staged` |
| `full-branch` | base branch 이후 전체 커밋 | `git diff {base_branch}...HEAD` |

## 감지 실패 시

자동 감지에 실패한 센서는 사용자에게 1회 질문한다:

```
"이 프로젝트의 lint 명령을 찾지 못했습니다.
 사용하는 명령이 있으면 알려주세요. (없으면 Enter)"
```

응답을 프로젝트 루트의 `.claude/sensor-cache.json`에 기록하여 이후 재질문하지 않는다.

## 바인딩 결과 포맷

감지 완료 후 아래 형태로 메모리에 보관한다:

개별 센서가 감지된 경우:

```json
{
  "project": "/path/to/project",
  "package_manager": "pnpm",
  "sensors": {
    "lint": { "command": "pnpm lint" },
    "typecheck": { "command": "pnpm typecheck" },
    "test": { "command": "pnpm test" },
    "build": { "command": "pnpm build" }
  },
  "base_branch": "dev",
  "detected_at": "2026-06-05"
}
```

`check` 스크립트(lint+typecheck 통합)가 감지된 경우:

```json
{
  "project": "/path/to/project",
  "package_manager": "pnpm",
  "sensors": {
    "check": { "command": "pnpm check" },
    "test": { "command": "pnpm test" },
    "build": { "command": "pnpm build" }
  },
  "base_branch": "dev",
  "detected_at": "2026-06-05"
}
```

`check` 키가 존재하면 `lint`와 `typecheck` 키는 생략한다. 오케스트레이터가 실행 후 reviewer에게 전달할 때 `lint: pass, typecheck: pass`로 분리한다.

## 실행 시점

어떤 센서를 언제 실행할지는 오케스트레이터가 scope에 따라 결정한다. `personas/orchestrator.md`의 "Computational 센서 실행" 섹션이 단일 출처다.

이 문서는 센서를 **감지하고 바인딩**하는 역할만 담당한다. 실행 정책은 오케스트레이터에 있다.
