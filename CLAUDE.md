# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ResumeAI** — an AI-powered resume optimization platform that uses real job postings to reverse-optimize user resumes, and generates technical review documents for interview preparation.

## Current Status

Active development. The project is a **pnpm monorepo** with three packages:
- `packages/backend` — Nest.js API server
- `packages/frontend` — Vue 3 SPA
- `packages/shared` — Shared TypeScript types and utilities

## Decided Tech Stack (Plan A)

- **Frontend**: Vue 3 + TypeScript + Vite + Element Plus + Pinia + Tiptap (resume editor)
- **Backend**: Nest.js + TypeScript + Prisma ORM + Passport.js (JWT)
- **Database**: PostgreSQL 16 + Redis 7
- **AI**: OpenAI Node SDK (compatible with NVIDIA NIM / DeepSeek / Claude etc.) — BYOK (Bring Your Own Key) architecture
- **File Processing**: pdf-parse + mammoth + Tesseract.js
- **Crawler**: Playwright (Node.js)
- **Deployment**: Docker + Docker Compose + Nginx

## Key Architecture Decisions

- **BYOK Model**: Users bring their own API keys (NVIDIA NIM recommended for free tier). Platform provides minimal default quota. Keys stored with AES-256-GCM encryption.
- **LLM Gateway**: Unified adapter layer (`ai-gateway` module) routing to multiple LLM providers. Most providers use OpenAI-compatible format.
- **Monorepo TypeScript**: Full-stack TypeScript for both frontend and backend to minimize context-switching.
- **Job data**: User self-input of JD text is the P0 core path; crawler is supplementary.

## Core Modules

1. **Job Aggregation** — crawl/import job postings, structured storage, search/filter
2. **Resume Reverse Optimization** — parse resume, match against JD, AI-powered rewriting with diff view
3. **Tech Review Doc Generation** — extract skills from resume, generate interview prep materials (reuses `resume-to-tech-docs` skill)
4. **AI Model & Key Management** — BYOK multi-provider support, key encryption, usage tracking
5. **User Center** — auth, resume version management
6. **Admin Panel** — crawler tasks, template management, analytics

## Development Commands

### Initial Setup
```bash
pnpm install              # Install all dependencies
pnpm db:migrate           # Run Prisma migrations (creates tables)
pnpm db:generate          # Generate Prisma client
```

### Development
```bash
pnpm dev                  # Start both frontend and backend in parallel
pnpm dev:backend          # Start backend only (http://localhost:3000)
pnpm dev:frontend         # Start frontend only (http://localhost:5173)
```

### Database
```bash
pnpm db:migrate           # Create and apply new migration
pnpm db:generate          # Regenerate Prisma client after schema changes
pnpm db:studio            # Open Prisma Studio (database GUI)
```

### Build & Deploy
```bash
pnpm build                # Build all packages
pnpm build:backend        # Build backend only
pnpm build:frontend       # Build frontend only
pnpm docker:up            # Start PostgreSQL + Redis via Docker Compose
pnpm docker:down          # Stop Docker services
pnpm docker:prod          # Build and start full production stack
```

### Code Quality
```bash
pnpm lint                 # Lint all packages
pnpm format               # Format code with Prettier
```

## Architecture Overview

### Backend Module Structure

The Nest.js backend follows a modular architecture with clear separation of concerns:

- **`auth/`** — JWT authentication with Passport.js (LocalStrategy + JwtStrategy). Access tokens (15min) + refresh tokens (7d, stored in Redis).
- **`user/`** — User CRUD operations.
- **`resume/`** — Resume management with file upload support. Contains `parser/` submodule with format-specific parsers (PDF via pdf-parse, DOCX via mammoth, images via Tesseract.js OCR).
- **`job/`** — Job description (JD) management. MVP supports manual text input; schema includes `source` enum for future crawler integration.
- **`api-key/`** — BYOK (Bring Your Own Key) management. API keys encrypted with AES-256-GCM (encryptedKey + keyIv + keyTag stored separately). Includes `encryption.service.ts` for crypto operations.
- **`ai-gateway/`** — **Critical module**: Unified LLM provider abstraction layer. Routes requests to OpenAI-compatible providers (NVIDIA NIM, DeepSeek, OpenAI) or Claude based on user's API key configuration. Contains:
  - `providers/` — `BaseLlmProvider` interface with `OpenAiCompatibleProvider` and `ClaudeProvider` implementations
  - `prompts/` — Prompt templates for resume optimization and review doc generation
  - Supports both streaming (SSE) and non-streaming completions
- **`optimization/`** — Core resume optimization workflow. Orchestrates: load resume + JD → call ai-gateway → compute diff → save ResumeVersion. Handles SSE streaming for real-time AI response display.
- **`review-doc/`** — Generates technical interview prep documents from finalized resumes using AI.
- **`prisma/`** — Database service wrapper (PrismaService).

### Data Model (Prisma)

Key relationships:
- `User` 1:N `Resume` 1:N `ResumeVersion` (each optimization creates a new version)
- `User` 1:N `Job` (saved JDs)
- `User` 1:N `ApiKey` (multiple providers supported per user)
- `Resume` 1:N `ReviewDoc`
- `ResumeVersion` N:1 `Job` (tracks which JD was used for optimization)

Important fields:
- `Resume.parsedData` (JSON) — Structured resume content after parsing (sections, skills, experience)
- `ResumeVersion.diffData` (JSON) — Pre-computed diff for quick rendering
- `ApiKey.encryptedKey/keyIv/keyTag` — AES-256-GCM encryption components
- `ApiKey.baseUrl` — Custom endpoint for OpenAI-compatible providers

### Frontend Architecture

Vue 3 SPA with:
- **Router** — Auth guard redirects unauthenticated users to `/login`. Protected routes under `DefaultLayout`.
- **Pinia stores** — `auth`, `resume`, `job`, `apiKey` stores manage state and API calls.
- **API client** (`api/client.ts`) — Axios instance with interceptors for JWT token injection and automatic refresh on 401.
- **Key views**:
  - `OptimizationView.vue` — Core UX: select resume + JD, trigger optimization, display streaming AI response
  - `DiffView.vue` — Side-by-side comparison with word-level diff highlighting
  - `ApiKeyView.vue` — BYOK key management interface

### Security Notes

- **API keys never stored in plaintext**. Encryption master key (`ENCRYPTION_KEY` env var) must be 64-char hex (32 bytes).
- **JWT secrets** (`JWT_SECRET`, `JWT_REFRESH_SECRET`) must be changed in production.
- **Refresh tokens** stored in Redis with TTL for automatic expiration.
- All API endpoints (except auth) protected by `JwtAuthGuard`.

## Document Language

All product/technical documentation is written in Chinese (Simplified). Code and comments should be in English.
