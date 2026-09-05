# NestJS Coding Standards — HIS API

Non-negotiable rules for any agent generating NestJS code in this codebase.

## 1. Core Principles

1. No comments in generated code. Names, types, and structure must be self-explanatory.
2. Never duplicate logic that already exists in a base/abstract class — extend it.
3. Prefer the framework-recommended, most performant implementation over a "clever" custom one.
4. Favor composition of small, single-purpose classes over large multi-responsibility ones.
5. Every cross-cutting concern (logging, caching, error shape, pagination, validation, auth) lives in a shared base class, decorator, or provider — never copy-pasted per module.
6. Least code to do the job. If a built-in Nest feature already does it, use that instead of hand-rolling it.

## 2. Module Structure

Actual layout of this repo — do not introduce a `src/modules/*` nesting:

```
common/
  access/            role groups, permission tables
  decorators/        @CurrentUser, @Public, @Roles
  dto/               shared DTOs (filter.dto.ts, pagination, etc.)
  entities/          base.entity.ts
  enums/             shared enums (department, gender, userRoles, userStatus)
  interfaces/        authenticated-user, jwt-payload
  response-format/   shared response/pagination shape
  services/           crud.service.ts (BaseCrudService), password.service.ts
core/
  config/            configuration.ts
  database/           data-source.ts, database.module.ts, entities.ts, typeorm.options.ts, migrations/, scripts/
  guards/             jwt-auth.guard.ts, jwt-refresh.guard.ts, roles.guard.ts
src/
  <domain>/
    <domain>.module.ts
    <domain>.controller.ts
    <domain>.service.ts
    dto/
    entities/
    enums/
```

- One module per bounded domain under `src/` (e.g. `patients`, `consultation`, `pharmacy`, `inventory`, `lab`, `queue`).
- Shared/cross-cutting code goes in `common/` (app-wide primitives) or `core/` (infrastructure: config, database, guards) — never duplicated inside a domain folder.
- Barrel files (`index.ts`) only where they reduce import noise; never re-export an entire module surface blindly.

## 3. Base Classes First

Before writing a new service or repository, check `common/services/crud.service.ts` (`BaseCrudService<T>`) and `common/entities/base.entity.ts` (`BaseEntity`) first. Extend them instead of re-implementing CRUD, pagination, or `findOrFail` semantics.

```typescript
@Injectable()
export class InventoryService extends BaseCrudService<Inventory> {
  constructor(
    @InjectRepository(Inventory) repository: Repository<Inventory>,
  ) {
    super(repository);
  }
}
```

Feature services extend `BaseCrudService` and add only what's domain-specific (events, cross-entity orchestration, domain validation). If a new cross-cutting behavior is needed (e.g. soft-delete, audit trail), add it to `BaseCrudService`/`BaseEntity`, not to one feature service.

## 4. Dependency Injection

- Constructor injection only. No `@Inject()` property injection unless breaking a circular dependency.
- Interfaces for anything with more than one implementation, bound via custom providers (`{ provide: TOKEN, useClass: Impl }`).
- Scope defaults to singleton. Use `REQUEST` scope only when request context is unavoidable.

## 5. Auth Context & Decorators

Never thread `userId` through method signatures across layers.

- **Controller edge**: use `@CurrentUser()` (`common/decorators/current-user.decorator.ts`) to pull the authenticated user (`AuthenticatedUser` from `common/interfaces/authenticated-user.interface.ts`).
- **Guards**: `JwtAuthGuard` (`core/guards/jwt-auth.guard.ts`) is the global auth guard, bypassed only via `@Public()` (`common/decorators/public.decorator.ts`). `RolesGuard` (`core/guards/roles.guard.ts`) enforces `@Roles(...)` (`common/decorators/roles.decorator.ts`) metadata — never inline role checks in controllers or services.
- If a service or listener below the controller needs the current user without a parameter, add a request-scoped `AuthContext` provider (backed by `nestjs-cls` or equivalent AsyncLocalStorage) rather than passing `userId` through every method signature.

```typescript
@Roles(UserRole.Admin)
@Delete(':id')
remove(@Param('id', ParseUUIDPipe) id: string) {
  return this.service.remove(id);
}
```

## 6. Events & Subscribers

`@nestjs/event-emitter` is already a dependency — use it for in-process domain events.

- Every domain event is a typed class; every reaction is a listener class, not an inline callback.
- Emit events from services, never from controllers.
- Use `{ async: true }` on listeners doing I/O so they don't block the emitter.
- For cross-service/cross-process communication, promote the same event shape to the existing queue module instead of inventing a second messaging convention.

## 7. DTOs & Validation

- One DTO per operation (`CreateXDto`, `UpdateXDto`, `XQueryDto`) — never reuse an entity as a DTO.
- `class-validator` + `class-transformer` are already dependencies — enforce globally via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- Use `PartialType(CreateXDto)` (`@nestjs/mapped-types`) for update DTOs instead of redeclaring fields.
- Reuse `common/dto/filter.dto.ts` for list/query filtering and pagination instead of redefining pagination params per domain.

## 8. Error Handling

- Reuse Nest's built-in exceptions (`NotFoundException`, `BadRequestException`, etc.) as `BaseCrudService` already does — don't introduce a parallel exception hierarchy unless a domain truly needs a distinct error code contract.
- If a domain-specific exception is needed, it must extend a shared base exception, not `HttpException` directly, and be caught by a single global exception filter.

## 9. Interceptors & Guards

- Serialization: global `ClassSerializerInterceptor` + `@Exclude()`/`@Expose()` on entities — never manually strip fields in services.
- Caching: extend Nest's `CacheInterceptor` per-route rather than hand-rolled cache checks in services.
- Auth: compose `JwtAuthGuard` + `RolesGuard` via `@UseGuards()`; role metadata via `@Roles()` only.

## 10. Performance Defaults

- Always paginate list endpoints (`findManyWithPagination` on `BaseCrudService`, or `common/response-format`'s `IPagination`) — never return unbounded arrays.
- Select only needed columns/relations (`select`, `relations` options) — avoid default eager-loading.
- Use `Promise.all` for independent async calls; never sequential `await` in a loop for independent work.
- Cache read-heavy, rarely-changing data explicitly, invalidated on the write path via the event system — not ad hoc.
- Use `Logger` from `@nestjs/common` over `console.log`; never leave debug logging in committed code.

## 11. Testing

- Every module ships `*.controller.spec.ts` and `*.service.spec.ts` alongside the implementation (see existing domains for the pattern).
- Mock at the repository boundary, not the service boundary, so business logic in services is actually exercised.

## 12. Build & Test Commands

- `npm run start:dev` — watch mode.
- `npm run lint` — eslint with `--fix`.
- `npm run test` / `npm run test:e2e` — unit / e2e specs.
- `npm run migration:generate` / `npm run migration:run` — TypeORM migrations via `core/database/data-source.ts`.

## 13. What the Agent Should Never Do

- Never write a new service/controller/repository from scratch when `BaseCrudService`/`BaseEntity` covers the behavior — extend it.
- Never add comments, including JSDoc, unless explicitly asked for a public API doc.
- Never inline business logic in controllers.
- Never emit or catch events with untyped payloads (`any`).
- Never use `@Inject(forwardRef(...))` as a first resort — it signals a module boundary problem to fix instead.
- Never pass `userId`/`user` as a parameter through service methods — pull it from an auth context or `@CurrentUser()`.
- Never write an inline role/permission `if` check — put it in `RolesGuard` via `@Roles()`.
- Never write more code than the task needs. If a built-in pipe, guard, interceptor, or decorator already does it, use that instead of a custom one.
