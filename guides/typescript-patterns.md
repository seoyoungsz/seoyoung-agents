---
name: typescript-patterns
description: TypeScript 프로젝트에서 따라야 할 패턴과 안티패턴. reviewer, implementer가 참조한다.
metadata:
  type: guide
---

# TypeScript Patterns

불변성, 에러 처리, 입력 검증, 파일 크기 제한은 global rules(`~/.claude/rules/coding-style.md`)에 정의되어 있다. 이 guide는 TypeScript 전용 패턴만 다룬다.

## 타입 안전성

### as any 금지

`as any`와 `as unknown as T`를 사용하지 않는다. 타입 가드나 제네릭으로 해결한다.

```typescript
// BAD
const value = response.data as any

// GOOD
function isUser(data: unknown): data is User {
  return typeof data === "object" && data !== null && "id" in data
}
```

### Non-null assertion 금지

`!` 연산자를 사용하지 않는다. optional chaining이나 타입 가드를 사용한다.

```typescript
// BAD
const name = user!.name

// GOOD
const name = user?.name
```

## 함수 설계

- 중첩은 4단계를 넘지 않는다 — early return으로 해소

```typescript
// BAD — 4단계 중첩
function process(items: Item[]) {
  if (items.length > 0) {
    for (const item of items) {
      if (item.active) {
        if (item.type === "special") { /* ... */ }
      }
    }
  }
}

// GOOD — early return + filter
function process(items: Item[]) {
  if (items.length === 0) return
  const targets = items.filter((item) => item.active && item.type === "special")
  for (const item of targets) {
    processSpecialItem(item)
  }
}
```

## 네이밍

- 변수/함수: camelCase
- 타입/인터페이스: PascalCase
- 상수: UPPER_SNAKE_CASE
- boolean: is/has/can/should 접두사
- 함수: 동사로 시작 (`getUserById`, `calculateTotal`)
- 매직 넘버 금지 — 의미 있는 상수로 추출

## 안티패턴

| 안티패턴 | 대안 |
|---------|------|
| `any` 타입 | 구체적인 타입 또는 `unknown` |
| 중첩 삼항 연산자 | if/else 또는 함수 추출 |
| `console.log` 디버깅 | 프로덕션 코드에서 제거 |
| 하드코딩된 값 | 환경 변수 또는 상수 |
