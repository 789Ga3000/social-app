# Architecture

## Custom Runtime Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, Zustand.
- Backend: NestJS with TypeScript as a modular monolith.
- Storage: custom JSON snapshot store with in-memory indexes and atomic writes.
- Realtime: Socket.IO gateway backed by a custom in-process event bus.
- Auth: JWT access tokens, hashed refresh-token records, HTTP-only cookies.
- Media/search/jobs: future modules can use the same storage boundary first, then move to stronger services only when needed.

This build intentionally avoids PostgreSQL, Redis, Prisma, and migrations. The
API owns persistence through `CustomStoreService`, so app modules never talk to a
third-party database client.

## High-Level Architecture

```mermaid
flowchart LR
  Web[Next.js Web App] --> API[NestJS API]
  WS[Socket.IO Client] --> RT[Realtime Gateway]

  API --> Auth[Auth Module]
  API --> Users[Users Module]
  API --> Messages[Messages Module]
  RT --> Messages

  Auth --> Store[CustomStoreService]
  Users --> Store
  Messages --> Store
  Messages --> Bus[RealtimeBusService]
  Bus --> RT
  Store --> File[(JSON Snapshot)]
```

## Storage Model

The custom store keeps one versioned snapshot:

```text
{
  version,
  users,
  profiles,
  refreshTokens,
  conversations,
  conversationMembers,
  messages
}
```

Every mutation is serialized through a write chain, applied in memory, then
persisted by writing a temporary JSON file and renaming it over the snapshot.

Default path:

```text
work/custom-store/social-store.json
```

Override with:

```text
CUSTOM_STORE_PATH=/absolute/path/to/social-store.json
```

## Auth Flow

```mermaid
sequenceDiagram
  participant Client
  participant Auth as AuthController
  participant Store as CustomStoreService
  participant JWT as JwtService

  Client->>Auth: POST /auth/signup
  Auth->>Store: createUserWithProfile
  Store-->>Auth: user
  Auth->>JWT: sign access token
  Auth->>JWT: sign refresh token
  Auth->>Store: createRefreshToken(hash)
  Auth-->>Client: HTTP-only cookies + public user
```

## Refresh Rotation

```mermaid
sequenceDiagram
  participant Client
  participant Auth
  participant Store

  Client->>Auth: POST /auth/refresh
  Auth->>Auth: verify refresh JWT
  Auth->>Store: findRefreshTokenWithUser(jti)
  Auth->>Auth: verify stored hash and expiry
  Auth->>Store: createRefreshToken(next)
  Auth->>Store: revokeRefreshToken(previous)
  Auth-->>Client: rotated cookies
```

## Realtime Direct Message Flow

```mermaid
sequenceDiagram
  participant Sender
  participant WS as Realtime Gateway
  participant Msg as MessagesService
  participant Store as CustomStoreService
  participant Bus as RealtimeBusService
  participant Recipient

  Sender->>WS: message:send
  WS->>Msg: sendMessage
  Msg->>Store: joinConversation
  Msg->>Store: createMessage
  Msg->>Bus: publishMessageCreated
  Bus->>WS: message event
  WS-->>Recipient: message:new
  WS-->>Sender: ack with stored message
```

## Module Boundaries

- `AuthModule`: passwords, JWTs, refresh-token rotation.
- `UsersModule`: public profile read/update.
- `MessagesModule`: conversation membership, message persistence, HTTP message APIs.
- `RealtimeModule`: Socket.IO auth, room joins, message event handling.
- `StorageModule`: custom durable state and all write serialization.

## Trade-Offs

This custom runtime is simple to run and inspect, but it is single-process by
design. To harden it for serious production traffic, add snapshot encryption,
backup/restore, compaction, replayable append logs, process-level file locks,
observability, and a multi-node event distribution strategy.
