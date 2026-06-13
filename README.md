# Branded Survey Builder

A full-stack survey platform that allows users to create branded surveys, share public survey links, and collect responses in a customizable dashboard.

Built as part of the DoCoDeGo SDE Intern Take-Home Assignment.

## Features

### Authentication

* GitHub OAuth sign-in
* Protected dashboard routes
* User-specific survey ownership

### Survey Builder

* Create and manage surveys
* Add, edit, delete, and reorder questions
* Supported question types:

  * Short Text
  * Multiple Choice
  * Rating (1–5)

### Branding

* Custom survey title
* Welcome message
* Primary brand color
* Logo URL support
* Live survey preview

### Public Survey Experience

* Shareable public URLs
* No authentication required for respondents
* Brand-aware survey rendering
* Anonymous response collection

### Responses Dashboard

* View all survey responses
* Dynamic response tables
* Total response count
* Average rating calculation
* Graceful handling of unanswered questions

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* TanStack Router
* Tailwind CSS
* shadcn/ui

### Backend

* Hono
* Cloudflare Workers
* Cloudflare D1

### Tooling

* pnpm Workspace
* Biome
* TypeScript

## Architecture

### Database Schema

Users

* id
* email

Surveys

* id
* user_id
* title
* welcome_message
* primary_color
* logo_url

Questions

* id
* survey_id
* type
* title
* options
* order_index

Responses

* id
* survey_id

Answers

* id
* response_id
* question_id
* value

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the application:

```bash
pnpm dev
```

Frontend:
http://localhost:5173

Backend:
http://localhost:8787

## Quality Checks

Run linting and formatting:

```bash
pnpm check
```

Auto-fix issues:

```bash
pnpm check:fix
```

Run type checking:

```bash
pnpm typecheck
```

Build the frontend:

```bash
pnpm build
```

## Live Demo

Deployed Application:
https://ayush-survey-builder.pages.dev

## Walkthrough Video

Loom Recording:
[Add walkthrough video link here]

## Key Product Decisions

* Focused on delivering a polished survey creation and response experience rather than maximizing feature count.
* Implemented live branding preview to reduce context switching during survey creation.
* Used Cloudflare D1 because survey, question, response, and answer data are relational in nature.
* Limited the MVP to three well-executed question types to prioritize usability and maintainability.

## AI Usage

AI tools were used to accelerate development, UI iteration, debugging, and boilerplate generation. All architectural decisions, database design, implementation details, and final code review were completed by the author.


