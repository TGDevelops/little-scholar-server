Update the existing Node.js TypeScript Express backend for “Little Scholar: Exam Buddy”.

Goal:
Add AI usage tracking, monthly token limits, and AI Insights generation.

Current backend already has:
- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- JWT auth
- Gemini exam generation
- User registration/login
- UsageLog table or similar

Important privacy requirement:
- Do NOT store child profile data.
- Do NOT store exam history.
- Do NOT store analytics request payload.
- Backend should only receive summarized learning data temporarily, send it to Gemini, return the AI insight, and discard the payload.
- Do not log request bodies for analytics APIs.

Required features:

1. Add AI usage quota system.

Plans:
FREE:
- 10,000 tokens per calendar month

PREMIUM:
- 100,000 tokens per calendar month
- Subscription support placeholder only for now

Add/update Prisma models:

User
- id
- email
- passwordHash
- plan: FREE or PREMIUM
- createdAt
- updatedAt

UsageLog
- id
- userId
- provider
- operationType
- tokensUsed
- inputTokens
- outputTokens
- createdAt

Subscription
- id
- userId
- provider
- status
- productId
- originalTransactionId
- currentPeriodStart
- currentPeriodEnd
- createdAt
- updatedAt

Enums:
PlanType:
- FREE
- PREMIUM

OperationType:
- EXAM_GENERATION
- AI_INSIGHT_GENERATION

SubscriptionStatus:
- NONE
- ACTIVE
- EXPIRED
- CANCELLED

2. Monthly usage calculation.

Create usage service:

src/services/usageService.ts

Functions:
- getMonthlyUsage(userId)
- getMonthlyLimit(user)
- getRemainingTokens(userId)
- assertWithinTokenLimit(userId, estimatedTokens)
- recordUsage(userId, provider, operationType, inputTokens, outputTokens)

Rules:
- Calculate usage from UsageLog for current calendar month.
- FREE limit = 10000 tokens/month.
- PREMIUM limit = 100000 tokens/month.
- Before calling Gemini, check estimated tokens.
- If estimated tokens exceed remaining tokens, return 429 error:
  “Monthly AI usage limit reached.”
- After Gemini response, record actual token usage.
- Return remainingTokens in API response.

3. Update existing exam generation API.

Before Gemini call:
- Estimate tokens based on prompt length and requested question count.
- Check token quota.

After Gemini call:
- Extract token usage if Gemini response provides it.
- If Gemini token metadata is unavailable, use safe estimate.
- Save UsageLog with operationType EXAM_GENERATION.
- Return usage object:

{
  "tokensUsed": 900,
  "remainingTokens": 9100,
  "monthlyLimit": 10000
}

4. Add AI Insights API.

Endpoint:

POST /api/analytics/generate

Protected route.

Request body:

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

Validation:
- Use Zod.
- Do not accept child name.
- Do not accept city.
- Do not accept full question text.
- Do not accept full answer history.
- Limit max subjects to 10.
- Limit max topics per subject to 20.
- Limit recentTrend to latest 20 entries.

Analytics prompt requirements:
- Parent-friendly tone.
- Focus on learning improvement, not pressure.
- Give strengths.
- Give areas needing practice.
- Give actionable recommendations.
- Suggest next difficulty.
- Do not diagnose learning disorders.
- Do not make medical/psychological claims.
- Avoid negative labels.
- Keep it suitable for parents of young children.

Gemini must return valid JSON only:

{
  "summary": "Short parent-friendly learning summary.",
  "strengths": ["Counting", "Shape recognition"],
  "needsPractice": ["Subtraction", "Number sequence"],
  "recommendations": [
    "Generate more easy subtraction exams.",
    "Practice number sequence questions before moving to medium difficulty."
  ],
  "suggestedDifficulty": "Easy"
}

Backend response:

{
  "success": true,
  "data": {
    "insightId": "uuid",
    "summary": "...",
    "strengths": [],
    "needsPractice": [],
    "recommendations": [],
    "suggestedDifficulty": "Easy",
    "generatedAt": "2026-06-06T10:00:00Z",
    "usage": {
      "tokensUsed": 850,
      "remainingTokens": 4150,
      "monthlyLimit": 10000
    }
  }
}

5. Add usage status endpoint.

GET /api/usage/me

Response:

{
  "success": true,
  "data": {
    "plan": "FREE",
    "monthlyLimit": 10000,
    "tokensUsed": 2300,
    "remainingTokens": 7700,
    "periodStart": "2026-06-01T00:00:00Z",
    "periodEnd": "2026-06-30T23:59:59Z"
  }
}

6. Subscription readiness.

Do not implement real Apple payment verification yet.

Add placeholder fields and service structure:

src/services/subscriptionService.ts

Functions:
- getUserPlan(userId)
- setUserPlan(userId, plan)
- isPremium(userId)

Add TODO comments for:
- StoreKit 2 integration
- App Store Server API verification
- originalTransactionId handling
- subscription renewal webhook handling

7. Security and privacy.

Important:
- Do not log analytics request body.
- Do not save child or exam summary payload.
- Only save token usage metadata.
- Rate limit analytics endpoint.
- Keep all routes protected except auth and health.
- Return friendly errors.

8. Update files.

Update:
- Prisma schema
- migrations
- controllers
- services
- routes
- validators
- README
- .env.example if needed

9. Add tests or basic test examples if project already has test setup.

10. Ensure backward compatibility.

Existing exam generation should continue working.
Only add usage enforcement and usage response object.

Generate complete code changes.