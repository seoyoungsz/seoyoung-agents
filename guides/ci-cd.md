---
name: ci-cd
description: CI/CD 파이프라인 설계. GitHub Actions, 스테이지 분리, 배포 전략, 롤백.
metadata:
  type: guide
---

# CI/CD

<!-- TODO: CI/CD 파이프라인 구축 시 실제 패턴으로 채운다 -->

## GitHub Actions

<!-- TODO: 워크플로우 구조, job 분리, 캐싱 전략, 시크릿 관리 -->

## 파이프라인 스테이지

<!-- TODO: lint → typecheck → test → build → deploy 순서, 게이트 조건 -->

## 환경 분리

<!-- TODO: dev / staging / production, 환경별 설정, feature branch 배포 -->

## 배포 전략

<!-- TODO: blue-green, canary, rolling update 선택 기준 -->

## 롤백

<!-- TODO: 자동 롤백 조건, 수동 롤백 절차, DB 마이그레이션 롤백 -->

## 아티팩트 관리

<!-- TODO: Docker 이미지 태깅, ECR/GHCR, 빌드 캐시 -->

## 알림

<!-- TODO: 빌드 실패 알림 (Slack), 배포 완료 알림 -->
