# Little Scholar Backend

Production-ready Node.js backend for the Little Scholar iOS app. The iOS app keeps child profiles, exams, attempts, results, and performance history locally with SwiftData. This backend handles authentication, protects AI access behind the server, generates AI exam papers, tracks usage, and leaves room for subscriptions later.

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

3. Update `.env` with a strong `JWT_SECRET`, `GOOGLE_CLOUD_PROJECT`, and `GOOGLE_CLOUD_LOCATION`.

4. Configure Google Application Default Credentials for local Vertex AI calls:

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

5. Make sure the Vertex AI API is enabled for the selected Google Cloud project.

6. Start PostgreSQL:

```bash
docker compose up -d
```

7. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

8. Optional seed:

```bash
npm run prisma:seed
```

9. Start development server:

```bash
npm run dev
```

The API runs at `http://localhost:3000` by default.

## Railway Deployment Notes

Railway will not have your local `gcloud auth application-default login` credentials. For Railway, create a Google Cloud service account with permission to call Vertex AI, download its JSON key, and provide it to the service through an environment variable.

Recommended Railway variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your-supabase-pooled-postgres-url
DIRECT_URL=your-supabase-direct-postgres-url
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
AI_PROVIDER=gemini
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash-lite
GOOGLE_APPLICATION_CREDENTIALS_BASE64=base64-encoded-service-account-json
CORS_ORIGIN=your-ios-or-admin-client-origin
```

To create the base64 value locally:

```bash
base64 -i service-account.json
```

Use the printed value as `GOOGLE_APPLICATION_CREDENTIALS_BASE64` in Railway. The app writes it to a temporary credentials file at runtime and points Google auth to it. For local development, you can keep using `gcloud auth application-default login` and leave `GOOGLE_APPLICATION_CREDENTIALS_BASE64` empty.

Required Google Cloud setup:

- Enable Vertex AI API.
- Grant the Railway service account `Vertex AI User` or a narrower equivalent role.
- Keep the service account JSON only in Railway environment variables, never in Git.

## Supabase Database

Supabase works as the production database because it provides standard PostgreSQL. Use Supabase for the database only; authentication remains in this backend with JWT and bcrypt.

Use two connection strings:

- `DATABASE_URL`: Supabase pooled connection string for the running API.
- `DIRECT_URL`: Supabase direct connection string for Prisma migrations.

For local development you can keep using Docker Postgres, or point both values at Supabase. For Railway deployment, set both values in Railway environment variables.

Run migrations from your machine or a trusted CI environment:

```bash
npm run prisma:migrate
```

If you run migrations against Supabase, make sure `.env` contains the Supabase `DATABASE_URL` and `DIRECT_URL` first.

## Environment Variables

| Name                                    | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `PORT`                                  | HTTP server port                                                        |
| `DATABASE_URL`                          | Runtime PostgreSQL connection string, Supabase pooled URL in production |
| `DIRECT_URL`                            | Direct PostgreSQL connection string for Prisma migrations               |
| `JWT_SECRET`                            | Secret for signing access tokens, minimum 32 chars                      |
| `JWT_EXPIRES_IN`                        | JWT expiry, for example `7d`                                            |
| `AI_PROVIDER`                           | Currently `gemini`                                                      |
| `GOOGLE_CLOUD_PROJECT`                  | Google Cloud project for Vertex AI                                      |
| `GOOGLE_CLOUD_LOCATION`                 | Vertex AI location, for example `us-central1`                           |
| `GEMINI_MODEL`                          | Vertex Gemini model, defaults to `gemini-2.5-flash-lite`                |
| `GOOGLE_APPLICATION_CREDENTIALS_BASE64` | Base64 service account JSON for Railway/deployments                     |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON`   | Raw service account JSON fallback                                       |
| `CORS_ORIGIN`                           | Allowed client origin or `*`                                            |

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

The controller calls `examService`, which depends on the `AIProvider` interface. `GeminiProvider` is the current implementation and uses Vertex AI with Google Application Default Credentials locally. In production, deploy the backend with a Cloud Run service account that has permission to call Vertex AI. OpenAI or Claude providers can be added under `src/services/ai` and selected from `createAIProvider` without changing controller logic.
