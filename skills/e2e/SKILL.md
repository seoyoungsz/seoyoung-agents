---
name: e2e
description: 프로젝트의 E2E 테스트를 감지·검증·실행하고 결과를 요약한다. 수정은 하지 않는다.
---

# E2E — End-to-End 테스트 실행

프로젝트의 E2E 테스트를 실행하고 결과를 분석한다. 수정은 하지 않는다 — 결과만 보고한다.

## E2E 센서 감지 규칙

`package.json`의 `scripts` 필드에서 아래 순서로 탐색한다:

| 탐색 순서 | 스크립트 키 |
|-----------|------------|
| 1 | `e2e` |
| 2 | `test:e2e` |
| 3 | `playwright` |
| 4 | `cypress` |

감지에 실패하면 skip한다. 감지 결과는 `.claude/sensor-cache.json`의 `sensors.e2e` 키에 기록한다.

```json
{
  "sensors": {
    "e2e": { "command": "pnpm e2e" }
  }
}
```

`e2e` 센서가 없으면 해당 키를 생략한다.

패키지 매니저는 lockfile로 판단한다:

- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm
- `bun.lockb` → bun

## E2E Readiness 확인

e2e 명령이 감지되더라도 실행 가능 여부는 보장되지 않는다. 실행 전 아래 세 조건을 순서대로 확인한다.

### 1. Non-interactive 모드 확인

| 프레임워크 | 감지 방법 | CI 모드 플래그 |
|-----------|----------|--------------|
| Playwright | `playwright.config.*` 존재 | `CI=true` 환경 변수 |
| Cypress | `cypress.config.*` 존재 | `--headless` 플래그 |
| 기타 | package.json scripts에서 추론 | 사용자에게 1회 질문 |

### 2. Dev server 확인

- `playwright.config.*`에 `webServer` 설정이 있으면 → 자체 관리, skip
- 없으면 → 감지된 dev 명령의 포트가 열려 있는지 확인
- 포트 미확인 시 사용자에게 보고

### 3. 브라우저 바이너리 확인

| 프레임워크 | 확인 명령 |
|-----------|----------|
| Playwright | `npx playwright install --check` |
| Cypress | `npx cypress verify` |

확인 실패 시 e2e를 skip하고 어떤 조건이 미충족인지 구체적으로 보고한다.

## 실행 흐름

1. `.claude/sensor-cache.json`에서 `e2e` 센서를 읽는다
2. 센서가 없으면 → "이 프로젝트에 E2E 명령이 감지되지 않았습니다" 보고 후 종료
3. Readiness 확인 (non-interactive 모드 → dev server → 브라우저 바이너리 순서)
4. Readiness 실패 시 → 어떤 조건이 미충족인지 보고 후 종료
5. e2e 명령 실행
6. 결과 요약:
   - 통과/실패 테스트 수
   - 실패한 테스트의 에러 메시지
   - 실패 원인 추정 (해당 파일/컴포넌트 지목)
7. 수정은 하지 않는다 — 결과만 보고

## CE 플러그인과의 관계

| 커맨드 | 역할 |
|--------|------|
| `/e2e` | 프로젝트가 소유한 E2E 스크립트 실행 (sensor 기반) |
| `/ce-test-browser` | CE 플러그인의 브라우저 탐색적 테스트 (에이전트 주도) |

둘은 다른 목적이다. `/e2e`는 기존 테스트 실행, `/ce-test-browser`는 새로운 테스트 생성/실행.
