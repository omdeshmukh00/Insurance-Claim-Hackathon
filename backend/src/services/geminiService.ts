import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AgentError } from '../utils/errors.js';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (genAIClient) return genAIClient;
  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your-gemini-api-key') {
    logger.warn('GEMINI_API_KEY is not configured or using default placeholder.');
    return null;
  }
  genAIClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  return genAIClient;
}

export interface GeminiOptions {
  systemInstruction?: string;
  temperature?: number;
  model?: string;
}

export const geminiService = {
  isConfigured(): boolean {
    return Boolean(
      config.GEMINI_API_KEY &&
      config.GEMINI_API_KEY !== 'your-gemini-api-key' &&
      config.GEMINI_API_KEY.length > 5
    );
  },

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: GeminiOptions = {}
  ): Promise<T> {
    const ai = getGenAI();
    if (!ai) {
      throw new AgentError('Gemini API is not configured. Please set a valid GEMINI_API_KEY.');
    }

    const modelName = options.model || config.GEMINI_MODEL || 'gemini-2.5-flash';
    const temperature = options.temperature ?? 0.1; // Low temperature for deterministic claim analysis

    try {
      logger.debug(`Calling Gemini structured generation (${modelName})`, {
        promptLength: prompt.length,
        temperature,
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (!text) {
        throw new AgentError('Empty response text received from Gemini');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (err: any) {
        logger.error('Failed to parse JSON output from Gemini', { text, error: err.message });
        throw new AgentError('Gemini returned malformed non-JSON output', { rawText: text });
      }

      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        logger.error('Gemini output failed schema validation', {
          issues: validation.error.issues,
          parsed,
        });
        throw new AgentError('Gemini output failed structured schema validation', {
          issues: validation.error.issues,
        });
      }

      return validation.data;
    } catch (err: any) {
      if (err instanceof AgentError) throw err;
      logger.error('Gemini API execution error', { error: err.message, stack: err.stack });
      throw new AgentError(`Gemini generation error: ${err.message}`, { originalError: err.message });
    }
  },

  async generateText(prompt: string, options: GeminiOptions = {}): Promise<string> {
    const ai = getGenAI();
    if (!ai) {
      throw new AgentError('Gemini API is not configured. Please set a valid GEMINI_API_KEY.');
    }

    const modelName = options.model || config.GEMINI_MODEL || 'gemini-2.5-flash';
    const temperature = options.temperature ?? 0.2;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature,
        },
      });

      return response.text || '';
    } catch (err: any) {
      logger.error('Gemini text generation failed', { error: err.message });
      throw new AgentError(`Gemini text generation error: ${err.message}`);
    }
  },

  async analyzeDocument<T>(
    fileBuffer: Buffer,
    mimeType: string,
    prompt: string,
    schema: z.ZodType<T>,
    options: GeminiOptions = {}
  ): Promise<T> {
    const ai = getGenAI();
    if (!ai) {
      throw new AgentError('Gemini API is not configured. Please set a valid GEMINI_API_KEY.');
    }

    const modelName = options.model || config.GEMINI_MODEL || 'gemini-2.5-flash';
    const temperature = options.temperature ?? 0.1;

    try {
      const base64Data = fileBuffer.toString('base64');
      const contents = [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        prompt,
      ];

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (!text) {
        throw new AgentError('Gemini returned empty text for multimodal document analysis');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (err: any) {
        logger.error('Failed to parse multimodal JSON output from Gemini', { text, error: err.message });
        throw new AgentError('Gemini returned malformed JSON from document analysis', { rawText: text });
      }

      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        logger.error('Multimodal output failed schema validation', {
          issues: validation.error.issues,
          parsed,
        });
        throw new AgentError('Multimodal document analysis failed schema validation', {
          issues: validation.error.issues,
        });
      }

      return validation.data;
    } catch (err: any) {
      if (err instanceof AgentError) throw err;
      logger.error('Multimodal Gemini analysis error', { error: err.message });
      throw new AgentError(`Document analysis failed: ${err.message}`);
    }
  },
};
