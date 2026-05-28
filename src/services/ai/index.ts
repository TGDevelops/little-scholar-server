import { env } from '../../config/env';
import { GeminiProvider } from './GeminiProvider';
import type { AIProvider } from './AIProvider';

export const createAIProvider = (): AIProvider => {
  switch (env.AI_PROVIDER) {
    case 'gemini':
      return new GeminiProvider();
    default:
      return new GeminiProvider();
  }
};
