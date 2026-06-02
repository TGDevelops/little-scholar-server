import { env } from '../../config/env';
import { GeminiProvider } from './GeminiProvider';
import { MockProvider } from './MockProvider';
import type { AIProvider } from './AIProvider';

export const createAIProvider = (): AIProvider => {
  switch (env.AI_PROVIDER) {
    case 'gemini':
      return new GeminiProvider();
    case 'mock':
      return new MockProvider();
    default:
      return new GeminiProvider();
  }
};
