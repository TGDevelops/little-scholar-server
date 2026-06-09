import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { configureGoogleApplicationCredentials } from '../../config/googleAuth';
import { AppError } from '../../utils/AppError';
import { usageService } from '../usage.service';
import { buildAnalyticsInsightPrompt } from '../../prompts/analyticsInsightPrompt';
import { buildExamGenerationPrompt } from '../../prompts/examGenerationPrompt';
import {
  generatedExamSchema,
  type ResolvedGenerateExamInput
} from '../../validators/exam.validator';
import {
  generatedAnalyticsInsightSchema,
  type GenerateAnalyticsInsightInput
} from '../../validators/analytics.validator';
import type { AIProvider, GenerateAnalyticsInsightResult, GenerateExamResult } from './AIProvider';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private readonly ai: GoogleGenAI | null;
  private readonly apiKey?: string;
  private readonly useApiKey: boolean;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY;
    this.useApiKey = Boolean(this.apiKey);

    if (this.useApiKey) {
      this.ai = null;
    } else {
      // Fall back to Vertex AI via ADC
      if (!env.GOOGLE_CLOUD_PROJECT) {
        throw new Error(
          'GOOGLE_CLOUD_PROJECT is required when not using GEMINI_API_KEY'
        );
      }

      configureGoogleApplicationCredentials();
      this.ai = new GoogleGenAI({
        vertexai: true,
        project: env.GOOGLE_CLOUD_PROJECT,
        location: env.GOOGLE_CLOUD_LOCATION
      });
    }
  }

  async generateExam(input: ResolvedGenerateExamInput): Promise<GenerateExamResult> {
    const examId = uuidv4();
    const prompt = buildExamGenerationPrompt(input, examId);
    const result = await this.generateContent(prompt, 1500);
    const rawText = result.text;

    if (!rawText) {
      throw new AppError('Gemini provider returned an empty response', 502);
    }

    const parsedJson = this.parseJson(rawText);
    const exam = generatedExamSchema.parse(parsedJson);

    if (
      exam.examId !== examId ||
      exam.grade !== input.grade ||
      exam.subject !== input.subject ||
      exam.difficulty !== input.difficulty ||
      exam.questionCount !== input.questionCount ||
      exam.questions.length !== input.questionCount
    ) {
      throw new AppError('AI response did not match the requested exam contract', 502);
    }

    return {
      exam,
      usage: this.getUsage(result, prompt, rawText)
    };
  }

  async generateAnalyticsInsight(
    input: GenerateAnalyticsInsightInput
  ): Promise<GenerateAnalyticsInsightResult> {
    const prompt = buildAnalyticsInsightPrompt(input);
    const result = await this.generateContent(prompt, 1000);
    const rawText = result.text;

    if (!rawText) {
      throw new AppError('Gemini provider returned an empty response', 502);
    }

    const parsedJson = this.parseJson(rawText);
    const insight = generatedAnalyticsInsightSchema.parse(parsedJson);

    return {
      insight,
      usage: this.getUsage(result, prompt, rawText)
    };
  }

  private async generateContent(
    prompt: string,
    maxOutputTokens: number
  ): Promise<GenerateContentResponse> {
    try {
      if (this.useApiKey) {
        // Direct REST call to Generative Language API v1 using API key
        const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
          env.GEMINI_MODEL
        )}:generateContent?key=${encodeURIComponent(this.apiKey as string)}`;

        const body = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens,
            responseMimeType: 'application/json'
          }
        };

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Generative API error: ${resp.status} ${txt}`);
        }

        const data = await resp.json();

        // Extract text from the standard v1 response format
        const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!output) {
          throw new Error(
            `No text in API response. Raw response: ${JSON.stringify(data)}`
          );
        }

        // Normalize to expected shape from @google/genai
        return {
          text: output,
          usageMetadata: data?.usageMetadata ?? {}
        } as unknown as GenerateContentResponse;
      }

      if (!this.ai) {
        throw new Error('AI provider not initialized');
      }

      return await this.ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
          maxOutputTokens
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Gemini provider error';

      if (message.includes('Could not load the default credentials') || message.includes('ADC')) {
        throw new AppError('Google Application Default Credentials are not configured', 502, {
          provider: this.name,
          reason: 'ADC_NOT_CONFIGURED',
          action:
            'Run `gcloud auth application-default login` locally or deploy with a service account.'
        });
      }

      if (message.includes('PERMISSION_DENIED') || message.includes('403')) {
        throw new AppError(
          'Vertex AI request was denied for the configured Google Cloud project',
          502,
          {
            provider: this.name,
            reason: 'VERTEX_AI_PERMISSION_DENIED',
            action:
              'Enable Vertex AI API and grant the authenticated user or service account Vertex AI User permissions.'
          }
        );
      }

      throw new AppError('Gemini provider request failed', 502, {
        provider: this.name
      });
    }
  }

  private parseJson(rawText: string): unknown {
    try {
      // Remove markdown code fences if present (```json ... ```)
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      return JSON.parse(cleanText);
    } catch {
      throw new AppError('AI provider returned invalid JSON', 502);
    }
  }

  private getUsage(result: GenerateContentResponse, prompt: string, output: string) {
    const metadata = result.usageMetadata as
      | {
          totalTokenCount?: number;
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        }
      | undefined;

    const estimatedInputTokens = usageService.estimateTokensFromText(prompt);
    const estimatedOutputTokens = usageService.estimateTokensFromText(output);
    const inputTokens = metadata?.promptTokenCount ?? estimatedInputTokens;
    const outputTokens = metadata?.candidatesTokenCount ?? estimatedOutputTokens;
    const tokensUsed = metadata?.totalTokenCount ?? inputTokens + outputTokens;

    const outputTokenCount =
      metadata?.candidatesTokenCount ??
      (metadata?.totalTokenCount ? Math.max(tokensUsed - inputTokens, 0) : outputTokens);

    return {
      tokensUsed,
      inputTokens,
      outputTokens: outputTokenCount
    };
  }
}
