import { AIProvider, SYSTEM_PROMPT, createAnalysisPrompt, parseAIResponse } from '../aiService';
import { AIAnalysisResult } from '../../types';

export const KimiProvider: AIProvider = {
    name: 'kimi',
    displayName: 'Kimi',
    models: [
        { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K' },
        { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K' },
        { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K (长文本)' }
    ],

    async analyze(text: string, prompt: string, model: string, apiKey: string): Promise<AIAnalysisResult> {
        // Moonshot API 兼容 OpenAI 格式
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'moonshot-v1-8k',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: createAnalysisPrompt(text, prompt) }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Kimi API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        const result = parseAIResponse(content);
        if (!result) {
            throw new Error('Failed to parse AI response');
        }

        return result;
    }
};

export default KimiProvider;
