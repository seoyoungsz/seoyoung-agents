---
name: infrastructure-as-code
description: IaC 패턴. Terraform 모듈화, 상태 관리, 환경 분리, 변경 검토.
metadata:
  type: guide
---

# Infrastructure as Code

<!-- TODO: IaC 작업 시 실제 패턴으로 채운다 -->

## Terraform 기본 구조

<!-- TODO: 디렉토리 구조, 모듈 분리, provider 설정 -->

## 상태 관리

<!-- TODO: remote state (S3 + DynamoDB), state locking, state 분리 전략 -->

## 모듈화

<!-- TODO: 재사용 가능한 모듈 설계, 입출력 변수, 버전 관리 -->

## 환경 분리

<!-- TODO: workspace vs 디렉토리 분리, tfvars per environment -->

## 변경 검토

<!-- TODO: plan → review → apply 플로우, PR에서 plan 결과 표시 -->

## 보안

<!-- TODO: 시크릿 주입 (SSM Parameter Store), IAM 최소 권한, 감사 로그 -->

## 드리프트 감지

<!-- TODO: 수동 변경 감지, 정기적 plan 실행, 알림 -->
