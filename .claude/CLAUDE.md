# Lost & Found

## Project Overview

A full-stack web application for posting lost and found items in a university environment, submitting ownership claims, and managing the return of belongings. Built as a course project for Web Development.

**Tech stack:**
- **Frontend:** Angular 21.2 (standalone API, zoneless), TypeScript 5.9, RxJS 7.8, Vite-based build
- **Backend:** Python, Django 6.0.3, Django REST Framework, SimpleJWT, django-cors-headers
- **Database:** SQLite3 (development)
- **Architecture:** Monorepo with separate `frontend/` and `backend/` directories

## Repository Structure

```
lost-and-found/
├── backend/                # Django REST API
│   ├── api/
│   │   ├── models.py       # Category, Item, Claim
│   │   ├── serializers.py  # User/Register/Category/Item/Claim serializers
│   │   ├── views.py        # Auth + resource views; transactional state changes
│   │   ├── urls.py         # API route definitions
│   │   ├── permissions.py  # IsOwnerOrReadOnly
│   │   ├── tests.py        # 58 tests; auth + items + claims + clear-image
│   │   └── migrations/
│   │       └── 0006_seed_demo_data.py  # Demo data — only seeds when DEBUG=True
│   ├── backend/
│   │   ├── settings.py     # Env-driven (SECRET_KEY, DEBUG, ALLOWED_HOSTS, CORS)
│   │   └── urls.py         # admin + api/ + media (DEBUG-only)
│   ├── manage.py
│   ├── .env.example        # Template for backend env vars
│   └── requirements.txt
├── frontend/               # Angular 21 SPA
│   ├── src/
│   │   ├── environments/
│   │   │   ├── environment.ts        # Dev: apiBaseUrl=http://127.0.0.1:8000/api
│   │   │   └── environment.prod.ts   # Prod: apiBaseUrl=/api
│   │   ├── app/
│   │   │   ├── app.routes.ts
│   │   │   ├── core/
│   │   │   │   ├── guards/auth.guard.ts
│   │   │   │   ├── interceptors/auth.interceptor.ts  # Bearer + silent refresh
│   │   │   │   └── services/                         # auth, item, category, claim, health
│   │   │   ├── models/                               # auth, item, claim
│   │   │   ├── pages/
│   │   │   │   ├── login/  register/                 # Auth forms
│   │   │   │   ├── items/                            # Public list, paginated
│   │   │   │   ├── item-detail/  item-form/
│   │   │   │   ├── my-items/                         # Route: /items/me
│   │   │   │   ├── my-claims/                        # Route: /claims/me
│   │   │   │   └── profile/                          # Route: /profile (hub)
│   │   │   └── shared/                               # navbar, item-card
│   │   └── index.html
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .prettierrc
└── README.md
```

**Generated/vendored directories to skip:** `node_modules/`, `frontend/dist/`, `frontend/.angular/`, `backend/venv/`, `__pycache__/`, `db.sqlite3`, `backend/media/`

## Build & Run

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # then edit; in DEBUG mode the defaults work
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`. Required env vars (see `.env.example`):
`DJANGO_SECRET_KEY` (required when `DJANGO_DEBUG=False`), `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`.

### Frontend

```bash
cd frontend
npm install
npm start          # or: npx ng serve
```

Frontend runs at `http://localhost:4200`.

### Tests

```bash
# Backend (58 tests covering auth flow, items, claims, state transitions)
cd backend && python manage.py test

# Frontend (no tests written yet)
cd frontend && npm test
```

### Build

```bash
cd frontend && npm run build
```

## Code Conventions

### Backend (Python/Django)

- **Naming:** snake_case for functions, variables, file names. PascalCase for classes and serializers.
- **Views:** Mix of function-based views (`@api_view`) and class-based views (`APIView`). FBVs for stateful actions (`approve_claim`, `reject_claim`, `mark_resolved_view`), CBVs for resource list/detail endpoints.
- **State transitions:** any view that changes more than one row (claim approval, item resolution) uses `with transaction.atomic()` and `select_for_update()`. Re-check state inside the lock — never trust pre-lock reads.
- **Serializers:** explicit `fields = [...]`, never `'__all__'`. Treat anything sensitive as `read_only_fields`. `status` on `Item` is read-only in the serializer; transitions go through the `mark-resolved` / `approve-claim` endpoints.
- **Imports:** stdlib → Django → DRF → local app imports.
- **Error handling:** DRF's `serializer.is_valid(raise_exception=True)` pattern; manual `Response` with status codes for auth and state-machine errors.
- **Permissions:** Default is **`IsAuthenticated`** in settings. Public endpoints (`register`, `login`, `health`, `categories`, items list `GET`) opt in with explicit `permission_classes = [AllowAny]`.
- **Throttling:** scoped throttles defined in settings (`auth: 10/min`, `claim: 20/min`); apply with `@throttle_classes([ScopedRateThrottle])` plus `view.throttle_scope = 'auth'` (or `'claim'`).

### Frontend (Angular/TypeScript)

- **Naming:** kebab-case for file names, PascalCase for classes/components, camelCase for variables/methods.
- **Component style:** Standalone components only (no NgModules). Angular 21 syntax with new control-flow blocks (`@if`, `@for`).
- **State management:** Angular Signals (`signal()`, `computed()`) for reactive state — Angular 21 is zoneless, so function calls in templates won't auto-trigger change detection. Use signals.
- **Component styles:** every component owns its `.css` file via `styleUrl`. **Do not** put `<style>` blocks inside HTML templates and do not use inline `style="..."` attributes for anything beyond a one-liner — they leak globally and skip Prettier.
- **API base URL:** import `environment.apiBaseUrl` from `src/environments/environment.ts`. Never hardcode `http://127.0.0.1:8000` in services.
- **Models:** request/response interfaces live in `src/app/models/*.model.ts`, not inside service files. Services import them.
- **Formatting:** Prettier with 100 char width, single quotes, Angular HTML parser (see `.prettierrc`).
- **Indentation:** 2 spaces (see `.editorconfig`).
- **TypeScript:** Strict mode with `strictTemplates`, `strictInjectionParameters`, `noImplicitReturns`.
- **Test generation:** Disabled by default in `angular.json` schematics.

## Key Patterns

### API Endpoints

All API routes are under `/api/`.

```
# Auth
POST /api/auth/register/         — Register; returns access + refresh
POST /api/auth/login/            — Login; returns access + refresh
POST /api/auth/logout/           — Blacklist refresh token
POST /api/auth/refresh/          — Rotate refresh + return new access
GET  /api/auth/me/               — Current user

# Public (read)
GET  /api/health/
GET  /api/categories/

# Items
GET  /api/items/                 — Paginated list ({count, next, previous, results})
                                   query params: search, item_type, category, status, page, page_size
POST /api/items/                 — Create (auth required, multipart for image)
GET  /api/items/me/              — Authenticated user's items (un-paginated)
GET  /api/items/<pk>/            — Detail
PUT/PATCH /api/items/<pk>/       — Owner only; status is server-controlled
DELETE /api/items/<pk>/          — Owner only
POST /api/items/<pk>/mark-resolved/  — Owner only; rejects any pending claims

# Claims
POST /api/claims/                — Create; throttled (claim scope)
GET  /api/claims/me/             — Claims the user submitted
GET  /api/claims/items/          — Claims received on the user's items
POST /api/claims/<pk>/approve/   — Item owner only; flips item to 'claimed', rejects sibling pending claims (atomic)
POST /api/claims/<pk>/reject/    — Item owner only
```

The items list returns a **paginated envelope** (`{count, next, previous, results}`); every other list endpoint returns a bare array.

### Authentication

- JWT-based via `djangorestframework-simplejwt`; access 30 min / refresh 1 day, with rotation and blacklist-after-rotation.
- Frontend: `auth.interceptor.ts` attaches `Authorization: Bearer <token>` and on 401 attempts a **silent refresh + retry** before bouncing the user to `/login`. Tokens live in `localStorage` (XSS-stealable; acceptable for this project).
- `auth.service.logout()` clears tokens unconditionally via `finalize`, so client state is consistent even if the server call fails.
- CORS allowed origins come from `DJANGO_CORS_ALLOWED_ORIGINS` (default: `http://localhost:4200`).

### Image uploads

- `Item.image` is a Django `ImageField` with `upload_to='items/'`.
- Serializer validates: max 5 MB, content-type ∈ {`image/jpeg`, `image/png`, `image/webp`}.
- To clear an existing image on PATCH/PUT, send `clear_image=true` (multipart). The serializer's `update` deletes the file and clears the field; an incoming new image takes precedence.
- Media files are only served by Django when `DEBUG=True` (`backend/urls.py`). Production needs a real storage/CDN.

### Domain models

- `Category(name, description)` — five categories seeded in migration `0002`.
- `Item(title, description, item_type, status, location, date_lost_or_found, image, owner, category, …)`
  - `item_type ∈ {'lost', 'found'}`
  - `status ∈ {'active', 'claimed', 'resolved'}` — managed by server; transitions only via `approve_claim` (active→claimed) and `mark_resolved_view` (active|claimed→resolved).
- `Claim(message, status, claimant, item, …)`
  - `status ∈ {'pending', 'approved', 'rejected'}`
  - DB-level partial unique constraint: only one PENDING claim per (claimant, item).

### Frontend routing

```
/login, /register
/items                  — public-ish list (auth-guarded), paginated
/my-items               — current user's own items
/items/:id              — detail (claim form for non-owners on active items)
/create-item, /edit-item/:id
/my-claims              — claims the user submitted
/profile                — user info + counts; hub linking to /my-items and /my-claims
```

**Naming split** — API endpoints use `<resource>/me/` (`/api/items/me/`, `/api/claims/me/`) because the resource-first form is the REST convention we settled on. Frontend routes use `my-<resource>` (`/my-items`, `/my-claims`) because the possessive reads more naturally in the URL bar. Don't conflate the two.

The navbar shows **Items** + **My Profile** (when logged in). Per-user lists (`/my-items`, `/my-claims`) are no longer linked from the navbar — they live behind the profile page.

### Environment Variables

- Backend: managed via env. See `backend/.env.example`. In `DEBUG` mode, all have safe defaults; outside DEBUG, `DJANGO_SECRET_KEY` is required (boot fails otherwise).
- Frontend: `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod build). Add new vars to both.

## Common Tasks

### To add a new API endpoint

1. Define the serializer in `backend/api/serializers.py` with explicit `fields = [...]`.
2. Create the view (FBV with `@api_view` or CBV extending `APIView`) in `backend/api/views.py`. Wrap multi-row writes in `transaction.atomic()`.
3. Add the URL pattern in `backend/api/urls.py`.
4. Set explicit `permission_classes` (default is `IsAuthenticated`; opt in to `AllowAny` only for public endpoints).
5. Add tests in `backend/api/tests.py` covering happy-path, auth failure, ownership failure, and any state transitions.

### To add a new Django model

1. Define the model in `backend/api/models.py`.
2. Run `python manage.py makemigrations && python manage.py migrate`.
3. Create a `ModelSerializer` in `backend/api/serializers.py` with explicit `fields = [...]`.
4. Optionally register in `backend/api/admin.py`.

### To add a new Angular page

1. Generate: `cd frontend && npx ng generate component pages/<name>`.
2. Add a route in `frontend/src/app/app.routes.ts`, guarded with `authGuard` if it requires login.
3. Create a corresponding service in `frontend/src/app/core/services/` if API calls are needed.
4. Define request/response types in `src/app/models/`, not in the service file.

### To add a new Angular service

1. Generate: `cd frontend && npx ng generate service core/services/<name>`.
2. Import `environment.apiBaseUrl` from `src/environments/environment`.
3. Inject `HttpClient` and define API methods that return `Observable<T>` typed against models in `src/app/models/`.
4. Inject the service into components that need it.

### To format frontend code

```bash
cd frontend && npx prettier --write .
```

## Do NOT

- **Do not hardcode JWT tokens** in frontend code — `auth.interceptor.ts` attaches them.
- **Do not put business logic in Angular components** — keep components thin and delegate to services.
- **Do not use `any` type** in TypeScript — strict mode is enabled.
- **Do not create NgModules** — Angular 21 standalone components exclusively.
- **Do not skip `raise_exception=True`** when calling `serializer.is_valid()`.
- **Do not add external libraries** without clear justification.
- **Do not hardcode `SECRET_KEY`, `DEBUG`, or API base URLs** — use env vars / `environment.ts`.
- **Do not use `fields = '__all__'`** on a serializer — list fields explicitly so new model fields don't leak silently.
- **Do not use `AllowAny` on endpoints that require authentication** — set `permission_classes` explicitly.
- **Do not put `<style>` blocks inside Angular HTML templates** — use a `.css` file with `styleUrl`.
- **Do not hardcode `http://127.0.0.1:8000`** in services — import from `environment.apiBaseUrl`.
- **Do not declare service request/response interfaces inside the service file** — they belong in `src/app/models/`.
- **Do not write multi-row state changes without `transaction.atomic()` + `select_for_update()`** — see `approve_claim` / `mark_resolved_view` for the pattern.
- **Do not commit `db.sqlite3`, `.env`, `backend/media/`, or `node_modules/`** — they are in `.gitignore`.
