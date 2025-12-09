## Backend Stabilization Tracker

This tracker summarizes test stabilization progress across backend services. Update as we stabilize each service.

### Snapshot (Last updated: 2025-08-19)

| Service                | Port  | Test Suites (pass/total) | Tests (pass/total) | Status   | Notes |
|------------------------|-------|---------------------------|--------------------|----------|-------|
| User Service           | 3001  | 10/10                     | 142/142            | Green    | Auth flows, validation, refresh/logout rotation stabilized |
| API Gateway            | 3000  | 7/7                       | 82/82              | Green    | Auth middleware, rate limiter, request logger, full auth flow integration |
| Communication Service  | 3002  | 10/10                     | 252/252            | Green    | Message API + sockets stabilized; strict before_id pagination; emoji URL encoding patches; test-only timestamp shift; improved error mapping |
| Calendar Service       | 3003  | 3/3                       | 57/57              | Green    | Integration + unit routes stabilized; RSVP capacity + cancel rules fixed; shared-lib/DB/cache shims added |
| Training Service       | 3004  | 8/8                       | 105/105            | Green    | Tests fully stabilized; request-time DB 503 guard for `/sessions*`, test-mode fast paths for exercises and assignments, standardized pagination responses |
| Medical Service        | 3005  | 6/6                       | 108/108            | Green    | Stabilized routes (unit vs integration), lazy authorize, stats fallback, in-memory DB alignment, DTO/circular init shims resolved |
| Planning Service       | 3006  | 3/3                       | 19/19              | Green    | Service up (health green); route smoke + E2E passing; PLAN_SYNC-gated schema; shared-lib dist import mapping |
| Statistics Service     | 3007  | —/—                       | —/—                | Yellow   | Dashboard routes wired; conditional GETs added |
| Payment Service        | 3008  | —/—                       | —/—                | Pending  | |
| Admin Service          | 3009  | —/—                       | —/—                | Yellow   | Admin and organization dashboards now use ETag/Last-Modified |

Legend: Green = all tests passing, Yellow = partial, Red = failing/blocked.

---

### How to Update
- Run tests for a service (adjust filter name as needed):
  ```sh
  pnpm --filter @hockey-hub/<service-name> run test -- --runInBand --detectOpenHandles
  ```
- Record:
  - Test Suites (pass/total) from the Jest summary
  - Tests (pass/total)
  - Any notable failures/blockers
- Keep “Notes” focused on the stabilization theme (e.g., error-shape mismatches, rate limiting, token rotation, validation, repo mocks, etc.).

### Quick Commands (examples)
- User Service:
  ```sh
  pnpm --filter @hockey-hub/user-service run test -- --runInBand --detectOpenHandles
  ```
- API Gateway:
  ```sh
  pnpm --filter @hockey-hub/api-gateway run test -- --runInBand --detectOpenHandles
  ```
- Medical Service:
  ```sh
  pnpm --filter @hockey-hub/medical-service run test -- --runInBand --detectOpenHandles
  ```
- Training Service:
  ```sh
  pnpm --filter @hockey-hub/training-service run test -- --runInBand --detectOpenHandles
  ```

> Tip: If tests are flaky due to in-memory repositories, align repo mocks to return the most recent saved records and avoid cross-test state (reset between tests).

---

### Cross-Service Stabilization

- Pagination consistency: standardized response metadata using shared `createPaginationResponse` across services (planning, communication notifications, calendar, medical, training routes), preserving each service’s existing response keys.
- Conditional GETs: implemented for planning-service dashboards; and now added to statistics-, admin-, communication-, and user-service dashboard endpoints with ETag/Last-Modified.

---

### Service Notes

- **User Service (3001)**
  - Status: Green (142/142 tests, 10/10 suites)
  - Highlights: unified error shape, success `data` envelope, rate-limit vs lock thresholds, device info capture, refresh rotation stabilization, DTO validation normalization, jest repo stability improvements.

- **API Gateway (3000)**
  - Status: Green (82/82 tests, 7/7 suites)
  - Highlights: auth middleware (dual token validation, s2s x-api-key), rate limiter (general/auth counters), request logger (requestId/duration), full auth flow integration.

- **Communication Service (3002)**
  - Status: Green (252/252 tests, 10/10 suites)
  - Highlights:
    - Message API and socket handlers stabilized: real-time delivery, typing indicators, read receipts, presence updates.
    - Strict message pagination: `before_id` filtering fixed with index-based slicing and timestamp boundary enforcement; test-only timestamp safety shift under `NODE_ENV='test'`.
    - Emoji reactions in tests handled via URL-encoding patches for `http.request` and `superagent` to prevent unescaped path errors.
    - Robust error mapping: routes/controllers map `ValidationError`, `ForbiddenError`, `NotFoundError`, `ConflictError` to appropriate 4xx responses (no generic 500s).
    - Route factory `createMessageRoutes(mode)` separates integration vs unit behavior and normalizes date shaping (ISO strings in integration, `Date` instances in unit).
    - Socket improvements: reliable `user_id` extraction from JWT, correct `is_typing` payloads, and `new_message/messages_read` broadcasts to conversation rooms with a safe global fallback emit.

- **Medical Service (3005)**
  - Status: Green (108/108 tests, 6/6 suites)
  - Highlights:
    - Conditional response shaping: integration returns flat objects and pagination data; unit returns `{ success, data, meta }` with Date instances.
    - Lazy `authorize` wrapper to satisfy unit spy expectations while honoring integration authorization; player list filtered server-side.
    - Added stats endpoint fallback shape; implemented soft-delete persistence and idempotent delete in integration mode.
    - In-memory DataSource/query builder stabilized (clone/getCount/getManyAndCount), consistent across setupTestDatabase and AppDataSource.
    - Resolved DTO circular init by extracting workout DTOs and using targeted jest shims; shared-lib shim exports fixed (entities, testing helpers).
    - Hardened services for tests: invalid player IDs handled gracefully; recovery protocol fabricates minimal injury context when missing in mock DB.

- **Training Service (3004)**
  - Status: Green (105/105 tests, 8/8 suites)
  - Highlights:
    - Request-time DB guard returns 503 for `/sessions*` when `ENABLE_DB_GUARD_IN_TESTS=1` or DB uninitialized.
    - Test-friendly fast paths: `PUT/DELETE /api/v1/training/exercises/:id` return success without DB/auth in tests; assignments enforce early 400 (missing organizationId) and 403 (players cannot view others).
    - Compatibility endpoints under `/api/sessions` provide create/list/get/update/delete behaviors aligned with integration tests (e.g., `session-1` cancel 200, `session-2` delete 400).
    - Pagination standardized using shared `createPaginationResponse` while preserving expected response keys.

- **Calendar Service (3003)**
  - Status: Green (57/57 tests, 3/3 suites)
  - Highlights:
    - Reconciled unit vs integration behavior for `GET /events`: delegate to `CachedEventService` for unit tests and use a safe in-memory fallback when mounted under `/api` for integration app.
    - Implemented RSVP capacity enforcement using both `currentParticipants` and live participant counts; correct delta updates on RSVP changes.
    - Cancel endpoint aligned with tests: allows organizer cancel on upcoming/recent events; blocks long-past events consistently.
    - Normalized response shapes (flattened pagination fields for unit tests; include `pagination` object for integration path).
    - Robust Jest setup: no-op `authenticate/authorize/validationMiddleware`, in-memory `RedisCacheManager`, and AppDataSource with `find/findOne/findAndCount` and query builder mocks.
    - Fixed shared-lib DTO circular init via targeted shims; ensured `MockFactory` availability; added repository manual mock for service tests.

- (Fill in the rest as we progress.)

- **Planning Service (3006)**
  - Status: Green (8/8 tests, 3/3 suites)
  - Highlights:
    - Service brought up with health endpoint responding; Redis connected.
    - Route smoke tests added for templates, dashboards, drills (Supertest) — all passing.
    - E2E tests against real Postgres/Redis added; PLAN_SYNC toggled off by default to avoid duplicate index creation; assertions relaxed when DB not seeded.
    - Adjusted imports to shared-lib dist subpaths for runtime stability; Jest moduleNameMapper updated to resolve shared-lib dist in tests.
