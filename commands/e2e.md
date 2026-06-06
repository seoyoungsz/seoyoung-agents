---
description: sensor-binding에서 감지된 E2E 명령을 실행하고 결과를 요약한다.
---

# E2E — End-to-End 테스트 실행

프로젝트의 E2E 테스트를 실행하고 결과를 분석한다.

## 실행 흐름

1. sensor-binding 확인 (`.claude/sensor-cache.json`에서 `e2e` 센서 읽기)
2. e2e 센서가 없으면 → "이 프로젝트에 E2E 명령이 감지되지 않았습니다" 보고 후 종료
3. readiness 확인:
   - 명령이 non-interactive인가
   - dev server가 필요하면 실행 중인가
   - 브라우저 바이너리가 설치되어 있는가
4. readiness 실패 시 → 어떤 조건이 미충족인지 보고 후 종료
5. e2e 명령 실행
6. 결과 요약:
   - 통과/실패 테스트 수
   - 실패한 테스트의 에러 메시지
   - 실패 원인 추정 (해당 파일/컴포넌트 지목)
7. 수정은 하지 않는다 — 결과만 보고

## CE 플러그인과의 관계

- `/e2e`: 프로젝트가 소유한 E2E 스크립트 실행 (sensor-binding 기반)
- `/ce-test-browser`: CE 플러그인의 브라우저 탐색적 테스트 (에이전트 주도)

둘은 다른 목적이다. `/e2e`는 기존 테스트 실행, `/ce-test-browser`는 새로운 테스트 생성/실행.

## 참조

- `adapters/sensor-binding.md` — e2e 센서 감지 규칙, readiness 조건
- `personas/orchestrator.md` — 워크플로우 내 E2E 실행 시점
