import { AIProvider, SYSTEM_PROMPT, createAnalysisPrompt, parseAIResponse } from '../aiService';
import { AIAnalysisResult } from '../../types';

export const OpenAIProvider: AIProvider = {
    name: 'openai',
    displayName: 'OpenAI',
    models: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (快速)' },
        { id: 'gpt-4o', name: 'GPT-4o (推荐)' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ],

    async analyze(text: string, prompt: string, model: string, apiKey: string): Promise<AIAnalysisResult> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: createAnalysisPrompt(text, prompt) }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `OpenAI API error: ${response.status}`);
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

export default OpenAIProvider;
