# CLAUDE.md

> **This file is the single source of truth for all development, modification, refactoring, and review of code in this project.**
> Every AI assistant, developer, and contributor must read and follow this document before touching any code.

---

## 1. Project Overview

This is a **production-grade backend REST API** for an e-commerce platform, built with:

| Technology | Version / Notes |
|---|---|
| Runtime | Node.js (LTS) |
| Language | **TypeScript** (strict mode) |
| Framework | Express.js v5 |
| Database | PostgreSQL via **TypeORM** |
| Cache / Queue | Redis + **BullMQ** |
| Auth | JWT (access token) + HTTP-only cookie (refresh token) |
| Authorization | Permission-based RBAC via `checkPermissions` middleware |
| Validation | **Joi** schemas |
| File Upload | Multer + **Cloudinary** |
| Email | Nodemailer + BullMQ queue |
| API Docs | Swagger / OpenAPI (`swagger.yaml`) |
| Logging | Morgan (HTTP) |

The codebase must always prioritize:

- **Clean architecture** and strict separation of concerns
- **Security** at every layer
- **Maintainability** and readability over cleverness
- **Scalability** — stateless, horizontally scalable design
- **Testability** — all business logic must be independently testable
- **Production readiness** — graceful shutdown, proper error handling, environment-based config

---

## 2. Core Development Principles

- Write **simple, explicit, readable** code. Prefer clarity over brevity.
- **Never duplicate business logic.** If it exists, reuse or refactor it.
- **Controllers are thin.** They only parse requests and return responses.
- **Services own business logic.** No database access directly inside services — delegate to TypeORM repositories or repository classes.
- **Route files are declarative.** They only define endpoint paths, middleware chains, and delegate to controllers.
- **Validate all external input** before it reaches any controller or service.
- **Fail safely.** Always return a consistent, structured error response.
- **Never trust the client.** Sanitize and validate everything.
- **Keep functions small and focused.** One function, one responsibility.
- **Prefer `async/await`** over `.then()/.catch()` chains.
- **No magic numbers or strings.** Use constants from `src/constants/`.

---

## 3. Folder Structure

```
BE_E-Commerce-website/
├── server.ts                  # App bootstrap: middleware, DB init, graceful shutdown
├── src/
│   ├── index.ts               # Central router — mounts all module routes
│   ├── config/                # External service configs (DB, Redis, Cloudinary, JWT)
│   │   ├── db-config.ts
│   │   ├── redis-config.ts
│   │   ├── cloudinary-config.ts
│   │   └── auth-token-config.ts
│   ├── modules/               # Feature modules — each module is self-contained
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── user/
│   │   ├── role/
│   │   ├── permission/
│   │   ├── role-permission/
│   │   ├── user-role/
│   │   ├── category/
│   │   ├── item/
│   │   ├── item-variant/
│   │   ├── image/
│   │   ├── supplier/
│   │   ├── email/
│   │   └── error/
│   ├── middlewares/           # Cross-cutting concerns (auth, error, upload)
│   │   ├── auth.middlewares.ts
│   │   ├── error.middlewares.ts
│   │   └── upload.middlewares.ts
│   ├── validations/           # Joi validation middleware per module
│   │   ├── authValidation.ts
│   │   ├── userValidation.ts
│   │   └── ...
│   ├── constants/             # Shared enumerations and string constants
│   │   ├── http-status.ts
│   │   ├── message.ts
│   │   ├── permission.ts
│   │   └── role.ts
│   ├── interface/             # TypeScript interfaces and type definitions
│   │   ├── common.ts
│   │   └── user.interface.ts
│   ├── common/                # Shared infrastructure (e.g., Redis service)
│   │   └── redis/
│   ├── utils/                 # Pure utility functions
│   │   ├── queue.ts           # BullMQ email queue + worker
│   │   └── validation.ts      # Joi middleware factory
│   ├── helpers/               # Domain-specific helper functions (not pure utils)
│   ├── email-templates/       # Handlebars email templates
│   └── type.d.ts             # Global TypeScript declaration augmentations
├── scripts/                   # Build scripts
├── swagger.yaml               # OpenAPI 3.x specification
├── .env                       # Local secrets — NEVER commit
├── .env.example               # Template for all required env vars
├── docker-compose.yml
├── Dockerfile
├── tsconfig.json
└── eslint.config.mts
```

### Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `modules/<name>/` | All feature-specific code: router, controller, service, TypeORM entity model |
| `config/` | Connection setup for databases and external services only |
| `middlewares/` | Express middleware: authentication, authorization, error handling, file upload |
| `validations/` | Joi-based request validation middleware, one file per module |
| `constants/` | Immutable values: status codes, messages, permission names, role names |
| `interface/` | TypeScript interfaces and type augmentations (e.g., `req.user`) |
| `common/` | Shared infrastructure services (e.g., `RedisService`) |
| `utils/` | Pure, reusable functions with no side effects |
| `helpers/` | Domain-aware helper functions (allowed to have side effects) |
| `email-templates/` | Handlebars `.html` template files for transactional emails |

---

## 4. Architecture Rules

- **Routes** → define the endpoint path, middleware chain, and delegate to controller. Nothing else.
- **Controllers** → parse `req`, call service, return `res`. No business logic. No direct DB access.
- **Services** → contain all business logic. May use TypeORM repositories or `AppDataSource`. Must be injectable (constructor-based DI).
- **TypeORM Entities** (in `modules/<name>/<name>.model.ts`) → define database schema only. No business logic.
- **Middlewares** → handle cross-cutting concerns: authentication, authorization, validation, error formatting, file upload.
- **Utils** → pure functions. No imports from modules, services, or configs.
- **No circular dependencies.** Use dependency injection via constructors.
- **No direct database queries inside controllers or route files.**
- **No business logic inside route files.**
- **No business logic inside middleware files** except authorization checks.

---

## 5. Module Structure Convention

Each module under `src/modules/<name>/` follows this pattern:

```
modules/auth/
├── auth.router.ts        # Route definitions + middleware chain
├── auth.controller.ts    # Request/response mapping only
└── auth.service.ts       # All business logic + TypeORM repository calls
```

For data-heavy modules, add an entity model:

```
modules/user/
├── user.router.ts
├── user.controller.ts
├── user.service.ts
└── user.model.ts         # TypeORM @Entity class
```

**Dependency Injection Pattern (mandatory):**

```typescript
// router — instantiate and wire dependencies
const authService = new AuthService(AppDataSource, redisService, emailQueue)
const authController = new AuthController(authService)

// controller — receives service via constructor
export class AuthController {
  private authService: AuthService
  constructor(authService: AuthService) {
    this.authService = authService
  }
}
```

---

## 6. Express.js Rules

- Always use `express.Router()` for route modules.
- Register all routes centrally via `src/index.ts`.
- Mount the central router in `server.ts` via `app.use('/', Router)`.
- **Always use `async/await`** inside route handlers and controller methods.
- **Never leave unhandled promise rejections.** Use `try/catch` in every async method or a centralized async wrapper.
- Use `next(error)` to propagate errors to `defaultErrorHandler`.
- The `defaultErrorHandler` in `src/middlewares/error.middlewares.ts` is the **only** place to format and send error responses globally.
- Use proper HTTP status codes from `http-status-codes` package (already installed) or `src/constants/http-status.ts`.
- Keep route definitions clean and declarative:

```typescript
// ✅ Correct
router.post('/register', authRegisterValidation, (req, res) =>
  authController.register(req, res)
)

// ❌ Wrong — business logic in route file
router.post('/register', async (req, res) => {
  const user = await db.save(req.body)
  res.json(user)
})
```

- Disable `x-powered-by` header — already handled by `helmet()`.
- Limit request body size (set in `express.json()` options if not already capped).

---

## 7. API Design Rules

### URL Conventions

- Use **plural nouns** for resource collections: `/api/users`, `/api/items`.
- Use **kebab-case** for multi-word paths: `/api/item-variants`, `/api/role-permissions`.
- **Do not version routes** with `/v1/` unless explicitly instructed — current routes use `/api/<resource>` directly.
- Use path params for resource identity: `GET /api/users/:id`.
- Use query params for filtering, pagination, sorting: `GET /api/items?page=1&limit=10&sort=name`.

### Standard Response Format

**All success responses must follow this exact shape:**

```json
{
  "status": 200,
  "message": "Operation completed successfully",
  "data": {}
}
```

**All error responses must follow this exact shape:**

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

> **Note:** The current codebase uses `{ status, message, data }` shape. Do not deviate from this unless explicitly instructed to standardize the error shape. Always match what already exists in the module you are editing.

- **Never expose raw database errors** (e.g., TypeORM constraint violation messages) to clients.
- **Never expose internal stack traces** in production responses.
- Use **pagination** for all list endpoints: return `{ data, total, page, limit }`.
- Use **HTTP 204 No Content** for DELETE operations that return no body.

---

## 8. Validation Rules

- All validation middleware lives in `src/validations/`.
- Use **Joi** for all schema validation (already installed).
- The `validation()` factory from `src/utils/validation.ts` wraps Joi schemas into Express middleware — **always use it**.
- Validation must run **before** the controller is called (in the router middleware chain).
- Validate `req.body`, `req.params`, `req.query` as needed.
- Return clear, field-specific error messages.
- **Never trust client input.** Validate types, formats, lengths, and relationships.

```typescript
// ✅ Correct usage
import validation from '~/utils/validation'
import Joi from 'joi'

const createItemValidation = validation(Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
  categoryId: Joi.string().uuid().required()
}))

export { createItemValidation }
```

---

## 9. Authentication and Authorization Rules

### Authentication (`src/middlewares/auth.middlewares.ts`)

- **Access tokens** are JWT, signed with `JWT_SECRET`, sent in `Authorization: Bearer <token>` header.
- **Refresh tokens** are stored in an **HTTP-only, secure, SameSite cookie** named `refreshToken`.
- The `authenticate` middleware verifies the JWT and attaches the user object (without `password`) to `req.user`.
- **Always use `req.user` from the middleware context.** Never trust user IDs passed in the request body unless the auth middleware is absent from that route for a documented reason.
- Passwords must be hashed with **bcrypt** (already installed). `SALT` rounds come from `process.env.SALT`.
- **Never store plain-text passwords.**
- **Never log tokens, passwords, or secrets.**

### Authorization (`checkPermissions`)

- Permission-based RBAC is implemented via `checkPermissions(requiredPermission)` middleware.
- Permission names are defined as constants in `src/constants/permission.ts`.
- Permissions are cached in Redis (`permissions:<userId>` key, 1-hour TTL) for performance.
- **Always call `authenticate` before `checkPermissions`** in the router chain.
- Authorization must be checked before the controller processes the request.

```typescript
// ✅ Correct
router.delete(
  '/:id',
  authenticate,
  checkPermissions(PERMISSIONS.DELETE_ITEM),
  (req, res) => itemController.deleteItem(req, res)
)
```

---

## 10. Database Rules

- **TypeORM** with `AppDataSource` (PostgreSQL) is the ORM. Use it consistently.
- All database access goes through **TypeORM repositories** obtained via `AppDataSource.getRepository(Entity)` or TypeORM's built-in `DataSource` methods.
- **No raw SQL strings** unless TypeORM query builder cannot express the query and it is absolutely necessary. Add a comment explaining why.
- Use **transactions** for multi-step write operations (e.g., creating a user + assigning a role atomically).
- **Avoid N+1 queries.** Use `leftJoinAndSelect` or `relations` option to eager-load what you need in one query.
- Add **database indexes** for columns used in frequent `WHERE` or `ORDER BY` clauses.
- **Use TypeORM migrations** for all schema changes. Never manually modify the production database schema.
- Handle TypeORM constraint errors (unique violation, foreign key violation) gracefully — catch them in the service layer and throw a meaningful application error.
- **Never expose raw TypeORM entity objects** directly if sensitive fields (e.g., `password`) must be stripped. Map to a safe DTO before returning.

---

## 11. Error Handling Rules

- Use **custom error classes** defined in `src/modules/error/` (or create them there if they don't exist).
- Use `next(error)` to forward errors to the centralized `defaultErrorHandler` in `src/middlewares/error.middlewares.ts`.
- **Do not throw plain strings.** Always throw `Error` instances or custom error class instances.
- **Do not swallow errors silently.** An empty `catch {}` block is forbidden.
- **Preserve original error context** in server-side logs. Do not discard the original error when wrapping it.
- **Return safe messages to clients.** Internal error details must never reach the HTTP response in production.
- Distinguish error types clearly:

| HTTP Status | When to Use |
|---|---|
| `400 Bad Request` | Invalid input format or business rule violation |
| `401 Unauthorized` | Missing or invalid authentication token |
| `403 Forbidden` | Authenticated but lacks permission |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource (e.g., email already exists) |
| `422 Unprocessable Entity` | Validation passed but semantic error |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server-side failure |

---

## 12. Security Rules

The following are **already configured** in `server.ts` and must **never be removed**:

- `helmet()` — sets secure HTTP headers.
- `cors()` — configured with explicit `origin: process.env.CLIENT_URL` and `credentials: true`.
- `cookieParser()` — required for refresh token cookie handling.
- `morgan()` — HTTP request logging.
- `express.json()` — body parsing (add `limit` option if needed).
- Graceful shutdown handlers for `SIGTERM`, `SIGINT`, `unhandledRejection`, `uncaughtException`.

**Additional mandatory rules:**

- **Never commit `.env`** to version control. Only `.env.example` is committed.
- **Rate limiting** must be added to sensitive endpoints (login, register, forgot-password, reset-password) before going to production. Use `express-rate-limit`.
- **Sanitize user input** when inserting into email templates or any dynamic content.
- **Prevent NoSQL/SQL injection** — TypeORM parameterized queries handle this; never concatenate user input into query strings.
- **Refresh token rotation** — issue a new refresh token on every `/refresh-token` call and invalidate the old one via Redis.
- Use **HTTPS** in production. Ensure `secure: true` and `sameSite: 'none'` on cookies in production (already implemented in `auth.controller.ts`).
- **Never log** `password`, `token`, `secret`, `apiKey`, credit card numbers, or any PII.

---

## 13. Environment Variables Rules

All secrets and environment-specific values **must** come from environment variables via `dotenv`.

**Required variables (from `.env.example`):**

```ini
# App
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:4000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=

# Auth & Security
JWT_SECRET=
JWT_REFRESH_SECRET=
EMAIL_VERIFICATION_SECRET=
PASSWORD_RESET_SECRET=
EMAIL_VERIFICATION_TOKEN_TTL_SECONDS=86400
PASSWORD_RESET_TOKEN_TTL_SECONDS=600
SALT=10

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
ADMIN_EMAIL=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Pagination
LIMIT_PAGE=10

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Rules:**

- **Validate required env vars at startup.** If a critical variable is missing, log a clear error and call `process.exit(1)`.
- **Never hardcode** credentials, tokens, URLs, or secrets anywhere in source code.
- **Always keep `.env.example` updated** when adding new env vars.
- Use `process.env.NODE_ENV` to switch behavior between `development`, `test`, and `production`.

---

## 14. Logging Rules

- **Morgan** handles HTTP request logging in `server.ts` — use `'combined'` format in production, `'dev'` in development. Do not remove or bypass it.
- For application-level logging (errors, business events, auth failures), use **`console.error`** or integrate a structured logger like **Winston** or **Pino** (preferred for production).
- **Log at appropriate levels:**
  - `debug` — detailed flow for development only
  - `info` — startup events, successful critical operations
  - `warn` — recoverable issues, deprecated usage
  - `error` — caught exceptions, service failures
- **Never log:** passwords, JWT tokens, API keys, Redis credentials, email content, or personal data (email addresses in sensitive contexts).
- When logging errors, **include the original error object** (`console.error('Context:', error)`) to preserve the stack trace.
- For distributed tracing readiness, include a **request ID** or correlation ID in log context.

---

## 15. TypeScript Rules

- **TypeScript strict mode** is enabled — never use `// @ts-ignore` or `// @ts-nocheck` unless absolutely unavoidable with a justifying comment.
- Define **interfaces and types** in `src/interface/` for shared types. Module-specific types can live within the module file.
- Use **PascalCase** for interfaces, types, classes, and enums.
- Extend the Express `Request` type via `src/type.d.ts` (e.g., `req.user`) — do not use `any` for augmentations.
- **Avoid `any`** — prefer `unknown` and narrow types explicitly.
- Use **path aliases** (`~/`) configured in `tsconfig.json` for all internal imports. Never use relative paths like `../../../`.

```typescript
// ✅ Correct
import { AuthService } from '~/modules/auth/auth.service'
import { PERMISSIONS } from '~/constants/permission'

// ❌ Wrong
import { AuthService } from '../../../modules/auth/auth.service'
```

---

## 16. Code Style Rules

- **Formatting**: Prettier with project config (`.prettierrc`). Run `npm run prettier:fix` before committing.
- **Linting**: ESLint with project config (`eslint.config.mts`). Run `npm run lint:fix` before committing.
- **Naming:**
  - `camelCase` for variables, functions, method names
  - `PascalCase` for classes, interfaces, type aliases, TypeORM entities
  - `UPPER_SNAKE_CASE` for constants in `src/constants/`
  - `kebab-case` for file names: `auth.controller.ts`, `auth-token-config.ts`
- **No `console.log`** anywhere in production code. Use structured logging or remove debug statements before committing.
- **No unused imports, variables, or parameters.** ESLint will catch them.
- **Avoid deeply nested `if` statements.** Use early returns and guard clauses.
- **Keep functions under ~50 lines** when possible. Extract complex logic into named helper functions.
- **Remove dead code.** Do not comment out code — use version control instead.

---

## 17. Queue and Background Jobs

- **BullMQ** is used for email job processing. The queue and worker are defined in `src/utils/queue.ts`.
- **Email sending is always async via the queue** — never call Nodemailer synchronously in a request handler.
- Queue and worker must be gracefully closed during shutdown (already implemented in `server.ts`).
- For new background job types, create a new queue/worker following the same pattern as `emailQueue`/`emailWorker`.
- **Do not add jobs to the queue from within TypeORM transaction callbacks** — the job might be enqueued before the transaction commits.

---

## 18. File Upload Rules

- File uploads use **Multer** (`src/middlewares/upload.middlewares.ts`) + **Cloudinary**.
- Multer configuration (file size limits, allowed MIME types) is defined in the upload middleware.
- **Validate file type and size** in the upload middleware — reject invalid files before they reach Cloudinary.
- **Never store files on the local filesystem in production.** Stream directly to Cloudinary.
- Store only the Cloudinary public URL and public ID in the database — not the binary data.
- On resource deletion, delete the corresponding Cloudinary asset.

---

## 19. Testing Rules

- **Write tests for all business logic** in services and utilities.
- **Write integration tests** for API endpoints using `supertest`.
- **Test both success and failure paths**, including:
  - Validation errors
  - Authentication failures
  - Authorization failures
  - Database constraint violations
  - External service failures (mock them)
- **Mock external services**: Cloudinary, Nodemailer, Redis, BullMQ, TypeORM repositories.
- **Use a separate test database.** Never run tests against the production or development database.
- Test files live in `src/modules/<name>/<name>.service.spec.ts` or a dedicated `tests/` directory.
- Use **Jest** or **Vitest** as the test runner with `supertest` for HTTP integration tests.
- All tests must pass before merging a pull request.

---

## 20. Git and Commit Rules

- Use **Conventional Commits** format:

```
feat: add forgot password endpoint
fix: handle expired refresh token gracefully
refactor: extract permission caching into redis service
test: add unit tests for auth service
docs: update swagger spec for /api/auth/login
chore: update dependencies
```

- **Do not commit:**
  - `.env` files
  - `node_modules/`
  - `dist/` (build output — already in `.gitignore`)
  - Generated files unless required
  - Debug `console.log` statements
- **Keep pull requests focused.** One PR = one feature, fix, or refactor.
- **Include tests** for any new business logic.
- **Update `swagger.yaml`** when adding or changing API endpoints.

---

## 21. Performance Rules

- **Never block the Node.js event loop.** All I/O operations must be `async`.
- **Use pagination** for all list endpoints. Default to `LIMIT_PAGE` from env vars.
- **Cache expensive or frequently-read data in Redis** with an appropriate TTL.
  - Example: user permissions are cached at `permissions:<userId>` with 1-hour TTL (already implemented).
- **Avoid N+1 queries.** Load related entities in a single query using `leftJoinAndSelect`.
- **Add database indexes** for columns used in `WHERE`, `ORDER BY`, or `JOIN ON` clauses.
- **Compress HTTP responses** — consider adding `compression` middleware for production.
- **Stream large files** (e.g., exports, reports) instead of loading them fully into memory.
- **Avoid unnecessary database calls** — check Redis cache before hitting the database.

---

## 22. Documentation Rules

- **`swagger.yaml`** is the source of truth for the API contract. Keep it updated when adding or modifying endpoints.
- The Swagger UI is accessible at `/api-docs` in development.
- Keep **`README.md`** updated with setup instructions, env var descriptions, and development commands.
- **Add code comments only for non-obvious business logic** — explain the *why*, not the *what*.
- **Do not comment obvious code.** Trust that TypeScript types and descriptive names explain the code.
- When changing endpoint behavior, update the corresponding Swagger definition in `swagger.yaml`.

---

## 23. Dependency Rules

- **Do not add new dependencies** without evaluating:
  - Is there an existing package already installed that solves this?
  - Is it actively maintained and widely used?
  - Does it add significant value vs. a custom implementation?
- **Prefer packages already in the project** (Joi, TypeORM, BullMQ, ioredis, bcrypt, etc.).
- **Never use packages with known critical security vulnerabilities.**
- Run `npm audit` regularly. Fix high/critical vulnerabilities immediately.
- Separate `dependencies` (runtime) from `devDependencies` (build-time, types, linting).

---

## 24. Forbidden Practices

The following are **strictly prohibited**:

| ❌ Forbidden | ✅ Required Instead |
|---|---|
| Business logic in controllers | Move to service layer |
| Database queries in route files | Delegate to service/repository |
| Plain-text password storage | Hash with `bcrypt` |
| Hardcoded secrets, tokens, or URLs | Use `process.env.*` |
| Raw TypeORM error messages returned to client | Catch and wrap in friendly error |
| Unvalidated request body/params/query | Always use Joi validation middleware |
| Empty `catch {}` blocks | Handle or propagate with `next(error)` |
| Silent error swallowing | Log the error and return structured response |
| `console.log` in production code | Use structured logging or remove |
| `any` TypeScript type without justification | Use proper types or `unknown` |
| Relative imports (`../../`) | Use path alias `~/` |
| Circular module dependencies | Refactor via dependency injection |
| Inconsistent response shapes per endpoint | Follow the standard `{ status, message, data }` shape |
| Committing `.env` | Add to `.gitignore`, use `.env.example` |
| Direct mutation of `req.body` | Create a new object if transformation is needed |
| `// @ts-ignore` without explanation | Fix the type error or add a justified comment |
| Synchronous email sending in request handlers | Always use BullMQ email queue |
| Manual database schema changes in production | Use TypeORM migrations |

---

## 25. AI Assistant Behavior Rules

When generating, modifying, refactoring, or reviewing code in this project, Claude **must**:

### ✅ Must Do

- **Inspect the existing structure first.** Check which files already exist in the module before creating new ones.
- **Follow existing patterns exactly.** Match the naming convention, DI style, and file structure already used in auth, user, and other modules.
- **Use the existing tech stack.** Joi for validation, TypeORM for DB, BullMQ for queues, bcrypt for hashing, ioredis for Redis, `http-status-codes` for status codes.
- **Use path aliases (`~/`)** for all internal imports.
- **Include the full feature slice** when adding a feature: router, controller, service, validation schema, Swagger update.
- **Preserve all existing validation, security middleware, logging, and error handling.**
- **Explain the root cause** when fixing a bug (in a code comment only if non-obvious, otherwise in the PR description).
- **Produce production-quality code** — no placeholder logic, no TODO stubs, no mock data unless explicitly requested.
- **Update `swagger.yaml`** when modifying or adding API endpoints.

### ❌ Must Not Do

- **Do not rewrite large portions of the codebase** without explicit instruction.
- **Do not change public API contracts** (endpoint paths, request/response shapes) without explicit instruction.
- **Do not introduce new dependencies** without justification and explicit approval.
- **Do not remove or bypass** existing security middleware (`authenticate`, `checkPermissions`, `authRegisterValidation`, etc.).
- **Do not add `console.log`** statements in production code.
- **Do not hardcode** any secret, credential, token, URL, or environment-specific value.
- **Do not use `any`** TypeScript type without a justified comment.
- **Do not use mock data or placeholder values** in production code paths.
- **Do not leave** empty `catch` blocks, unhandled promise rejections, or silent failures.
- **Do not ask for clarification on requirements that are clear** from this document or the existing codebase. Only ask when the requirement is genuinely ambiguous.

---

## 26. Final Instruction

> **Claude must treat this `CLAUDE.md` file as the authoritative source of truth for all code generation, modification, refactoring, and review within this project.**
>
> Before making any change, verify that it aligns with the architecture, patterns, conventions, and security standards defined here.
>
> When in doubt between two approaches, choose the one that is **safer**, **simpler**, and **more consistent** with what already exists in the codebase.
>
> Code that violates the rules in this document must not be submitted or merged.
