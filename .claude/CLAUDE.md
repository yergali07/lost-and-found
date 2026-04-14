# Lost & Found

## Project Overview

A full-stack web application for posting lost and found items in a university environment, submitting ownership claims, and managing the return of belongings. Built as a course project for Web Development.

**Tech stack:**
- **Frontend:** Angular 21.2 (standalone API), TypeScript 5.9, RxJS 7.8, Vite-based build
- **Backend:** Python, Django 6.0.3, Django REST Framework, SimpleJWT, django-cors-headers
- **Database:** SQLite3 (development)
- **Architecture:** Monorepo with separate `frontend/` and `backend/` directories

## Repository Structure

```
lost-and-found/
├── backend/                # Django REST API
│   ├── api/                # Main Django app (views, serializers, models, urls)
│   │   ├── models.py       # Domain models (currently empty — uses built-in User)
│   │   ├── serializers.py  # DRF serializers (UserSerializer, RegisterSerializer)
│   │   ├── views.py        # Auth views (register, login, logout, me)
│   │   ├── urls.py         # API route definitions
│   │   └── migrations/     # Django migrations
│   ├── backend/            # Django project config
│   │   ├── settings.py     # Django settings (DB, JWT, CORS, installed apps)
│   │   ├── urls.py         # Root URL config (admin + api/)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── manage.py           # Django management entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Angular 21 SPA
│   ├── src/
│   │   ├── main.ts         # Bootstrap entry point
│   │   ├── app/
│   │   │   ├── app.ts          # Root component (standalone, uses signals)
│   │   │   ├── app.config.ts   # Application providers config
│   │   │   ├── app.routes.ts   # Route definitions (currently empty)
│   │   │   ├── app.html        # Root template
│   │   │   ├── core/           # Guards, interceptors, services (scaffolded)
│   │   │   ├── models/         # TypeScript interfaces (scaffolded)
│   │   │   ├── pages/          # Page components (scaffolded)
│   │   │   └── shared/         # Shared components (scaffolded)
│   │   └── index.html
│   ├── angular.json        # Angular CLI project config
│   ├── package.json        # npm dependencies and scripts
│   ├── tsconfig.json       # TypeScript config (strict mode)
│   └── .prettierrc         # Prettier config
└── README.md               # Detailed project spec and requirements
```

**Generated/vendored directories to skip:** `node_modules/`, `frontend/dist/`, `frontend/.angular/`, `backend/venv/`, `__pycache__/`, `db.sqlite3`

## Build & Run

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm start          # or: npx ng serve
```

Frontend runs at `http://localhost:4200`

### Tests

```bash
# Backend (no tests written yet)
cd backend && python manage.py test

# Frontend (Vitest — no tests written yet)
cd frontend && npm test
```

### Build

```bash
cd frontend && npm run build
```

## Code Conventions

### Backend (Python/Django)

- **Naming:** snake_case for functions, variables, file names. PascalCase for classes and serializers.
- **Views:** Mix of function-based views (`@api_view`) and class-based views (`APIView`). FBVs for auth actions, CBVs for resource endpoints.
- **Serializers:** `Serializer` for custom workflows (e.g., `RegisterSerializer`), `ModelSerializer` for DB models (e.g., `UserSerializer`).
- **Imports:** stdlib → Django → DRF → local app imports.
- **Error handling:** DRF's `serializer.is_valid(raise_exception=True)` pattern; manual `Response` with status codes for auth errors.
- **Permissions:** Per-view `permission_classes` decorators/attributes. Default is `AllowAny` in settings.

### Frontend (Angular/TypeScript)

- **Naming:** kebab-case for file names, PascalCase for classes/components, camelCase for variables/methods.
- **Component style:** Standalone components (no NgModules). Angular 21 syntax.
- **State management:** Angular Signals (`signal()`) for reactive state.
- **Formatting:** Prettier with 100 char width, single quotes, Angular HTML parser (see `.prettierrc`).
- **Indentation:** 2 spaces (see `.editorconfig`).
- **TypeScript:** Strict mode with `strictTemplates`, `strictInjectionParameters`, `noImplicitReturns`.
- **Test generation:** Disabled by default in `angular.json` schematics.

## Key Patterns

### API Endpoints

All API routes are under `/api/`. Auth routes under `/api/auth/`:

```
POST /api/auth/register/   — Register new user
POST /api/auth/login/      — Login, returns JWT tokens
POST /api/auth/logout/     — Blacklist refresh token
POST /api/auth/refresh/    — Refresh access token
GET  /api/auth/me/         — Get current user info
```

Routes are defined in `backend/api/urls.py` and included via `backend/backend/urls.py`.

### Authentication

- JWT-based via `djangorestframework-simplejwt`
- Access token lifetime: 30 minutes
- Refresh token lifetime: 1 day
- Token rotation enabled on refresh
- Token blacklist used for logout
- Frontend should attach tokens via an HTTP interceptor (not yet implemented)
- CORS allows `http://localhost:4200`

### Database

- Uses Django's built-in `User` model; no custom models yet
- Planned models: `Category`, `Item`, `Claim` (see `README.md`)
- SQLite3 for development

### Environment Variables

- Not yet externalized; settings are hardcoded in `backend/backend/settings.py`
- `SECRET_KEY` and `DEBUG` should be moved to `.env` for production

## Common Tasks

### To add a new API endpoint

1. Define the serializer in `backend/api/serializers.py`
2. Create the view (FBV with `@api_view` or CBV extending `APIView`) in `backend/api/views.py`
3. Add the URL pattern in `backend/api/urls.py`

### To add a new Django model

1. Define the model in `backend/api/models.py`
2. Run `python manage.py makemigrations && python manage.py migrate`
3. Create a `ModelSerializer` in `backend/api/serializers.py`
4. Optionally register in `backend/api/admin.py`

### To add a new Angular page

1. Generate: `cd frontend && npx ng generate component pages/<name>`
2. Add a route in `frontend/src/app/app.routes.ts`
3. Create a corresponding service in `frontend/src/app/core/services/` if API calls are needed

### To add a new Angular service

1. Generate: `cd frontend && npx ng generate service core/services/<name>`
2. Inject `HttpClient` and define API methods
3. Inject the service into components that need it

### To format frontend code

```bash
cd frontend && npx prettier --write .
```

## Do NOT

- **Do not hardcode JWT tokens** in frontend code — use an HTTP interceptor to attach them automatically.
- **Do not put business logic in Angular components** — use Angular services for API calls and data manipulation. Keep components thin.
- **Do not use `any` type** in TypeScript — strict mode is enabled. Use proper interfaces in `models/`.
- **Do not create NgModules** — this project uses Angular 21 standalone components exclusively.
- **Do not skip `raise_exception=True`** when calling `serializer.is_valid()` — it ensures DRF returns proper 400 responses.
- **Do not add external libraries** without clear justification — the project intentionally keeps dependencies minimal.
- **Do not modify `SECRET_KEY`** in `settings.py` for production use — it should be loaded from environment variables.
- **Do not use `AllowAny` on endpoints that require authentication** — explicitly set `permission_classes = [IsAuthenticated]`.
- **Do not commit `db.sqlite3`, `.env`, or `node_modules/`** — they are in `.gitignore`.
