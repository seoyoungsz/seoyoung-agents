---
name: typescript-patterns
description: TypeScript 프로젝트에서 따라야 할 패턴과 안티패턴. reviewer, implementer가 참조한다.
metadata:
  type: guide
---

# TypeScript Patterns

reviewer와 implementer가 코드를 작성하거나 리뷰할 때 참조하는 TypeScript 패턴 가이드.

## 불변성 (Immutability)

항상 새 객체를 생성한다. 기존 객체를 변이(mutate)하지 않는다.

```typescript
// BAD
function updateUser(user: User, name: string) {
  user.name = name
  return user
}

// GOOD
function updateUser(user: User, name: string): User {
  return { ...user, name }
}
```

배열도 동일하다:

```typescript
// BAD
items.push(newItem)

// GOOD
const updated = [...items, newItem]
```

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

## 에러 처리

모든 비동기 호출에 에러 처리를 한다.

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : String(error)}`)
}
```

## 함수 설계

- 함수는 50줄을 넘지 않는다
- 하나의 함수는 하나의 일만 한다
- 중첩은 4단계를 넘지 않는다 — early return으로 해소한다

```typescript
// BAD
function process(items: Item[]) {
  if (items.length > 0) {
    for (const item of items) {
      if (item.active) {
        if (item.type === "special") {
          // 4단계 중첩
        }
      }
    }
  }
}

// GOOD
function process(items: Item[]) {
  if (items.length === 0) return

  const activeSpecial = items.filter((item) => item.active && item.type === "special")
  for (const item of activeSpecial) {
    processSpecialItem(item)
  }
}
```

## 파일 구조

- 파일은 800줄을 넘지 않는다
- 200~400줄이 적정 크기
- 큰 파일은 기능/도메인 단위로 분리한다

## 입력 검증

시스템 경계(사용자 입력, 외부 API)에서만 검증한다. 내부 코드 간에는 타입 시스템을 신뢰한다.

```typescript
import { z } from "zod"

const UserInput = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
})

const validated = UserInput.parse(rawInput)
```

## 네이밍

- 변수/함수: camelCase
- 타입/인터페이스: PascalCase
- 상수: UPPER_SNAKE_CASE
- boolean: is/has/can/should 접두사 (`isActive`, `hasPermission`)
- 함수: 동사로 시작 (`getUserById`, `calculateTotal`)
- 매직 넘버 금지 — 의미 있는 상수로 추출

## 안티패턴

| 안티패턴 | 대안 |
|---------|------|
| `console.log` 디버깅 | 프로덕션 코드에서 제거 |
| 하드코딩된 값 | 환경 변수 또는 상수 |
| 과도한 주석 | 이름을 잘 짓는다 |
| `any` 타입 | 구체적인 타입 또는 `unknown` |
| 중첩 삼항 연산자 | if/else 또는 함수 추출 |
| 변이 패턴 | spread, map, filter |
