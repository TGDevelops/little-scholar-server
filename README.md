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

Railway will not have your local `gcloud auth application-default login` credentials. For Railway, create a Google Cloud service account with permission to call Vertex AI and connect to Cloud SQL, download its JSON key, and provide it to the service through an environment variable.

Recommended Railway variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@127.0.0.1:5432/DB_NAME?schema=public
DIRECT_URL=postgresql://DB_USER:DB_PASSWORD@127.0.0.1:5432/DB_NAME?schema=public
CLOUD_SQL_INSTANCE_CONNECTION_NAME=your-project-id:your-region:your-instance-name
CLOUD_SQL_PROXY_PORT=5432
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
base64 -i service-account.json | tr -d '\n'
```

Use the printed single-line value as `GOOGLE_APPLICATION_CREDENTIALS_BASE64` in Railway. The app writes it to a temporary credentials file at runtime and points Google auth to it. For local development, you can keep using `gcloud auth application-default login` and leave `GOOGLE_APPLICATION_CREDENTIALS_BASE64` empty.

Required Google Cloud setup:

- Enable Vertex AI API.
- Enable Cloud SQL Admin API.
- Grant the Railway service account `Vertex AI User` or a narrower equivalent role.
- Grant the Railway service account `Cloud SQL Client` or a narrower equivalent role.
- Keep the service account JSON only in Railway environment variables, never in Git.

## Google Cloud SQL Database

Cloud SQL works as the production database because it provides standard PostgreSQL. Authentication remains in this backend with JWT and bcrypt.

The Docker image starts Cloud SQL Auth Proxy when `CLOUD_SQL_INSTANCE_CONNECTION_NAME` is present. In that mode, Prisma connects to the proxy inside the container:

```env
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@127.0.0.1:5432/DB_NAME?schema=public
DIRECT_URL=postgresql://DB_USER:DB_PASSWORD@127.0.0.1:5432/DB_NAME?schema=public
CLOUD_SQL_INSTANCE_CONNECTION_NAME=your-project-id:your-region:your-instance-name
```

The Cloud SQL Auth Proxy authenticates with `GOOGLE_APPLICATION_CREDENTIALS_BASE64`, opens `127.0.0.1:5432`, and forwards that local TCP connection to the Cloud SQL instance. The service account must have Cloud SQL Client access, and Cloud SQL Admin API must be enabled.

If you choose a direct public-IP connection instead of the proxy, set `DATABASE_URL` and `DIRECT_URL` to the Cloud SQL public IP with `sslmode=require`, and make sure Cloud SQL authorized networks allow Railway egress:

```env
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@CLOUD_SQL_PUBLIC_IP:5432/DB_NAME?schema=public&sslmode=require
DIRECT_URL=postgresql://DB_USER:DB_PASSWORD@CLOUD_SQL_PUBLIC_IP:5432/DB_NAME?schema=public&sslmode=require
```

For local development you can keep using Docker Postgres, or point both values at Cloud SQL.

Run migrations from your machine or a trusted CI environment:

```bash
npm run prisma:migrate
```

For production-style migration execution against an already-created Cloud SQL database, use:

```bash
npm run prisma:migrate:deploy
```

If you run migrations against Cloud SQL from your machine, start Cloud SQL Auth Proxy locally first or use a direct SSL connection string, then make sure `.env` contains the Cloud SQL `DATABASE_URL` and `DIRECT_URL`.

## Environment Variables

| Name                                    | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `PORT`                                  | HTTP server port                                                        |
| `DATABASE_URL`                          | Runtime PostgreSQL connection string                                    |
| `DIRECT_URL`                            | Direct PostgreSQL connection string for Prisma migrations               |
| `CLOUD_SQL_INSTANCE_CONNECTION_NAME`    | Cloud SQL instance connection name, enables Cloud SQL Auth Proxy        |
| `CLOUD_SQL_PROXY_PORT`                  | Local proxy port inside the container, defaults to `5432`               |
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
npm run prisma:migrate:deploy
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

Swagger UI is available at `http://localhost:3000/docs` when the server is running.

The raw OpenAPI spec is available at `http://localhost:3000/openapi.yaml` and in [`openapi.yaml`](./openapi.yaml).

If your local `.env` points `DATABASE_URL` at Cloud SQL through `127.0.0.1:5432`, start Cloud SQL Auth Proxy before using Swagger:

```bash
npm run cloud-sql-proxy
```

Then start the API in another terminal:

```bash
npm run dev
```

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
  "name": "Tejesh Gangari",
  "email": "parent@example.com",
  "city": "Hyderabad",
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
      "name": "Tejesh Gangari",
      "email": "parent@example.com",
      "city": "Hyderabad",
      "plan": "FREE",
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
      "name": "Tejesh Gangari",
      "email": "parent@example.com",
      "city": "Hyderabad",
      "plan": "FREE",
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

- Grades: `Nursery`, `LKG`, `UKG`, `Grade 1`
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
    ],
    "usage": {
      "tokensUsed": 900,
      "remainingTokens": 9100,
      "monthlyLimit": 10000
    }
  }
}
```

If the estimated request would exceed the user monthly quota, the API returns `429` with `Monthly AI usage limit reached.`.

### Generate AI Insight

`POST /api/analytics/generate`

Headers:

```http
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "child": {
    "age": 6,
    "grade": "Grade 1"
  },
  "period": "all_time",
  "summary": {
    "totalExams": 8,
    "averageScore": 76,
    "bestScore": 90,
    "subjects": [
      {
        "subject": "Maths",
        "averageScore": 70,
        "totalExams": 4,
        "strongTopics": ["Counting", "Addition"],
        "weakTopics": ["Subtraction", "Number sequence"]
      }
    ],
    "recentTrend": [
      {
        "subject": "Maths",
        "percentage": 60,
        "attemptedAt": "2026-06-01T10:00:00Z"
      }
    ]
  }
}
```

The analytics API accepts only summarized learning data. It rejects extra fields such as child name, city, full question text, and answer history, does not persist the payload, and logs only token usage metadata.

Response:

```json
{
  "success": true,
  "data": {
    "insightId": "generated-uuid",
    "summary": "Short parent-friendly learning summary.",
    "strengths": ["Counting"],
    "needsPractice": ["Subtraction"],
    "recommendations": ["Generate more easy subtraction exams."],
    "suggestedDifficulty": "Easy",
    "generatedAt": "2026-06-06T10:00:00.000Z",
    "usage": {
      "tokensUsed": 850,
      "remainingTokens": 4150,
      "monthlyLimit": 10000
    }
  }
}
```

### Usage Status

`GET /api/usage/me`

Headers:

```http
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "success": true,
  "data": {
    "plan": "FREE",
    "monthlyLimit": 10000,
    "tokensUsed": 2300,
    "remainingTokens": 7700,
    "periodStart": "2026-06-01T00:00:00.000Z",
    "periodEnd": "2026-06-30T23:59:59.999Z"
  }
}
```

Monthly AI limits are `10,000` tokens for `FREE` users and `100,000` tokens for `PREMIUM` users. Subscription verification is not active yet; `src/services/subscriptionService.ts` is a placeholder for StoreKit 2 and App Store Server API integration.

The backend does not implement `/api/exams/evaluate` in the MVP. Generated questions include correct answers so the iOS app can evaluate attempts locally.

## Database

Models:

- `User`: authentication account with name, unique email, city, bcrypt hash, and plan
- `UsageLog`: per-user AI usage tracking by provider, operation type, input tokens, output tokens, and total token count
- `Subscription`: placeholder subscription records for future premium entitlement verification

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
