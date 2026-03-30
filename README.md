# CodeArena

CodeArena is a full-stack coding practice platform focused on real problem solving, fast feedback, and a clean competitive programming workflow.

## Live Demo

**Try it here:** [https://code-arena-army.vercel.app/](https://code-arena-army.vercel.app/)

## What this project does

- Lets users solve DSA problems with a Monaco-based in-browser editor.
- Executes and validates submissions against hidden test cases.
- Supports AI-guided help for problem understanding and debugging.
- Tracks solved problems, submissions, and leaderboard ranking.
- Provides an admin workflow for creating/updating problems and managing video solutions.

## Key architecture note (important)

This project now uses **Judge1 for all languages**.  
There is **no Judge0 execution path** in the current implementation.

## Feature summary

- Authentication with JWT + HTTP-only cookies + role-based access (`user`, `admin`)
- Problem lifecycle: create, update, delete, fetch, and solve tracking
- Run code on visible cases and submit on hidden cases
- Submission cooldown (Redis-backed, 10s)
- Weighted leaderboard (difficulty-aware scoring)
- AI chat assistant (Google Gemini) scoped to the current problem
- Video solution management via Cloudinary signed uploads
- Profile dashboard with activity-focused user data

## Tech stack

### Backend (`CodeArena_Backend`)

- Node.js + Express
- MongoDB (Mongoose)
- Redis
- Axios (Judge1 integration)
- JWT + bcrypt
- Google GenAI SDK (`@google/genai`)
- Cloudinary

### Frontend (`CodeArena_Frontend`)

- React + Vite
- Redux Toolkit
- React Router
- Monaco Editor (`@monaco-editor/react`)
- Tailwind CSS + DaisyUI
- React Hook Form + Zod

## Monorepo structure

```text
CodeArena/
├── CodeArena_Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── index.js
│   └── package.json
├── CodeArena_Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Backend API surface (high-level)

- `/user` — register, login, logout, auth check, profile update
- `/problem` — create/update/delete problems, fetch lists/details, solved/submitted views
- `/submission` — run and submit code
- `/leaderboard` — ranked users
- `/ai` — contextual AI help for current problem
- `/video` — admin video upload metadata/signature management

## Local setup

### 1) Clone and install

```bash
git clone <your-repo-url>
cd CodeArena
cd CodeArena_Backend && npm install
cd ..\CodeArena_Frontend && npm install
```

### 2) Configure environment

Create `.env` for backend with keys similar to:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_CONNECT_STRING=...
REDIS_HOST=...
REDIS_PASS=...
JWT_KEY=...

JUDGE1_HOST=...
GEMINI_KEY=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Create frontend `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 3) Run

Backend:

```bash
cd CodeArena_Backend
npm start
```

Frontend:

```bash
cd CodeArena_Frontend
npm run dev
```

## Rough notes and build journey

The repository includes `Rough-Notes-During-Building-CodeArena.pdf`, which captures rough sketches and early thinking used during development.  
This README is the clean, production-facing source of truth for contributors and readers.

## Current status

- Active full-stack implementation with auth, problem solving, AI support, and leaderboard
- Judge1-only execution model in place
- Demo deployed and publicly accessible

---