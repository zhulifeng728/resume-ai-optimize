# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ResumeAI** — an AI-powered resume optimization platform that uses real job postings to reverse-optimize user resumes, and generates technical review documents for interview preparation.

## Current Status

Pre-development / documentation phase. No code has been written yet. The project contains:
- `需求文档-优化版.md` — Product requirements document (PRD v1.0)
- `技术方案文档.md` — Technical architecture document with three proposals (A/B/C); **Plan A (Vue 3 + Nest.js) was selected**

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

## Document Language

All product/technical documentation is written in Chinese (Simplified). Code and comments should be in English.
