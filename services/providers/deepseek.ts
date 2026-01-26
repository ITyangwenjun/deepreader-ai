import { AIProvider, SYSTEM_PROMPT, createAnalysisPrompt, parseAIResponse } from '../aiService';
import { AIAnalysisResult } from '../../types';

export const DeepSeekProvider: AIProvider = {
    name: 'deepseek',
    displayName: 'DeepSeek',
    models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' }
    ],

    async analyze(text: string, prompt: string, model: string, apiKey: string): Promise<AIAnalysisResult> {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'deepseek-chat',
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
            throw new Error(error.message || `DeepSeek API error: ${response.status}`);
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

export default DeepSeekProvider;
