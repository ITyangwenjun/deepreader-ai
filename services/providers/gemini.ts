import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider } from '../aiService';
import { AIAnalysisResult } from '../../types';

export const GeminiProvider: AIProvider = {
    name: 'gemini',
    displayName: 'Google Gemini',
    models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (最新)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (快速)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (最强)' }
    ],

    async analyze(text: string, prompt: string, model: string, apiKey: string): Promise<AIAnalysisResult> {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: model || 'gemini-2.0-flash',
            contents: `
        请分析以下文本，并根据用户的提示词给出深度分析。
        
        用户的分析要求："${prompt}"
        
        文本内容：
        """
        ${text.substring(0, 3000)}
        """
        
        请提供深入的文学分析。
        返回JSON格式，包含 'summary'（整体概述）和 'points'（分析要点数组）。
        每个 point 应有 'title'（不超过5个字）和 'description'。
      `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        points: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ["title", "description"]
                            }
                        }
                    },
                    required: ["summary", "points"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AIAnalysisResult;
        }

        throw new Error('No response from Gemini');
    }
};

export default GeminiProvider;
