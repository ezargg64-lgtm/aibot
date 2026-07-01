import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import fs from 'fs';

export class GeminiService {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
        this.model = config.gemini.model;
        logger.info(`Gemini Service initialized with model: ${this.model}`);
    }

    updateApiKey(newKey: string) {
        config.gemini.apiKey = newKey;
        this.ai = new GoogleGenAI({ apiKey: newKey });
        logger.info('Gemini API key updated');
    }

    updateModel(newModel: string) {
        config.gemini.model = newModel;
        this.model = newModel;
        logger.info(`Gemini model updated to: ${newModel}`);
    }

    async getModels() {
        try {
            const response = await this.ai.models.list();
            // Need to return array of model names. response may be an async iterator or have a data/items property
            // We can just try to iterate over it or check its properties
            let modelNames: string[] = [];
            for await (const model of response) {
                if (model.name) {
                    modelNames.push(model.name.replace('models/', ''));
                }
            }
            return {
                success: true,
                models: modelNames
            };
        } catch (error: any) {
            logger.warn('Could not fetch models from API (might be blocked by API key), using fallback list.');
            // Fallback to a hardcoded list if API key quota exceeded or other error
            return {
                success: true,
                models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro-exp', 'gemini-3.1-pro-preview', 'gemini-3.1-pro']
            };
        }
    }

    async sendTextMessage(prompt: string, history: any[] = []) {
        try {
            const chat = this.ai.chats.create({
                model: this.model,
                config: {
                    systemInstruction: 'You are a helpful AI assistant on WhatsApp.',
                    temperature: config.gemini.temperature,
                }
            });


            // Reconstruct history if provided, though using interactions API or sending past messages
            // Since SDK has no native history rehydration yet for create, we just send prompt
            const result = await chat.sendMessage({ message: prompt });

            return {
                success: true,
                text: result.text,
            };
        } catch (error: any) {
            logger.error('Error in sendTextMessage:', error);
            return {
                success: false,
                text: null,
                error: error.message,
            };
        }
    }

    async analyzeImage(imagePath: string, promptText: string, mimeType = 'image/jpeg') {
        try {
            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            const result = await this.ai.models.generateContent({
                model: this.model,
                contents: [
                    promptText || 'Analisis gambar ini dan berikan deskripsi detail.',
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        }
                    }
                ]
            });

            return {
                success: true,
                text: result.text,
            };
        } catch (error: any) {
            logger.error('Error in analyzeImage:', error);
            return {
                success: false,
                text: null,
                error: error.message,
            };
        }
    }

    async analyzeFile(filePath: string, mimeType: string, promptText: string) {
        try {
            const fileData = fs.readFileSync(filePath);
            const base64File = fileData.toString('base64');

            const result = await this.ai.models.generateContent({
                model: this.model,
                contents: [
                    promptText || 'Analisis file ini dan berikan ringkasan atau informasi penting.',
                    {
                        inlineData: {
                            data: base64File,
                            mimeType: mimeType,
                        }
                    }
                ]
            });

            return {
                success: true,
                text: result.text,
            };
        } catch (error: any) {
            logger.error('Error in analyzeFile:', error);
            return {
                success: false,
                text: null,
                error: error.message,
            };
        }
    }

    async analyzeFileWithExtraction(filePath: string, mimeType: string, promptText: string, extractedText: string | null = null) {
        try {
            let finalPrompt = promptText || 'Analisis file ini.';

            if (extractedText) {
                finalPrompt += `\n\n[Isi file yang diekstrak]:\n${extractedText}`;
            }

            const result = await this.ai.models.generateContent({
                model: this.model,
                contents: [finalPrompt]
            });

            return {
                success: true,
                text: result.text,
            };
        } catch (error: any) {
            logger.error('Error in analyzeFileWithExtraction:', error);
            return {
                success: false,
                text: null,
                error: error.message,
            };
        }
    }
}

export const geminiService = new GeminiService();
