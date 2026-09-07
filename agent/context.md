You are working on the FRONTEND.

## Project context

The application is a Hacker News crawler/filtering.

The backend is implemented separately using:

- Java
- Spring Boot
- Spring WebFlux
- PostgreSQL
- R2DBC

The frontend must be implemented using:

- React
- TypeScript
- Vite

The frontend communicates exclusively with the backend REST API.

IMPORTANT:

The UI should be clean, simple, professional, responsive, and easy to explain.

Do not over-engineer the frontend.

---

# Functional requirements

The backend exposes an endpoint that returns the first 30 Hacker News stories after applying one of two filters.

Filter 1:

MORE_THAN_FIVE_WORDS

Meaning:

- title has more than 5 words
- results ordered by number of comments descending

Filter 2:

FIVE_OR_FEWER_WORDS

Meaning:

- title has 5 words or fewer
- results ordered by points descending

The frontend must allow the user to select which filter to apply.

---

# API

Assume the backend endpoint is:

GET /api/stories?filter=MORE_THAN_FIVE_WORDS

or:

GET /api/stories?filter=FIVE_OR_FEWER_WORDS

Example response:

[
{
"number": 1,
"title": "Example Hacker News story",
"points": 123,
"comments": 45
}
]

The frontend should not implement the filtering logic itself.

The backend is the source of truth for:

- word counting
- filtering
- sorting
- scraping

The frontend only displays the returned result.

---

# TypeScript model

Create an explicit type/interface:

type Story = {
number: number;
title: string;
points: number;
comments: number;
};

Create a type for the supported filters:

type StoryFilter =
| 'MORE_THAN_FIVE_WORDS'
| 'FIVE_OR_FEWER_WORDS';

Do not use `any`.

Avoid type assertions unless genuinely necessary.

---

# API layer

Do not call fetch/axios directly inside React components.

Create a dedicated API/service layer.

For example:

src/
├── api/
│ └── storiesApi.ts
├── components/
├── hooks/
├── types/
├── pages/
└── App.tsx

Potential API function:

getStories(filter: StoryFilter): Promise<Story[]>

Keep HTTP concerns isolated from UI components.

Use fetch unless the project already uses another HTTP client.

Do not add Axios merely because it is familiar.

---

# Environment configuration

Use Vite environment variables.

For example:

VITE_API_BASE_URL=http://localhost:8081

The frontend should call:

${VITE_API_BASE_URL}/api/stories

Do not hardcode localhost throughout the code.

Provide:

.env.example

Never commit real environment-specific secrets.

---

# UI requirements

Create a simple dashboard/page.

The UI should contain:

1. Page title
2. Short explanation of the exercise
3. Filter controls
4. Results table/list
5. Loading state
6. Empty state
7. Error state

Example conceptual UI:

---

## Hacker News Crawler

Select filter:

[ More than 5 words ] [ 5 words or fewer ]

Results

# Title Points Comments

---

1 Some story title... 123 45
2 Another story... 98 32

---

The exact visual design is up to you.

Focus on usability and clarity rather than flashy UI.

---

# Filter controls

Provide two clearly labeled controls.

Recommended labels:

"More than 5 words"
"5 words or fewer"

Do not expose internal enum names directly to the user.

Internally map:

"More than 5 words"
→ MORE_THAN_FIVE_WORDS

"5 words or fewer"
→ FIVE_OR_FEWER_WORDS

When the filter changes:

- fetch the new data
- show loading state
- replace the current results
- handle errors

Avoid displaying stale data in a way that could confuse the user.

---

# Results table

Display exactly the relevant story information:

- #
- Title
- Points
- Comments

Do not display unnecessary Hacker News metadata.

The results should be easy to scan.

Make columns sortable ONLY if there is a clear reason.

The backend already defines the required ordering.

Do not re-sort results on the frontend.

The frontend must preserve backend ordering.

---

# Loading behavior

While the API request is running:

- show a loading indicator
- disable filter controls if appropriate
- prevent duplicate requests if possible

The UI should remain responsive.

Avoid complicated state management for this.

React useState/useEffect or a small custom hook is sufficient.

---

# Error handling

If the backend returns an error:

Display a user-friendly message.

Example:

"Unable to load Hacker News stories. Please try again."

Do not display raw backend stack traces.

If the API returns a structured error such as:

{
"response": true/false,
"statusCode": 502,
"message": "Unable to retrieve Hacker News entries",
"result":[...]
"errorDetail": "CRAWLING_ERROR",
}

The frontend may use the message if it is appropriate, but should always have a safe fallback.

Provide a "Retry" action where useful.

---

# Empty state

If the backend returns an empty array:

Display something like:

"No stories match this filter."

Do not treat an empty result as an error.

---

# React architecture

Keep components small.

Potential structure:

src/
├── api/
│ └── storiesApi.ts
│
├── components/
│ ├── FilterSelector.tsx
│ ├── StoryTable.tsx
│ ├── LoadingState.tsx
│ ├── ErrorState.tsx
│ └── EmptyState.tsx
│
├── hooks/
│ └── useStories.ts
│
├── types/
│ └── story.ts
│
├── pages/
│ └── HackerNewsPage.tsx
│
├── App.tsx
└── main.tsx

This is only a suggested structure.

Use the existing project conventions if they differ.

Do not create dozens of components for trivial markup.

---

# State management

Do NOT introduce Redux or another global state library unless there is a real need.

This application has very limited state.

Local React state is sufficient.

Possible state:

- selectedFilter
- stories
- loading
- error

A custom hook such as useStories can encapsulate request lifecycle behavior.

---

# Request behavior

When the page loads:

Select a sensible default filter and fetch the corresponding results.

When the user changes the filter:

Fetch the corresponding endpoint.

Be careful with race conditions.

If a user changes filters quickly, an earlier request should not incorrectly overwrite the latest selection.

Use AbortController where appropriate.

Example conceptual behavior:

Filter A request starts
Filter B request starts
Filter A finishes after B

The UI must still display Filter B's result.

---

# Accessibility

Use semantic HTML.

Examples:

- button/radio controls for filter selection
- table semantics for tabular data
- proper labels
- accessible loading/error messages
- keyboard-friendly controls

Do not rely solely on color to communicate state.

---

# Styling

Use a simple maintainable styling strategy.

If the project already has a styling solution, follow it.

Otherwise, plain CSS or CSS modules are acceptable.

Avoid adding a large UI framework unless there is a clear reason.

The page should:

- work on desktop
- remain usable on smaller screens
- have readable spacing
- have clear visual hierarchy

---

# Testing

Automated frontend tests are desirable.

Use the project's chosen testing stack, preferably:

- Vitest
- React Testing Library

Test behavior rather than implementation details.

Important tests:

## Filter selection

Verify:

- both filters are visible
- selecting a filter triggers the expected API request

## Rendering stories

Given API data:

Verify:

- number is displayed
- title is displayed
- points are displayed
- comments are displayed

## Loading

Verify loading state appears while request is pending.

## Error

Mock an API failure and verify the user sees a friendly error message.

Verify retry behavior if implemented.

## Empty

Mock an empty response and verify the empty state.

## API layer

Test that the correct query parameter is generated for each filter.

---

# Mocking

Do not make frontend tests depend on the real Hacker News website.

The frontend only depends on the backend API.

Mock API requests.

If using MSW (Mock Service Worker), use it if it provides clear value.

Do not introduce excessive infrastructure for a tiny application.

---

# Performance

This application only displays at most 30 stories.

Do not introduce virtualization.

Do not introduce memoization everywhere.

Do not add complex caching unless there is a concrete requirement.

Keep the implementation simple.

---

# Security

Do not use dangerouslySetInnerHTML.

Story titles should be rendered as normal React text.

Do not trust HTML returned from the backend.

Do not expose environment secrets in the frontend.

Remember that Vite VITE\_\* variables are public and bundled into the client.

---

# UX considerations

The user should always understand:

1. What the page does.
2. Which filter is currently selected.
3. What ordering is being applied.
4. Whether data is loading.
5. Whether an error occurred.
6. Whether there are no results.

You may display a small explanatory text below each filter.

For example:

"More than 5 words — ordered by comments"
"5 words or fewer — ordered by points"

This makes the exercise requirements immediately visible to the reviewer.

---

# README

Include frontend documentation explaining:

- technologies
- setup
- environment variables
- how to run
- how to test
- API dependency
- expected backend URL
- architecture
- design decisions

Example:

npm install
npm run dev

Testing:

npm run test

Build:

npm run build

---

# Code quality

Use idiomatic React + TypeScript.

Prioritize:

- strict TypeScript
- no any
- clear interfaces/types
- small components
- separation between API and UI
- reusable components where useful
- meaningful names
- minimal duplication
- predictable state management

Avoid:

- huge components
- business logic inside JSX
- API calls directly inside deeply nested components
- unnecessary global state
- unnecessary dependencies
- over-abstraction

---
