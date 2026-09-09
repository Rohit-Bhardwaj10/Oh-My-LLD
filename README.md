# LLD Practice Platform

An interactive platform for software engineers to practice Low-Level Design (LLD) interviews. It provides a structured environment to draft requirements, class designs, and extensions, and utilizes the Groq LLM API to provide immediate, expert-level feedback.

## Features
- **Structured Practice**: 3 distinct stages for every problem (Requirements, Design, Extension).
- **Interactive Editor**: Syntax highlighting, character count validation, auto-save drafts, and keyboard shortcuts (`Cmd+S`, `Cmd+Enter`).
- **AI Evaluation**: Immediate, holistic feedback utilizing the `openai/gpt-oss-120b` open-source model via Groq.
- **History Tracking**: View past attempts and scores.

## Architecture
- **Frontend**: Next.js 14 App Router, Tailwind CSS, Lucide React, react-simple-code-editor
- **Backend API**: Express.js
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Auth**: Better Auth

## Prerequisites
- Node.js (v20+)
- PostgreSQL Database (e.g., Neon)
- Groq API Key

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd lld
   ```

2. **Install dependencies:**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install web dependencies
   cd ../web
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="postgresql://user:password@host/db"
   GROQ_API_KEY="gsk_..."
   BETTER_AUTH_SECRET="your-32-character-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Database Setup:**
   ```bash
   cd server
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

## Running the Application

Start the backend (runs on port 4000):
```bash
cd server
npm run dev
```

Start the frontend (runs on port 3000):
```bash
cd web
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Testing
The core domain logic is fully unit-tested independently of the database or external APIs.
```bash
cd server
npm run test
```

## Documentation
- [Research Note](./docs/RESEARCH_NOTE.md)
- [Design Note](./docs/DESIGN_NOTE.md)
- [AI Usage Note](./docs/AI_USAGE.md)
