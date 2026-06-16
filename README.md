# Social Platform

Custom-runtime Instagram-inspired social media web application.

## Architecture Decision

The app is a modular monolith with no external database or Redis dependency:

- Next.js web client for SSR-capable UI.
- NestJS API with Auth, Users, Messages, Realtime, and Storage modules.
- Custom JSON-backed store for canonical local state.
- In-process realtime event bus for message fan-out.
- Socket.IO gateway for realtime direct/group conversation events.

The custom store keeps data in memory while the API is running and writes every
mutation to an atomic JSON snapshot. By default the snapshot is saved at
`work/custom-store/social-store.json`; set `CUSTOM_STORE_PATH` to move it.

## Project Structure

```text
apps/
  api/                 NestJS API
    src/auth/          Signup, login, refresh, logout, JWT guard
    src/messages/      Conversation message REST endpoints
    src/realtime/      Socket.IO gateway and custom event bus
    src/storage/       Custom JSON-backed data store
    src/users/         Profile read/update endpoints
  web/                 Next.js web app
    src/app/           App Router pages
    src/components/    Auth UI components
    src/lib/           API client and client state
docs/
  architecture.md      Custom runtime diagrams and data flows
```

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

If `pnpm` is not on PATH, use Corepack:

```bash
corepack pnpm install
```

2. Copy environment values:

```bash
cp .env.example .env
```

3. Run the apps:

```bash
pnpm dev
```

Corepack fallback:

```bash
corepack pnpm dev
```

The web app runs at `http://localhost:3000` and the API runs at
`http://localhost:4000/api/v1`.

## API

### `POST /api/v1/auth/signup`

Creates a user, profile, access token, and refresh token.

```json
{
  "email": "vicky@example.com",
  "username": "vicky",
  "displayName": "Vicky",
  "password": "super-secret-password"
}
```

### `POST /api/v1/auth/login`

Logs in with email and password. Sets `access_token` and `refresh_token` as
HTTP-only cookies.

### `POST /api/v1/auth/refresh`

Rotates the refresh token and issues a new access token.

### `POST /api/v1/auth/logout`

Revokes the active refresh token and clears cookies.

### `GET /api/v1/auth/me`

Returns the authenticated JWT subject.

### `GET /api/v1/users/me`

Returns the authenticated user's profile.

### `PATCH /api/v1/users/me`

Updates display name, bio, website, location, and private account mode.

### `POST /api/v1/messages/conversations/:conversationId/join`

Creates or joins a custom conversation room.

### `GET /api/v1/messages/conversations/:conversationId?limit=50`

Returns the latest messages for a joined conversation.

### `POST /api/v1/messages/conversations/:conversationId`

Stores a message and fan-outs it to connected Socket.IO clients.

```json
{
  "body": "hello",
  "clientMessageId": "optional-client-id"
}
```

## Realtime

Connect Socket.IO to `http://localhost:4000/realtime`.

Authentication can use the existing `access_token` cookie or a token passed as
`auth.token`.

Events:

- `conversation:join` with `{ "conversationId": "room-1" }`
- `message:list` with `{ "conversationId": "room-1", "limit": 50 }`
- `message:send` with `{ "conversationId": "room-1", "body": "hello" }`
- `message:new` is emitted to clients in the conversation room.

## Security Notes

- Passwords are hashed with Argon2.
- Refresh tokens are stored hashed and rotated on every refresh.
- Access and refresh tokens are delivered through HTTP-only cookies.
- Request DTOs use validation and strip unknown fields.
- Helmet and CORS are configured in the API.

Trade-off: the custom store is intentionally simple and single-process. Before
production, add CSRF protection, rate limits, encrypted snapshots, backups, and a
multi-process event log or broker if you run more than one API instance.
