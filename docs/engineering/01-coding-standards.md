# CreatorOS Engineering Standards & Code Quality Guidelines

- **Document Version:** 1.0.0
- **Status:** Active / Normative
- **Target Audience:** All Software Engineers, Platform Engineers, and Code Reviewers contributing to the CreatorOS monorepo.
- **Enforcement:** Automated via CI/CD pipelines, Git pre-commit hooks, and mandatory peer review gates.

---

## 1. Architectural Philosophy & Core Tenets

CreatorOS is a mission-critical platform serving creators, agencies, and enterprise partners. The codebase prioritizes maintainability, runtime safety, and long-term evolvability over rapid prototyping shortcuts. The following core principles govern all contributions:

```
                  ┌──────────────────────────────────────────┐
                  │          External World (Untrusted)       │
                  │   HTTP APIs, Webhooks, Storage, Queues   │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │    Strict Validation Boundary (Zod)      │
                  │ Parses untrusted input into branded types │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │         Domain Core (Trusted)            │
                  │   Pure, Immutable, Result-Driven Logic   │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │          Deterministic Output            │
                  │ Strongly Typed RPC, Events, DB Mutations │
                  └──────────────────────────────────────────┘
```

1. **Parse, Don't Validate:** Data entering the runtime space must be parsed into strongly typed domain models at the boundary. Downstream consumers must never re-validate the integrity of upstream invariants.
2. **Explicit Over Implicit:** Magical runtime behaviors, dynamic monkey-patching, and implicit type coercions are prohibited. Code must be deterministic and statically verifiable.
3. **Total Type Safety:** The use of `any` is treated as a compiler failure. Compiler settings operate in zero-tolerance modes.
4. **Resilience via Algebraic Data Types:** Operations that can fail must explicitly encode failure paths in their return signatures using `Result<T, E>` monads, reserving runtime exceptions exclusively for unrecoverable infrastructure crashes.
5. **Structural Immutability:** Mutable in-place modifications to shared state are disallowed. All transformations yield new, referentially stable data representations.

---

## 2. TypeScript Strict Mode & Compiler Configuration

All packages within the CreatorOS monorepo must inherit from the shared root base configuration. No package may loosen compiler flags.

### 2.1 The Canonical `tsconfig.base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "moduleDetection": "force",
    "resolveJsonModule": true,
    
    /* Strict Type-Checking Options */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* Additional Exhaustive Checks */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,

    /* Emit and Interop Settings */
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 2.2 Critical Flag Invariants

| Compiler Flag | Invariant Enforcement | Rationale |
| :--- | :--- | :--- |
| `noUncheckedIndexedAccess` | Arrays/objects with index signatures yield `T \| undefined`. | Eliminates `TypeError: Cannot read properties of undefined` during runtime array lookups. |
| `exactOptionalPropertyTypes` | Differentiates between `{ prop?: string }` and `{ prop: string \| undefined }`. | Prevents setting keys to `undefined` when the property should be omitted entirely. |
| `verbatimModuleSyntax` | Disallows non-type imports of type-only definitions (`import type`). | Prevents bundle bloat, ensures clean tree-shaking, and avoids cyclic runtime dependency resolution issues. |
| `noImplicitOverride` | Enforces the `override` keyword on derived class methods. | Guards against silent bugs when refactoring superclass interfaces. |

### 2.3 Prohibited Types and Patterns

```typescript
// ==========================================
// ANTI-PATTERN: The use of 'any' is strictly banned.
// ==========================================
// BAD:
export function parsePayload(data: any): any {
  return JSON.parse(data);
}

// GOOD:
export function parsePayload(data: string): unknown {
  return JSON.parse(data) as unknown;
}

// ==========================================
// ANTI-PATTERN: Non-null assertion operators (!)
// ==========================================
// BAD:
const userId = session.user!.id;

// GOOD:
if (!session.user) {
  throw new UnauthorizedError("Session missing user context.");
}
const userId = session.user.id;

// ==========================================
// ANTI-PATTERN: The 'Function' and 'Object' wrapper types
// ==========================================
// BAD:
const handler: Function = () => {};
const state: Object = {};

// GOOD:
const handler: () => void = () => {};
const state: Record<string, unknown> = {};
```

---

## 3. Boundary Validation with Zod

Every byte of data passing across a process or context boundary—HTTP requests, Webhook events, message broker queues, environment configurations, and file reads—must pass through synchronous or asynchronous Zod parsing.

### 3.1 The Schema Validation Architecture

```
                       ┌────────────────────────────┐
                       │ Inbound Raw Untrusted Data │
                       └──────────────┬─────────────┘
                                      │
                                      ▼
                       ┌────────────────────────────┐
                       │    Zod SafeParse Schema    │
                       └──────────────┬─────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [ Parse Success ]         [ Parse Failure ]
                         │                         │
                         ▼                         ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │ Branded Domain Type │   │ Domain Input Error  │
              │  (Deeply Readonly)  │   │  (RFC 7807 Payload) │
              └─────────────────────┘   └─────────────────────┘
```

### 3.2 Environment Variable Parse Gateway

Environment configurations must fail fast during boot. Never access `process.env` directly in application logic.

```typescript
// packages/config/src/env.ts
import { z } from "zod";

const NodeEnvSchema = z.enum(["development", "test", "staging", "production"]);

export const EnvironmentSchema = z.object({
  NODE_ENV: NodeEnvSchema.default("development"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  REDIS_URL: z.string().url().startsWith("rediss://"),
  CREATOROS_API_SECRET: z.string().min(32),
  ENABLE_ANALYTICS_INGEST: z
    .enum(["true", "false"])
    .transform((val) => val === "true"),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

function initializeEnvironment(): Environment {
  const result = EnvironmentSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.flatten().fieldErrors;
    console.error("FATAL: Invalid environment configuration:", formattedErrors);
    process.exit(1);
  }

  return Object.freeze(result.data);
}

export const env = initializeEnvironment();
```

### 3.3 HTTP Request Ingress with Branded Types

Use branded types to avoid primitive obsession, preventing swapped IDs and logically invalid states.

```typescript
// packages/core/src/domain/types.ts
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type CreatorId = Brand<string, "CreatorId">;
export type CurrencyAmountMinorUnits = Brand<bigint, "CurrencyAmountMinorUnits">;

// apps/api/src/endpoints/payouts/create-payout.schema.ts
import { z } from "zod";
import type { CreatorId, CurrencyAmountMinorUnits } from "@creatoros/core";

export const CreatePayoutSchema = z.object({
  creatorId: z
    .string()
    .uuid()
    .transform((val) => val as CreatorId),
  amountCents: z
    .number()
    .int()
    .positive()
    .max(10_000_000_00) // $10,000,000.00 ceiling
    .transform((val) => BigInt(val) as CurrencyAmountMinorUnits),
  currency: z.enum(["USD", "EUR", "GBP"]),
  idempotencyKey: z.string().min(16).max(64),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;
```

### 3.4 Ingress Validation Route Pattern

```typescript
// apps/api/src/endpoints/payouts/handler.ts
import type { Request, Response } from "express";
import { CreatePayoutSchema } from "./create-payout.schema.js";
import { executePayout } from "./service.js";

export async function createPayoutHandler(
  req: Request,
  res: Response
): Promise<void> {
  const parseResult = CreatePayoutSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      type: "https://errors.creatoros.com/validation-error",
      title: "Unprocessable Entity Parameters",
      status: 400,
      detail: "The payload failed structural or constraint assertions.",
      invalidParams: parseResult.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    });
    return;
  }

  const result = await executePayout(parseResult.data);
  if (result.isErr()) {
    res.status(result.error.statusCode).json(result.error.toProblemDetails());
    return;
  }

  res.status(202).json({ data: result.value });
}
```

---

## 4. Immutable Data Flow & State Mutation Rules

Uncontrolled object mutation across shared references is the primary cause of indeterminate state in distributed systems. All domain models and internal pipelines must preserve deep immutability.

### 4.1 Immutability Enforcement Mechanics

1. **Parameter Immutability:** All function parameters accepting arrays or complex objects must annotate them with `readonly` or use deep-readonly wrappers.
2. **Object Spread Semantics:** Use structural cloning, object spreading, or functional libraries to update state.
3. **No Dynamic Deletes:** Use rest destructuring to discard fields; never invoke `delete obj[key]`.

```typescript
// ==========================================
// STRUCTURAL UPDATES: The Approved Pattern
// ==========================================

export interface CreatorProfile {
  readonly id: string;
  readonly username: string;
  readonly tags: readonly string[];
  readonly metrics: {
    readonly subscriberCount: number;
    readonly totalViews: bigint;
  };
}

// Updating state correctly:
export function incrementSubscriberCount(
  profile: CreatorProfile
): CreatorProfile {
  return {
    ...profile,
    metrics: {
      ...profile.metrics,
      subscriberCount: profile.metrics.subscriberCount + 1,
    },
  };
}

// Adding elements to collections:
export function appendTag(
  profile: CreatorProfile,
  newTag: string
): CreatorProfile {
  if (profile.tags.includes(newTag)) {
    return profile;
  }
  return {
    ...profile,
    tags: [...profile.tags, newTag],
  };
}

// Discarding keys safely (Do not use `delete`):
export function sanitizeMetrics(
  profile: CreatorProfile
): Omit<CreatorProfile, "metrics"> {
  const { metrics: _, ...rest } = profile;
  return rest;
}
```

### 4.2 Utility: `DeepReadonly<T>`

Use the shared deep immutability utility for internal application contexts:

```typescript
// packages/core/src/types/immutability.ts
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export function deepFreeze<T extends object>(obj: T): DeepReadonly<T> {
  const propNames = Reflect.ownKeys(obj);
  for (const name of propNames) {
    const value = Reflect.get(obj, name);
    if ((typeof value === "object" && value !== null) || typeof value === "function") {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj) as DeepReadonly<T>;
}
```

---

## 5. Unified Error Handling Architecture

Exceptions (`throw`) must be reserved for non-deterministic runtime faults (e.g., lost socket connections, disk failures, out of memory). Domain errors (e.g., validation failed, unauthorized operation, conflict detected) are modeled as expected return paths using the `Result<T, E>` pattern.

### 5.1 The `Result<T, E>` Implementation

```typescript
// packages/core/src/monads/result.ts

export type Ok<T> = {
  readonly _tag: "Ok";
  readonly value: T;
  isOk(): this is Ok<T>;
  isErr(): false;
  map<U>(fn: (val: T) => U): Result<U, never>;
  flatMap<U, E2>(fn: (val: T) => Result<U, E2>): Result<U, E2>;
  unwrap(): T;
};

export type Err<E> = {
  readonly _tag: "Err";
  readonly error: E;
  isOk(): false;
  isErr(): this is Err<E>;
  map<U>(fn: (val: never) => U): Result<never, E>;
  flatMap<U, E2>(fn: (val: never) => Result<U, E2>): Result<never, E>;
  unwrap(): never;
};

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return {
    _tag: "Ok",
    value,
    isOk: () => true,
    isErr: () => false,
    map: (fn) => ok(fn(value)),
    flatMap: (fn) => fn(value),
    unwrap: () => value,
  };
}

export function err<E>(error: E): Err<E> {
  return {
    _tag: "Err",
    error,
    isOk: () => false,
    isErr: () => true,
    map: () => err(error),
    flatMap: () => err(error),
    unwrap: () => {
      throw new Error(`Attempted to unwrap an Err: ${JSON.stringify(error)}`);
    },
  };
}
```

### 5.2 Structured Domain Error Hierarchy

All errors returned by domain services must inherit from a standardized base:

```typescript
// packages/core/src/errors/domain-error.ts

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string;
  readonly extensions?: Record<string, unknown>;
}

export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;

  public constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toProblemDetails(): ProblemDetails {
    return {
      type: `https://errors.creatoros.com/${this.code.toLowerCase()}`,
      title: this.name,
      status: this.statusCode,
      detail: this.message,
    };
  }
}

export class InsufficientFundsError extends DomainError {
  public override readonly code = "INSUFFICIENT_FUNDS";
  public override readonly statusCode = 422;

  public constructor(
    public readonly accountId: string,
    public readonly requestedMinor: bigint,
    public readonly availableMinor: bigint
  ) {
    super(
      `Account ${accountId} requires ${requestedMinor.toString()} but only has ${availableMinor.toString()}.`
    );
  }

  public override toProblemDetails(): ProblemDetails {
    return {
      ...super.toProblemDetails(),
      extensions: {
        accountId: this.accountId,
        requested: this.requestedMinor.toString(),
        available: this.availableMinor.toString(),
      },
    };
  }
}
```

### 5.3 Flow Control with Exhaustive Pattern Matching

```typescript
// apps/api/src/endpoints/payouts/service.ts
import { ok, err, type Result } from "@creatoros/core";
import { InsufficientFundsError, type DomainError } from "@creatoros/core";
import type { CreatePayoutInput } from "./create-payout.schema.js";

export async function executePayout(
  input: CreatePayoutInput
): Promise<Result<{ transactionId: string }, DomainError>> {
  const accountBalance = await getBalance(input.creatorId);

  if (accountBalance < input.amountCents) {
    return err(
      new InsufficientFundsError(
        input.creatorId,
        input.amountCents,
        accountBalance
      )
    );
  }

  const txId = await dispatchTransfer(input);
  return ok({ transactionId: txId });
}

async function getBalance(_id: string): Promise<bigint> {
  return 5000n; // Stub implementation
}

async function dispatchTransfer(_input: CreatePayoutInput): Promise<string> {
  return "tx_998124871249";
}
```

---

## 6. Monorepo Naming & Casing Conventions

Conventions must remain uniform across the entire dependency graph to guarantee high cognitive ergonomics.

```
       Monorepo Layer                     Naming Convention
┌──────────────────────────┐    ───────────────────────────────────────
│ Packages / Workspaces    │ ──► @creatoros/kebab-case
│ Directories              │ ──► kebab-case (e.g., domain-logic/)
│ Files (Modules/Logic)    │ ──► kebab-case.ts
│ Files (React Components) │ ──► PascalCase.tsx
│ Enums / Classes          │ ──► PascalCase
│ Interfaces / Types       │ ──► PascalCase (NO 'I' prefix)
│ Functions / Variables    │ ──► camelCase
│ Global Constants         │ ──► UPPER_SNAKE_CASE
│ Database Tables / Columns│ ──► snake_case
│ API Query / Body Payloads│ ──► camelCase
└──────────────────────────┘    ───────────────────────────────────────
```

### 6.1 Package and File Naming Rules

1. **Package Scope:** Every internal monorepo package must be prefixed with the `@creatoros/` scope (e.g., `@creatoros/ui`, `@creatoros/analytics-engine`).
2. **File Extensions:**
   * TypeScript modules: `.ts`
   * JSX/React files: `.tsx`
   * Declaration maps: `.d.ts`
   * JSON configs: `.json`
   * Explicit Node ESM outputs: `.mts` or `.js` with `"type": "module"` configuration.
3. **No Index Spam:** Avoid creating deep index files that re-export everything (`index.ts`). Expose concrete public interfaces via the package `exports` map in `package.json`.

### 6.2 Token Casing Matrix

| Token Target | Standard | Allowed Exception | Example |
| :--- | :--- | :--- | :--- |
| Interface / Type Alias | `PascalCase` | None. Do not use Hungarian prefixes (`IUser`). | `UserProfileMetadata` |
| Generics | `T` or `PascalCase` | Prefix with descriptive `T` if complex. | `TContext`, `TPayload` |
| Functions & Methods | `camelCase` | None. | `calculateNetMargin()` |
| Variables & Properties | `camelCase` | None. | `creatorChannelId` |
| Constant Invariants | `UPPER_SNAKE_CASE` | Primitives & Frozen Literals only. | `MAX_RETRIES_LIMIT` |
| Database Tables | `snake_case` | Must be pluralized. | `creator_profiles` |
| Database Columns | `snake_case` | Foreign keys must end in `_id`. | `billing_cycle_id` |
| REST API Endpoints | `kebab-case` | Pluralized resources. | `/api/v1/payout-runs` |

---

## 7. Tooling & Linting: Biome & ESLint Configuration

The primary linter and code formatter for CreatorOS is **Biome**. Where specialized AST transforms require legacy ESLint support, the two configurations are layered deterministically.

### 7.1 Authoritative `biome.json`

Place this at the root of the CreatorOS repository.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/routeTree.gen.ts"
    ]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 80,
    "attributePosition": "auto"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noBannedTypes": "error",
        "noExtraBooleanCast": "error",
        "noMultipleSpacesInRegularExpressionLiterals": "error",
        "noUselessFragments": "error",
        "noUselessTypeConstraint": "error",
        "useLiteralKeys": "error",
        "useSimplifiedLogicExpression": "error"
      },
      "correctness": {
        "noConstantCondition": "error",
        "noEmptyPattern": "error",
        "noInnerDeclarations": "error",
        "noSelfAssign": "error",
        "noUnreachable": "error",
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error",
        "useIsNan": "error"
      },
      "style": {
        "noDefaultExport": "error",
        "noImplicitBoolean": "error",
        "noNonNullAssertion": "error",
        "noParameterAssign": "error",
        "useConst": "error",
        "useConsistentArrayType": {
          "level": "error",
          "options": {
            "syntax": "shorthand"
          }
        },
        "useDefaultParameterLast": "error",
        "useEnumInitializers": "error",
        "useExponentiationOperator": "error",
        "useNamingConvention": {
          "level": "error",
          "options": {
            "strictCase": true
          }
        }
      },
      "suspicious": {
        "noArrayIndexKey": "error",
        "noAsyncPromiseExecutor": "error",
        "noCatchAssign": "error",
        "noClassAssign": "error",
        "noCompareNegZero": "error",
        "noConsoleLog": "error",
        "noDebugger": "error",
        "noDoubleEquals": "error",
        "noDuplicateCase": "error",
        "noDuplicateClassMembers": "error",
        "noDuplicateObjectKeys": "error",
        "noDuplicateParameters": "error",
        "noExplicitAny": "error",
        "noFallthroughSwitchClause": "error",
        "noFunctionAssign": "error",
        "noRedeclare": "error",
        "noShadowRestrictedNames": "error",
        "useValidTypeof": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "trailingCommas": "es5",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteStyle": "double"
    }
  }
}
```

### 7.2 Auxiliary ESLint 9+ Flat Configuration

Where complex TypeScript AST analysis requires typescript-eslint, the following minimal `eslint.config.js` is employed:

```javascript
// eslint.config.js
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.base.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
];
```

---

## 8. Code Review & Verification Checklist

Before opening a pull request, verify that the submission adheres to the following criteria:

```markdown
### Verification Checklist

- [ ] **Type Boundaries**
  - [ ] No `any` primitives used (verified via Biome/ESLint).
  - [ ] No non-null assertions (`!`) introduced.
  - [ ] All inputs parsing through Zod schemas at external runtime borders.
  - [ ] Schema output models use strict brand types where primitive confusion is possible.

- [ ] **Immutability & Purity**
  - [ ] Function arguments accepting arrays/objects flagged with `readonly`.
  - [ ] No mutating calls used on arrays (`push`, `pop`, `splice`, `reverse`, `sort`). Replaced with non-mutating variants (`toSorted`, `toReversed`, spread syntax).
  - [ ] Module configurations and domain objects explicitly use `Object.freeze()` or `deepFreeze()`.

- [ ] **Error Handling & Control Flow**
  - [ ] Known domain errors modeled with the `Result<T, E>` pattern.
  - [ ] Exceptions (`throw`) limited to unrecoverable system invariants or crashes.
  - [ ] Custom domain errors inherit from `DomainError` and include RFC 7807 metadata mapping.
  - [ ] All switch blocks handle union types exhaustively (`@typescript-eslint/switch-exhaustiveness-check`).

- [ ] **Naming & Conventions**
  - [ ] Files and directories named in `kebab-case`.
  - [ ] React Component files named in `PascalCase`.
  - [ ] No default exports (`style/noDefaultExport`), except for dynamic route segments required by framework design (e.g., Next.js pages).
  - [ ] Type imports use the inline or explicit syntax: `import type { Foo } from "bar"`.

- [ ] **Tooling Signoff**
  - [ ] `pnpm biome check .` completes with zero errors.
  - [ ] `pnpm tsc --build` passes across all packages with zero diagnostic output.
```
