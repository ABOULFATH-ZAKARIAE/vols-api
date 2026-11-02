# vols-api

NestJS REST API + TypeScript (ES modules). Tested with Vitest and Supertest, linted with oxlint. Deployed on Render with Docker.

Work on this repo through the team: `/ship-repo <goal>`. The Tech Lead plans first and waits for approval. Team rules live in `~/.claude/team/standards.md`; stack rules live in `.claude/rules/`.

## Commands

| Task | Command |
|---|---|
| Dev server (watch) | `npm run start:dev` |
| Lint | `npm run lint:check` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm test` |
| Unit tests + coverage (80% enforced) | `npm run test:coverage` |
| End-to-end tests | `npm run test:e2e` |
| Production build | `npm run build` |

The definition of done requires `lint:check`, `typecheck`, `test:coverage`, `test:e2e` and `build` to all pass.

## Structure

One folder per feature module:

```
src/
├── main.ts                    bootstrap: helmet, CORS, global ValidationPipe, PORT
├── app.module.ts
├── common/                    shared guards, filters, interceptors, decorators
├── config/                    configuration and env validation
└── <feature>/
    ├── <feature>.module.ts
    ├── <feature>.controller.ts      thin: HTTP in/out only
    ├── <feature>.service.ts         business logic
    ├── <feature>.service.spec.ts    unit tests next to the code
    ├── dto/                         request/response DTOs with class-validator
    └── entities/                    persistence models
test/                          e2e tests (*.e2e-spec.ts) with Supertest
```

## Conventions

- **Controllers stay thin**: parse the request, call a service, return. Logic lives in services.
- **Every request body, query and param uses a DTO** with `class-validator` decorators. `main.ts` registers a global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted` and `transform`; never remove it.
- **Configuration through `@nestjs/config`** (`ConfigModule.forRoot({ isGlobal: true })`), validated at startup. Never read secrets with hardcoded fallbacks.
- **Protected routes use guards** (`@UseGuards`). Check ownership too: a user must not reach another user's data by changing an id.
- **Rate limiting** with `@nestjs/throttler` on auth and other public write endpoints.
- Throw Nest HTTP exceptions (`NotFoundException`, `BadRequestException`), not raw errors; never leak stack traces or internals in responses.
- Passwords hashed with bcrypt or argon2; JWT secret from config, with an expiry.
- Use dependency injection everywhere; no `new Service()` inside other classes.
- **ES modules:** relative imports end in `.js` even though the files are `.ts` (`import { UsersService } from './users.service.js';`). Missing extensions fail at runtime.
- Expose a `GET /health` endpoint for the hosting health check.

## Environment variables

Every variable the app reads is listed in `.env.example` with a placeholder. Real values go in `.env` (git-ignored) and in the Render dashboard.

## Testing

- **Vitest** with globals (`describe`, `it`, `expect`, `vi`). Mock with `vi.fn()` / `vi.spyOn()`, not `jest.*`.
- **Unit tests** (`*.spec.ts`, next to the code) for services, guards and pipes, with dependencies mocked through the Nest testing module.
- **E2E tests** in `test/` hit the real HTTP layer with Supertest: success, validation errors (400), auth errors (401/403), not found (404).
- Coverage thresholds (80%) live in `vitest.config.ts`. `main.ts`, `*.module.ts`, DTOs and entities are excluded; everything else counts.
- `vitest.config.ts` rewrites the compiler-generated dependency-injection metadata (`typeof X === "undefined" ? Object : X`) in tests only, so branch coverage measures real logic. Keep that plugin and `test/decorator-metadata.setup.ts`.

## Deployment

Render with Docker: `Dockerfile` (multi-stage, non-root) and `render.yaml` are included. Agents never run `npm run deploy` or `nest deploy`. Create a Blueprint on Render from the repo, then set the secret env vars marked `sync: false`. CI in `.github/workflows/ci.yml` runs lint, typecheck, unit and e2e tests, coverage and the build.
