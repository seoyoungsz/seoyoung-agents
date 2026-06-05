---
name: testing-strategy
description: 테스트 전략 가이드. 테스트 피라미드, 단위/통합/E2E 선택 기준, mock 전략, 커버리지 정책.
metadata:
  type: guide
---

# Testing Strategy

<!-- TODO: 테스트 작업 시 실제 전략으로 채운다 -->

## 테스트 피라미드

<!-- TODO: 단위 > 통합 > E2E 비율, 각 레이어의 목적 -->

## 단위 테스트

<!-- TODO: 순수 함수 테스트, 의존성 격리, 빠른 피드백 -->

## 통합 테스트

<!-- TODO: API 엔드포인트, DB 연동, 서비스 간 상호작용 -->

## E2E 테스트

<!-- TODO: Playwright, 핵심 사용자 플로우, flaky 테스트 관리 -->

## Mock 전략

<!-- TODO: 언제 mock하는가, 외부 API mock, DB mock vs 실제 DB -->

## 테스트 데이터

<!-- TODO: fixture 관리, factory 패턴, seed 데이터 -->

## 커버리지 정책

<!-- TODO: 목표 커버리지, 커버리지가 높다 ≠ 좋은 테스트 -->

## CI에서의 테스트

<!-- TODO: 병렬 실행, 느린 테스트 격리, 실패 시 재시도 정책 -->
