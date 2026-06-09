# Spur - AI Live Chat Agent

A production-quality take-home assignment for a mini customer support chat app. Users chat with an AI support agent for NovaCart, a small e-commerce store, and conversations are persisted by session.

## Folder Structure

```text
.
├── backend
│   ├── prisma
│   │   └── schema.prisma
│   ├── src
│   │   ├── controllers
│   │   │   └── chat.controller.ts
│   │   ├── lib
│   │   │   └── prisma.ts
│   │   ├── middleware
│   │   │   └── error.middleware.ts
│   │   ├── routes
│   │   │   └── chat.routes.ts
│   │   ├── services
│   │   │   ├── chat.service.ts
│   │   │   └── llm.service.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend
│   ├── src
│   │   ├── api
│   │   │   └── chatApi.ts
│   │   ├── components
│   │   │   ├── ChatWidget.tsx
│   │   │   └── MessageBubble.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── types.ts
│   ├── .env.example
│   ├── index.html
│   ├── netlify.toml
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json
│   └── vite.config.ts
├── render.yaml
└── README.md
```

## Features

- Chat UI with scrollable message history, distinct user and AI bubbles, input box, send button, and Enter-to-send.
- Loading state with disabled send button and `Agent is typing...` feedback.
- Auto-scrolls to the newest message.
- Persists `sessionId` in `localStorage`.
- Reload-safe conversation history from `GET /chat/history/:sessionId`.
- SQLite persistence through Prisma ORM.
- Gemini-powered support replies with NovaCart FAQ grounding.
- Defensive validation, LLM try/catch, and friendly fallback responses.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, lucide-react
- Backend: Node.js, Express, TypeScript
- Database: SQLite with Prisma ORM
- LLM: Gemini API
- Deployment targets: Vercel or Netlify for frontend, Render for backend

## Architecture Overview

The frontend owns the chat experience and stores only the current `sessionId`. The backend owns validation, persistence, and LLM orchestration.

Request flow:

1. User sends a message from `ChatWidget`.
2. Frontend calls `POST /chat/message`.
3. Backend validates input and creates or resumes a Prisma `Conversation`.
4. Backend saves the user message.
5. Backend sends the last 8 historical messages plus the new user message to Gemini.
6. Backend saves the AI reply and returns `{ reply, sessionId }`.

## Backend Setup

Use Node.js 20 or 22 LTS. This project includes `.node-version` with Node 22 for local and deployment parity.

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

The backend runs on `http://localhost:4000` by default.

## Frontend Setup

Use Node.js 20 or 22 LTS.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Prisma Commands

From `/backend`:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:studio
npm run prisma:deploy
```

There is no seed required for this assignment because conversations are created on demand.

## Environment Variables

Backend `.env`:

```bash
PORT=4000
HOST="127.0.0.1"
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
FRONTEND_ORIGIN="http://localhost:5173"
```

Frontend `.env`:

```bash
VITE_API_BASE_URL="http://localhost:4000"
```

Never commit real secrets. Only `.env.example` files are included.

## API Documentation

### POST `/chat/message`

Request:

```json
{
  "message": "How long does shipping take?",
  "sessionId": "optional-existing-session-id"
}
```

Response:

```json
{
  "reply": "Standard delivery takes 3-5 business days. Express delivery takes 1-2 business days.",
  "sessionId": "conversation-id"
}
```

Validation:

- `message` is required.
- Empty messages are rejected.
- Messages over 1000 characters are rejected.

### GET `/chat/history/:sessionId`

Response:

```json
{
  "sessionId": "conversation-id",
  "messages": [
    {
      "id": "message-id",
      "conversationId": "conversation-id",
      "sender": "user",
      "text": "Do you ship internationally?",
      "createdAt": "2026-06-09T08:30:00.000Z"
    }
  ]
}
```

## LLM Notes

LLM behavior is isolated in `backend/src/services/llm.service.ts`.

The service uses Gemini through `GEMINI_API_KEY`. The system prompt instructs the model to act as a concise NovaCart support agent and use the provided FAQ for shipping, returns, refunds, support hours, payments, and tracking. The backend includes the last 8 previous messages as context, then appends the latest user message.

If no LLM key is configured, or if the provider request fails, the service returns a friendly fallback reply instead of crashing the API.

## Error Handling Notes

- Controllers validate request bodies with Zod.
- Backend errors pass through centralized Express error middleware.
- Bad inputs return 400 responses.
- Unknown routes return 404 responses.
- LLM failures are logged server-side and converted into a support-friendly response.
- Express JSON payloads are size-limited to reduce abuse risk.

## Deployment

### Backend on Render

This repo includes `render.yaml` for a Render web service.

Set these Render environment variables:

- `GEMINI_API_KEY`
- `FRONTEND_ORIGIN`
- `DATABASE_URL` if not using the included persistent disk default
- `GEMINI_MODEL` optionally

For SQLite on Render, use a persistent disk. The included blueprint stores the database at `/var/data/spur.db`.

### Frontend on Vercel

Set the project root to `frontend`.

Build settings:

```text
Build command: npm run build
Output directory: dist
```

Environment variable:

```bash
VITE_API_BASE_URL="https://your-render-backend.onrender.com"
```

### Frontend on Netlify

Set the base directory to `frontend`. The included `frontend/netlify.toml` configures build and SPA routing.

Environment variable:

```bash
VITE_API_BASE_URL="https://your-render-backend.onrender.com"
```

## Trade-offs

- SQLite is ideal for a compact assignment and simple deployment, but a managed Postgres database would be better for higher write concurrency.
- Session identity is stored in `localStorage`, which is simple and frictionless but not authenticated.
- The UI uses optimistic user messages for responsiveness, then appends the server reply. A production app might reconcile optimistic message IDs with persisted server messages.
- The backend accepts caller-provided `sessionId` to resume conversations. In a real app, this should be tied to authentication or signed session tokens.

## If I Had More Time

- Add streaming responses for a more natural live-agent feel.
- Add authentication and signed session ownership.
- Add rate limiting and request logging.
- Add automated tests for controllers, services, and UI flows.
- Add human handoff workflow with ticket creation.
- Add admin tooling for conversation review and FAQ management.
