# Little Scholar Backend

Production-ready Node.js backend for the Little Scholar iOS app. The iOS app keeps child profiles, exams, attempts, results, and performance history locally with SwiftData. This backend handles authentication, protects the LLM API key, generates AI exam papers, tracks usage, and leaves room for subscriptions later.

Firebase is not used.

## Stack

- Node.js, TypeScript, Express
- Prisma ORM, PostgreSQL
- JWT authentication, bcrypt password hashing
- Zod request and AI-response validation
- Gemini provider behind an AI provider abstraction
- Docker Compose for local PostgreSQL
- ESLint, Prettier, ts-node-dev

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` with a strong `JWT_SECRET` and your `GEMINI_API_KEY`.

4. Start PostgreSQL:

```bash
docker compose up -d
```

5. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Optional seed:

```bash
npm run prisma:seed
```

7. Start development server:

```bash
npm run dev
```

The API runs at `http://localhost:3000` by default.

## Environment Variables

| Name             | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `PORT`           | HTTP server port                                   |
| `DATABASE_URL`   | PostgreSQL connection string                       |
| `JWT_SECRET`     | Secret for signing access tokens, minimum 32 chars |
| `JWT_EXPIRES_IN` | JWT expiry, for example `7d`                       |
| `GEMINI_API_KEY` | Server-side Gemini API key                         |
| `AI_PROVIDER`    | Currently `gemini`                                 |
| `CORS_ORIGIN`    | Allowed client origin or `*`                       |

## Scripts

```bash
npm run dev
npm run build
npm start
npm run prisma:migrate
npm run prisma:generate
npm run prisma:studio
npm run lint
npm run format
```

## API Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": {}
  }
}
```

## API Documentation

The OpenAPI spec is available in [`openapi.yaml`](./openapi.yaml).

### Health Check

`GET /api/health`

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "little-scholar-be",
    "timestamp": "2026-05-28T00:00:00.000Z"
  }
}
```

### Register

`POST /api/auth/register`

Request:

```json
{
  "email": "parent@example.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "parent@example.com",
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z"
    },
    "accessToken": "jwt-token"
  }
}
```

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "parent@example.com",
  "password": "Password123!"
}
```

Response shape matches register.

### Current User

`GET /api/auth/me`

Headers:

```http
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "parent@example.com",
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z"
    }
  }
}
```

### Generate Exam

`POST /api/exams/generate`

Headers:

```http
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "grade": "UKG",
  "subject": "Maths",
  "difficulty": "Easy",
  "questionCount": 10
}
```

Supported values:

- Grades: `LKG`, `UKG`, `Grade 1`
- Subjects: `English`, `Maths`, `Hindi`, `EVS`, `GK`
- Difficulty: `Easy`, `Medium`, `Hard`
- Question types: `mcq`, `true_false`, `fill_blank`, `match_following`

Response:

```json
{
  "success": true,
  "data": {
    "examId": "generated-uuid",
    "grade": "UKG",
    "subject": "Maths",
    "difficulty": "Easy",
    "questionCount": 10,
    "questions": [
      {
        "id": "q1",
        "type": "mcq",
        "question": "What comes after 5?",
        "options": ["4", "6", "7", "3"],
        "correctAnswer": "6",
        "acceptableAnswers": ["6", "six"],
        "explanation": "6 comes after 5.",
        "topic": "Number sequence",
        "marks": 1
      }
    ]
  }
}
```

The backend does not implement `/api/exams/evaluate` in the MVP. Generated questions include correct answers so the iOS app can evaluate attempts locally.

## Database

Models:

- `User`: authentication account with unique email and bcrypt hash
- `UsageLog`: per-user AI usage tracking by provider, token count, and operation type

Run migrations with:

```bash
npm run prisma:migrate
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

## AI Provider Abstraction

The controller calls `examService`, which depends on the `AIProvider` interface. `GeminiProvider` is the current implementation. OpenAI or Claude providers can be added under `src/services/ai` and selected from `createAIProvider` without changing controller logic.
