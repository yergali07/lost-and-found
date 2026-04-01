# Lost & Found

A student-focused web application for posting lost and found items, submitting ownership claims, and helping return belongings to their rightful owners through a simple, secure, and user-friendly platform.

---

## Project Overview

**Lost & Found** is a full-stack web application built with **Angular** on the frontend and **Django REST Framework** on the backend.

The goal of the project is to solve a real problem inside a university environment: students often lose personal belongings, while others may find them but have no convenient, organized way to return them. This platform allows users to:

- create posts for lost items and found items
- browse and search existing posts
- submit ownership claims for found items
- manage the status of items and claims
- authenticate securely and access personalized data

This project is designed as a course project for the **Web Development** discipline and is intentionally structured to satisfy the technical requirements of the assignment while still being realistic enough for future expansion into a real product.

---

## Problem Statement

In universities, lost items are usually handled chaotically through group chats, word of mouth, or physical lost-and-found desks. These methods are slow, unstructured, and unreliable.

This project aims to provide a centralized digital system where:

- students can post lost items
- students or staff can post found items
- owners can claim found items
- posters can review claims and mark items as resolved

The application should be simple enough to build in 2 to 3 weeks by a team of 3 students, but structured well enough to be improved later into a more serious product.

---

## Main Goals

### Functional Goals
- Allow authenticated users to create and manage lost/found item posts
- Allow users to browse and filter items
- Allow users to submit claims for found items
- Allow item owners/posters to approve or reject claims
- Allow users to mark items as resolved

### Technical Goals
- Build a complete client-server application with Angular and Django
- Use JWT-based authentication
- Implement REST API endpoints with Django REST Framework
- Use routing, forms, services, and API communication in Angular
- Build a clean project structure that Cursor/Codex can extend safely

---

## Core Features

### 1. Authentication
- User registration
- User login
- User logout
- JWT access and refresh token flow
- Protected routes and pages on frontend
- HTTP interceptor to attach access token

### 2. Lost/Found Item Management
- Create an item post
- View all item posts
- View item details
- Edit own item post
- Delete own item post
- Mark item as resolved

### 3. Claim System
- Submit a claim for a found item
- Add a message explaining why the item belongs to the claimant
- View all claims related to a user’s item
- Approve a claim
- Reject a claim

### 4. Filtering and Browsing
- Filter by item type: lost or found
- Filter by category
- Search by title or description
- Filter by status: active or resolved

### 5. User Dashboard
- View my posts
- View my claims
- View claims submitted on my items

---

## Target Users

### Primary Users
- Students
- University staff

### Future Users
- School administrations
- Event organizers
- Coworking spaces
- Startup incubators or campus service providers

---

## MVP Scope

The first version should focus only on the essential workflow:

1. user registers or logs in  
2. user creates a lost or found post  
3. another user browses items  
4. another user submits a claim  
5. original poster approves or rejects the claim  
6. item is marked as resolved  

Anything beyond this is optional and should not delay the MVP.

---

## Recommended Tech Stack

### Frontend
- Angular
- TypeScript
- Angular Router
- FormsModule
- HttpClient
- Basic CSS or SCSS

### Backend
- Python
- Django
- Django REST Framework
- Simple JWT for authentication
- django-cors-headers

### Development Tools
- Git and GitHub
- Postman
- Cursor or Codex
- VS Code or PyCharm
- SQLite for development

---

## Proposed System Architecture

### Frontend Responsibilities
- rendering pages and components
- handling forms
- calling backend APIs through Angular services
- storing and attaching JWT tokens
- route guarding
- user-friendly error display

### Backend Responsibilities
- authentication
- business logic
- validation
- database operations
- claim approval and rejection flow
- permission checks

---

## Planned Data Model

At minimum, the backend should contain **4 main models**.

### 1. User
Use Django’s built-in user model or a custom user model if needed.

Suggested fields:
- username
- email
- password
- first_name
- last_name

### 2. Category
Represents item categories.

Suggested fields:
- id
- name
- description (optional)

Examples:
- Electronics
- Documents
- Clothing
- Accessories
- Bags

### 3. Item
Main model representing a lost or found item.

Suggested fields:
- id
- title
- description
- item_type (`lost` or `found`)
- status (`active`, `claimed`, `resolved`)
- location
- date_lost_or_found
- image_url or image field (optional for MVP)
- created_at
- updated_at
- owner -> ForeignKey to User
- category -> ForeignKey to Category

### 4. Claim
Represents a user’s request claiming ownership of a found item.

Suggested fields:
- id
- message
- status (`pending`, `approved`, `rejected`)
- created_at
- claimant -> ForeignKey to User
- item -> ForeignKey to Item

### Optional 5th Model: StatusLog
Can be used to track important actions for future scalability.

Suggested fields:
- id
- item -> ForeignKey to Item
- action
- created_by -> ForeignKey to User
- created_at

---

## Relationships

Minimum required relationships:

- `Item.owner -> User`
- `Item.category -> Category`
- `Claim.claimant -> User`
- `Claim.item -> Item`

This already gives more than the required 2 ForeignKey relations and creates a clean, realistic domain model.

---

## Business Rules

### Item Rules
- only authenticated users can create items
- when an item is created, `owner = request.user`
- only the owner can edit or delete their own item
- only active items can receive claims
- resolved items should not accept new claims

### Claim Rules
- only authenticated users can submit a claim
- a user should not claim their own item
- a user should not submit duplicate pending claims for the same item
- only the item owner can approve or reject claims
- when one claim is approved, other pending claims for the same item may be auto-rejected
- when a claim is approved, item status can become `claimed` or `resolved` depending on design

### Authentication Rules
- protected endpoints require a valid JWT token
- frontend should redirect unauthorized users to login page
- logout should clear stored tokens

---

## Suggested API Design

Base URL example:

```txt
/api/
```

### Authentication Endpoints
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

### Category Endpoints
- `GET /api/categories/`
- `POST /api/categories/` (optional admin-only)
- `GET /api/categories/<id>/`

### Item Endpoints
- `GET /api/items/`
- `POST /api/items/`
- `GET /api/items/<id>/`
- `PUT /api/items/<id>/`
- `PATCH /api/items/<id>/`
- `DELETE /api/items/<id>/`
- `POST /api/items/<id>/mark-resolved/`
- `GET /api/my/items/`

### Claim Endpoints
- `GET /api/claims/`
- `POST /api/claims/`
- `GET /api/claims/<id>/`
- `POST /api/claims/<id>/approve/`
- `POST /api/claims/<id>/reject/`
- `GET /api/my/claims/`
- `GET /api/my/item-claims/`

---

## Serializer Plan

To satisfy the assignment requirements, include both `Serializer` and `ModelSerializer`.

### `serializers.Serializer`
Use for custom workflows:
1. `RegisterSerializer`
2. `ClaimActionSerializer` for approve and reject actions

Possible alternatives:
- `LoginSerializer`
- `MarkResolvedSerializer`

### `serializers.ModelSerializer`
Use for database-backed models:
1. `CategorySerializer`
2. `ItemSerializer`
3. `ClaimSerializer`

Optional:
- separate `ItemListSerializer` and `ItemDetailSerializer`

---

## View Plan

To satisfy the assignment requirements, include both **FBV** and **CBV**.

### Function-Based Views (FBV)
Use for focused custom actions:
1. `login_view`
2. `logout_view`

Optional FBVs:
- `approve_claim`
- `reject_claim`

### Class-Based Views (CBV using APIView)
Use for standard resource handling:
1. `ItemListCreateAPIView`
2. `ItemDetailAPIView`
3. `ClaimListCreateAPIView`
4. `CategoryListAPIView`

---

## Frontend Plan

### Main Pages and Routes

At minimum:

- `/login`
- `/register`
- `/items`
- `/items/:id`
- `/create-item`
- `/my-items`
- `/my-claims`

You only need 3 named routes for the assignment, but building 5 to 7 routes will make the app clearer and more realistic.

### Suggested Angular Components
- `navbar`
- `login`
- `register`
- `item-list`
- `item-card`
- `item-detail`
- `item-form`
- `my-items`
- `claim-form`
- `my-claims`
- `not-found`

### Angular Services
At minimum:
- `auth.service.ts`
- `item.service.ts`
- `claim.service.ts`
- `category.service.ts`

### Suggested Interfaces
- `User`
- `Category`
- `Item`
- `Claim`
- `LoginRequest`
- `RegisterRequest`

---

## Angular Feature Requirements Mapping

This project should explicitly include:

### 1. At least 4 click events that trigger API requests
Examples:
- login button
- create item button
- submit claim button
- approve claim button
- reject claim button
- mark resolved button
- delete item button

### 2. At least 4 form controls using `[(ngModel)]`
Examples in create-item form:
- title
- description
- location
- category
- item type
- date_lost_or_found

### 3. Routing module with named routes
Use separate pages for:
- login
- items list
- item details
- my dashboard

### 4. `@for` and `@if`
Examples:
- use `@for` to render items and claims
- use `@if` to show loading and error states or action buttons conditionally

### 5. Error handling
Show readable messages for:
- failed login
- invalid form submission
- unauthorized actions
- failed API requests

---

## Suggested UI Structure

### Navbar
- project logo or title
- links to items, my items, my claims
- login or logout buttons
- username if logged in

### Item List Page
- search input
- category filter
- type filter: lost or found
- status filter
- list of item cards

### Item Card
- title
- category
- type
- status
- location
- short description
- view details button

### Item Detail Page
- full description
- item metadata
- claim button if allowed
- edit and delete buttons for owner
- claim list for owner

### Create/Edit Item Form
- title
- description
- location
- category
- item type
- date
- submit button

### Claims Section
- pending claims
- approve and reject buttons
- claim status display

---

## Authentication Flow

### Login Flow
1. user submits login form
2. frontend sends credentials to backend
3. backend returns access token and refresh token
4. frontend stores tokens
5. frontend redirects user to item list or dashboard

### Authenticated Requests
- Angular HTTP interceptor attaches `Authorization: Bearer <token>`

### Logout Flow
1. frontend removes tokens
2. optionally notify backend logout endpoint
3. redirect to login page

---

## Permissions Plan

### Public Access
- browse item list
- view item details
- view categories

### Authenticated Access
- create item
- update own item
- delete own item
- submit claim
- see personal dashboard

### Owner-Only Access
- review claims on own item
- approve or reject claims
- mark own item as resolved

---

## Folder Structure

### Frontend
```txt
frontend/
  src/
    app/
      core/
        services/
        interceptors/
        guards/
      models/
      pages/
        login/
        register/
        items/
        item-detail/
        create-item/
        my-items/
        my-claims/
      shared/
        navbar/
        item-card/
        claim-form/
      app.routes.ts
```

### Backend
```txt
backend/
  config/
  apps/
    users/
    categories/
    items/
    claims/
  requirements.txt
  manage.py
```

If you want a simpler Django structure for a student project, one app is also acceptable:

```txt
backend/
  backend/
  api/
    models.py
    serializers.py
    views.py
    urls.py
    permissions.py
  manage.py
```

---

## Development Milestones

### Milestone 1: Project Setup
- create GitHub repo
- create Angular app
- create Django project
- configure CORS
- connect frontend and backend
- prepare README

### Milestone 2: Authentication
- registration
- login
- logout
- JWT integration
- HTTP interceptor

### Milestone 3: Item CRUD
- create item
- list items
- view details
- edit item
- delete item

### Milestone 4: Claim Workflow
- submit claim
- list claims
- approve or reject claim
- mark resolved

### Milestone 5: UI and Validation
- improve styling
- add error messages
- add filters and search
- clean navigation

### Milestone 6: Finalization
- Postman collection
- README updates
- test demo flow
- prepare PDF presentation
- rehearse defense

---

## Team Role Suggestions

### Member 1
Frontend lead
- Angular routing
- login and register UI
- interceptor
- forms
- navigation

### Member 2
Backend lead
- models
- serializers
- authentication
- item CRUD APIs

### Member 3
Integration and workflow lead
- claims logic
- permissions
- frontend and backend integration
- testing
- Postman
- polishing demo flow

All members should still understand both frontend and backend before the defense.

---

## Definition of Done

The MVP is considered complete when:

- users can register and login
- users can create lost and found posts
- users can browse posts
- users can view item details
- users can submit claims
- owners can approve or reject claims
- resolved items are clearly shown
- unauthorized actions are blocked
- Angular routes work correctly
- API errors are handled properly
- the project runs locally on one machine
- the GitHub repository contains README, commit history, and Postman collection

---

## Non-Goals for MVP

These features are interesting, but should not be prioritized before the core system works:

- real-time chat
- push notifications
- email integration
- image upload with cloud storage
- map integration
- admin analytics dashboard
- AI-based item matching
- OCR for documents
- mobile app

---

## Future Improvements

Possible version 2 features:

- image upload
- advanced search
- item matching suggestions
- moderation and reporting
- notification system
- role-based admin dashboard
- campus-specific deployment
- Telegram or email notifications
- geolocation-based lost and found zones
- multilingual support

---

## Local Setup Instructions

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

### Default Local URLs
- Angular: `http://localhost:4200`
- Django API: `http://127.0.0.1:8000`

---

## Environment Notes

Example backend `.env` values:

```env
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

---

## Testing Checklist

Before each demo or merge:
- can user register?
- can user login?
- can user create item?
- can user edit or delete own item?
- can another user submit claim?
- can owner approve or reject claim?
- do protected endpoints reject unauthorized requests?
- do frontend errors display properly?
- does logout work?
- are routes navigable?

---

## Postman Collection

The repository should include a Postman collection that demonstrates:

- register
- login
- token refresh
- get categories
- create item
- list items
- get item detail
- update item
- delete item
- submit claim
- approve claim
- reject claim
- mark resolved

---

## Presentation and Defense Notes

For the final defense, the team should be ready to explain:

- why this problem is useful
- the system architecture
- the database model
- authentication flow
- API design
- frontend routing and forms
- the claim workflow
- how assignment requirements were covered

Recommended demo story:
1. login as user A
2. create a found item
3. login as user B
4. browse items and submit claim
5. login as user A
6. approve claim
7. mark item resolved

This demo is short, clear, and visually shows the full value of the project.

---

## Coding Guidelines for Cursor/Codex

When generating code for this repository, follow these rules:

1. Do not overengineer the MVP.
2. Prefer clear, readable code over advanced patterns.
3. Keep business logic on the backend, not scattered in Angular components.
4. Use Angular services for all API calls.
5. Use interfaces for all API response objects.
6. Enforce permissions on the backend even if buttons are hidden on the frontend.
7. Keep serializers and views simple and explicit.
8. Build the project incrementally and keep the app runnable after every milestone.
9. Avoid adding unnecessary external libraries.
10. Preserve a consistent naming style across frontend and backend.

---

## Assignment Requirement Mapping

This project is intentionally designed to satisfy the course requirements:

### Frontend
- interfaces and services for backend communication
- 4 or more click events triggering API requests
- 4 or more form controls using `[(ngModel)]`
- CSS styling
- routing with 3 or more named routes
- conditional rendering and loops
- JWT authentication with interceptor, login, and logout
- HttpClient service layer
- graceful API error handling

### Backend
- 4 or more models
- 2 or more ForeignKey relations
- 2 or more `Serializer` classes
- 2 or more `ModelSerializer` classes
- 2 or more FBVs
- 2 or more CBVs using APIView
- auth endpoints
- CRUD for Item model
- objects linked to `request.user`
- CORS configuration
- Postman collection

---

## Repository Information

### Team Members
- Student 1: `Add name`
- Student 2: `Add name`
- Student 3: `Add name`

### Repository
- GitHub: `Add repository link here`

---

## Final Notes

This project should be treated as a clean MVP with real-world potential.

The priority is not to build every possible feature, but to build a complete and well-structured core system that:
- works reliably
- is easy to explain
- satisfies the course requirements
- can be extended later into a real campus product
