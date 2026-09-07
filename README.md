# Hacker News Crawler — Frontend

Frontend for the Hacker News crawler/filtering exercise. It displays the first 30
Hacker News stories returned by the backend, filtered and ordered according to a
filter selected by the user.

The frontend does **not** implement any crawling, filtering, word-counting or
sorting logic. It only calls the backend REST API and renders whatever it returns.

## Technologies

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/) (strict mode, no `any`)
- [Vite](https://vite.dev/) — dev server & build tool
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react) — testing
- [ESLint](https://eslint.org/) (`typescript-eslint`, `eslint-plugin-react-hooks`)

No global state library, HTTP client library, UI framework, or CSS framework is
used — the app's state and styling needs are small enough that plain React state
and plain CSS are sufficient.

## Backend dependency

This app is a pure client for the backend REST API (Java / Spring Boot / Spring
WebFlux / PostgreSQL via R2DBC), which defaults to port `8081`. It calls:

```
GET {VITE_API_BASE_URL}/api/stories?filter=MORE_THAN_FIVE_WORDS
GET {VITE_API_BASE_URL}/api/stories?filter=FIVE_OR_FEWER_WORDS
```

`filter` is case-sensitive and must be exactly one of those two values.

Every response — success or error, on any status code — uses the same envelope:

```ts
type ApiResponse<T> = {
  response: boolean;          // true on success, false on any error
  statusCode: number;         // mirrors the actual HTTP status
  message: string;            // short, title-like text
  result: T | null;           // Story[] on success, always null on error
  errorDetail: string | null; // safe, generic, user-facing error description
};
```

The client always parses the JSON body and branches on `response` — never on
`res.ok` — since the backend answers with this same shape even for 400/404/
405/500/502. When `response` is `false`, the UI shows `errorDetail` (falling
back to `message`, then to a generic fallback) — see `src/api/storiesApi.ts`.

The backend is the source of truth for word counting, filtering, sorting and
scraping — the frontend only displays the result in the order it is received.

**CORS**: the backend only allows the origin(s) in its `CORS_ALLOWED_ORIGINS`
env var, which defaults to `http://localhost:5173` (Vite's default port). If
Vite starts on a different port (e.g. 5173 was busy), update that variable on
the backend to match.

## Environment variables

Vite environment variables are used to configure the backend URL instead of
hardcoding it.

| Variable              | Description                          | Example                 |
| ---------------------- | ------------------------------------- | ------------------------ |
| `VITE_API_BASE_URL`    | Base URL of the backend REST API      | `http://localhost:8081` |

Setup:

```bash
cp .env.example .env
```

Then adjust `VITE_API_BASE_URL` to point at your backend instance.

⚠️ Any `VITE_*` variable is bundled into the client and publicly visible in the
browser — never put secrets in it. `.env` (and other `.env.*` files besides
`.env.example`) are git-ignored on purpose.

## Setup & running

Requires Node.js 22+.

```bash
npm install
cp .env.example .env
npm run dev
```

The app is served at the URL Vite prints (default `http://localhost:5173`).

## Testing

```bash
npm run test        # run once (CI-friendly)
npm run test:watch  # watch mode
```

Tests use Vitest with `jsdom` as the DOM environment and React Testing Library
for component-level tests. `@testing-library/jest-dom` matchers are available
globally (see `src/setupTests.ts`). API calls are mocked in tests — nothing
depends on the real Hacker News site or a running backend.

## Build

```bash
npm run build
npm run preview   # serve the production build locally
```

## Linting

```bash
npm run lint
```

## Architecture

```
src/
├── api/          # HTTP calls to the backend (fetch-based), isolated from UI
├── components/   # Small, focused presentational/UI components
├── hooks/        # Custom hooks encapsulating request/state lifecycle
├── types/        # Shared TypeScript types (Story, StoryFilter, ...)
├── pages/        # Page-level components composed from the pieces above
├── App.tsx
└── main.tsx
```

Design decisions:

- **API layer isolation** — components never call `fetch` directly; all HTTP
  concerns live under `src/api`, so UI code stays free of transport details and
  is easy to test with mocked responses.
- **Local state over global state** — the app has very little state
  (selected filter, stories, loading, error), so plain `useState`/`useEffect`
  (wrapped in a small custom hook) is used instead of a state-management
  library.
- **Backend owns ordering** — filtering and sorting are backend
  responsibilities; the frontend renders results in the order received and
  never re-sorts them client-side.
- **No UI framework** — the UI is a single simple dashboard, so plain CSS is
  used instead of pulling in a component/CSS framework.
