---
name: oppsys-hexagonal-architecture
description: Build full-stack applications using the OppSys-v2 hexagonal architecture pattern with type-safe monorepo, Hono backend, React frontend, and Supabase integration. Includes domain-driven design, error-as-value pattern, and complete scheduling/calendar implementation guide.
---

# OppSys Hexagonal Architecture Skill

## Description
This skill guides you through building applications using the OppSys-v2 architecture pattern: a modern, type-safe, hexagonal architecture monorepo with full-stack TypeScript.

## When to Use This Skill
Use this skill when you need to:
- Build a full-stack application with clean architecture
- Create a monorepo with shared packages
- Implement hexagonal/clean architecture patterns
- Build type-safe APIs with end-to-end type safety
- Structure features with domain-driven design

## Architecture Overview

### Monorepo Structure
```
project/
├── apps/
│   ├── api/           # Backend (Hono + Hexagonal Architecture)
│   ├── client/        # Frontend (React + Tanstack)
│   ├── admin/         # Admin panel (optional)
│   └── website/       # Marketing site (optional)
├── packages/
│   ├── ui/            # Shared UI components (Shadcn)
│   ├── shared/        # Shared utilities and types
│   ├── supabase/      # Database client and types
│   └── logger/        # Logging utilities
├── turbo.json         # Turborepo configuration
└── pnpm-workspace.yaml
```

## Backend Architecture (Hexagonal Pattern)

### Layer 1: Domain Layer (`domain/`)
**Purpose**: Core business entities and contracts (interfaces)

```typescript
// src/[feature]/domain/entity.ts
import { z } from "zod";

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... other fields
});
export type Entity = z.infer<typeof EntitySchema>;
```

```typescript
// src/[feature]/domain/entity-repo.ts
import type { Result } from "@oppsys/shared";

export type GetEntityResult = Result<Entity, Error, "UNKNOWN_ERROR" | "NOT_FOUND">;

export interface EntityRepo {
  findById(id: string): Promise<GetEntityResult>;
  create(data: CreateEntity): Promise<CreateEntityResult>;
  // ... other methods
}
```

**Key Points**:
- Use Zod schemas for validation
- Define repository interfaces (contracts)
- Use `Result<TData, TError, TKind>` type for all returns
- No dependencies on infrastructure

### Layer 2: Application Layer (`app/`)
**Purpose**: Business logic and use cases

```typescript
// src/[feature]/app/get-entity-use-case.ts
import { buildUseCase } from "src/lib/use-case-builder";
import z from "zod";

export const GetEntityQuerySchema = z.object({
  id: z.string(),
  // ... other query params
});

export const getEntityUseCase = buildUseCase()
  .input(GetEntityQuerySchema)
  .handle(async (ctx, input) => {
    const result = await ctx.entityRepo.findById(input.id);

    if (!result.success) {
      ctx.logger.error("[getEntity] failed", result.error, { input });
      return result;
    }

    return { success: true, data: result.data };
  });
```

**Key Points**:
- Use `buildUseCase()` for all use cases
- NO try/catch (errors are values)
- Validate inputs with Zod
- Access dependencies via `ctx` (context)
- Return `Result` type

### Layer 3: Infrastructure Layer (`infra/`)
**Purpose**: Implementation of domain contracts

```typescript
// src/[feature]/infra/entity-repo-supabase.ts
import { tryCatch } from "src/lib/try-catch";
import { toCamelCase, toSnakeCase } from "@oppsys/shared";

export class EntityRepoSupabase implements EntityRepo {
  constructor(
    private supabase: OppSysSupabaseClient,
    private logger: Logger
  ) {}

  async findById(id: string): Promise<GetEntityResult> {
    return await tryCatch(async () => {
      const { data, error } = await this.supabase
        .from("entities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        this.logger.error("[findById]:", error, { id });
        throw error;
      }

      if (!data) {
        return {
          success: false,
          kind: "NOT_FOUND",
          error: new Error("Entity not found"),
        };
      }

      return {
        success: true,
        data: EntitySchema.parse(toCamelCase(data)),
      };
    });
  }
}
```

**Key Points**:
- Implement repository interfaces
- Use `tryCatch()` wrapper for error handling
- Convert snake_case ↔ camelCase
- Log errors with context

### Layer 4: Presentation Layer (`presentation/`)
**Purpose**: HTTP routes and request/response handling

```typescript
// src/[feature]/presentation/entity-router.ts
import { Hono } from "hono";
import { honoRouter } from "src/lib/hono-router";
import { describeRoute, validator } from "hono-openapi";
import { zValidatorWrapper } from "src/lib/validator-wrapper";

export const entityRouter = honoRouter((ctx) => {
  const router = new Hono()
    .get(
      "/:id",
      describeRoute({ description: "Get entity by ID" }),
      zValidatorWrapper("param", GetEntityParamsSchema),
      validator("param", GetEntityParamsSchema),
      async (c) => {
        const params = c.req.valid("param");
        const result = await getEntityUseCase(ctx, params);
        return handleResultResponse(c, result, { oppSysContext: ctx });
      }
    );

  return router;
});
```

**Key Points**:
- Use `honoRouter()` wrapper
- Double validation: `zValidatorWrapper` + `validator`
- Use `describeRoute` for OpenAPI docs
- Handle responses with `handleResultResponse()`

### Context (Dependency Injection)

```typescript
// src/get-context.ts
export function getContext() {
  const logger = new LoggerWinston();
  const supabase = createSupabaseClient();

  return {
    logger,
    entityRepo: new EntityRepoSupabase(supabase, logger),
    // ... other repos
  };
}

export type OppSysContext = ReturnType<typeof getContext>;
```

### API Router (Entry Point)

```typescript
// src/api-router.ts
export const apiRouter = honoRouter((ctx) => {
  const publicApiRouter = new Hono()
    .get("/api/health", (c) => c.json({ status: "OK" }, 200))
    .route("/api/auth", authRouter);

  const authenticatedApiRouter = new Hono()
    .use("*", authenticateToken(ctx))
    .route("/api/entities", entityRouter);

  return new Hono()
    .route("/", publicApiRouter)
    .route("/", authenticatedApiRouter);
});
```

## Frontend Architecture

### Structure
```
src/
├── app/                    # Pages and routes
│   ├── (auth)/            # Public routes
│   └── (sidebar)/         # Authenticated routes
├── components/            # Feature components
│   ├── auth/
│   ├── entities/
│   └── tanstack-query/
├── lib/                   # Utilities
│   ├── hono-client.ts    # Type-safe API client
│   └── supabase.ts
├── hooks/                 # Custom hooks
└── routes.ts              # Route definitions
```

### Type-Safe API Client

```typescript
// lib/hono-client.ts
import { hc } from "hono/client";
import type { ApiRouter } from "@oppsys/api";

export const honoClient = hc<ApiRouter>(API_URL);
```

### Data Fetching with Tanstack Query

```typescript
// components/entities/hooks/use-entities.ts
import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono-client";

export const useEntities = (query: ListEntitiesQuery) => {
  return useQuery({
    queryKey: ["entities", query],
    queryFn: async () => {
      const response = await honoClient.api.entities.$get({ query });
      if (!response.ok) throw new Error("Failed to fetch entities");
      const data = await response.json();
      return data;
    },
  });
};
```

### Forms with Tanstack Form

```typescript
// components/entities/entity-form.tsx
import { useAppForm } from "@oppsys/ui/hooks/use-app-form";

export const EntityForm = () => {
  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async (values) => {
      const response = await honoClient.api.entities.$post({
        json: values
      });
      // ...
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <form.Field name="name">
        {(field) => <InputField field={field} label="Name" />}
      </form.Field>
    </form>
  );
};
```

## Error Handling Pattern

### Error as Value

```typescript
// Shared type
export type Result<TData, TError = Error, TKind = string> =
  | { success: true; data: TData }
  | { success: false; kind: TKind; error: TError };
```

### Usage in Use Cases

```typescript
// ✅ Good - Error as value
const result = await ctx.repo.findById(id);
if (!result.success) {
  if (result.kind === "NOT_FOUND") {
    return { success: false, kind: "ENTITY_NOT_FOUND", error: result.error };
  }
  return result;
}
const entity = result.data;

// ❌ Bad - try/catch in use case
try {
  const entity = await ctx.repo.findById(id);
} catch (error) {
  // Don't do this in use cases!
}
```

### tryCatch Wrapper (Infrastructure only)

```typescript
// lib/try-catch.ts
export async function tryCatch<T>(
  fn: () => Promise<Result<T, any, any>>
): Promise<Result<T, Error, "UNKNOWN_ERROR">> {
  try {
    return await fn();
  } catch (error) {
    return {
      success: false,
      kind: "UNKNOWN_ERROR",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
```

## Code Conventions

### TypeScript
- Prefer `type` over `interface` (unless implementing classes)
- Use `import type` for type imports
- camelCase for variables/functions
- PascalCase for components/classes
- No comments unless absolutely necessary

### Imports/Exports
```typescript
// ✅ Good
import { buildUseCase } from "src/lib/use-case-builder";
import type { Entity } from "./domain/entity";
export const getEntityUseCase = ...;
export type Entity = ...;

// ❌ Bad
const buildUseCase = require("...");
export default function() { ... }
```

### Function Parameters
```typescript
// ✅ Good - Object if > 1 parameter
function createUser({ email, password }: CreateUserParams) { ... }

// ❌ Bad - Multiple parameters
function createUser(email: string, password: string) { ... }
```

## Shared Packages

### @oppsys/shared
```typescript
// Utility functions
export { toCamelCase, toSnakeCase } from "./case-converters";
export type { Result, ResultSuccess, ResultError } from "./results";
export { unwrap } from "./results"; // Throws if error
```

### @oppsys/ui
```typescript
// UI components (Shadcn)
export { Button } from "./components/button";
export { Input } from "./components/input";
// Tanstack Form fields
export { InputField } from "./components/tanstack-form/input-field";
```

## Development Workflow

### Scripts
```json
{
  "dev": "pnpm turbo dev",
  "build": "pnpm turbo build",
  "test": "pnpm turbo test",
  "check-types": "pnpm turbo check-types",
  "lint": "pnpm turbo lint"
}
```

### Creating a New Feature

1. **Create domain layer**
   - Define entity schemas (Zod)
   - Define repository interfaces
   - Define result types

2. **Create application layer**
   - Write use cases with `buildUseCase()`
   - Define input schemas
   - Implement business logic

3. **Create infrastructure layer**
   - Implement repository classes
   - Use `tryCatch()` wrapper
   - Handle database queries

4. **Create presentation layer**
   - Define routes with Hono
   - Add validation and OpenAPI docs
   - Wire up use cases

5. **Update context**
   - Add repository to `getContext()`
   - Add to type `OppSysContext`

6. **Frontend integration**
   - Create hooks with Tanstack Query
   - Create components
   - Add routes

## Best Practices

### ✅ Do
- Use architecture layers strictly
- Validate all inputs with Zod
- Return `Result` types from repositories and use cases
- Log errors with context
- Use type-safe API client
- Keep use cases pure (no side effects except via repos)
- Convert snake_case ↔ camelCase at infrastructure boundaries

### ❌ Don't
- Mix layers (e.g., calling Supabase from use case)
- Use try/catch in use cases (only in infrastructure with `tryCatch`)
- Use `any` type
- Add comments unless necessary
- Skip validation
- Use default exports

## Example: Complete Feature

See `src/modules/` in oppsys-v2 for a complete real-world example with:
- Domain: `module.ts`, `module-repo.ts`, `module-config.ts`
- App: `get-modules-use-case.ts`, `execute-module-use-case.ts`
- Infra: `module-repo-supabase.ts`
- Presentation: `module-router.ts`

## Calendar/Scheduling Feature

For scheduling features (like social media post scheduling):

### Backend
```typescript
// domain/scheduled-task.ts
export const ScheduledTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  moduleId: z.string(),
  executionTime: z.string().datetime(),
  payload: z.record(z.unknown()),
  status: z.enum(["scheduled", "running", "completed", "failed"]),
  generatedContent: z.object({
    title: z.string().nullable(),
    htmlPreview: z.string().nullable(),
  }).nullable(),
});
```

### Frontend
```typescript
// Use react-big-calendar
import { Calendar, momentLocalizer } from "react-big-calendar";

const events = tasks.map(task => ({
  id: task.id,
  title: task.generatedContent?.title || "Post",
  start: new Date(task.executionTime),
  end: new Date(task.executionTime),
  resource: task,
}));

<Calendar
  localizer={momentLocalizer(moment)}
  events={events}
  onSelectEvent={handleSelectEvent}
/>
```

## Summary

This architecture provides:
- 🏗️ **Clean separation of concerns** (hexagonal architecture)
- 🔒 **Type safety** end-to-end (TypeScript + Zod)
- 🚀 **Scalability** (monorepo with shared packages)
- 🧪 **Testability** (dependency injection)
- 📝 **Self-documenting** (Zod schemas, OpenAPI)
- 🔄 **Maintainability** (clear patterns and conventions)

Use this skill to build robust, type-safe, full-stack applications with clean architecture!
