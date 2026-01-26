import { AIProvider, SYSTEM_PROMPT, createAnalysisPrompt, parseAIResponse } from '../aiService';
import { AIAnalysisResult } from '../../types';

export const QwenProvider: AIProvider = {
    name: 'qwen',
    displayName: '通义千问 (Qwen)',
    models: [
        { id: 'qwen-turbo', name: 'Qwen Turbo (快速)' },
        { id: 'qwen-plus', name: 'Qwen Plus (均衡)' },
        { id: 'qwen-max', name: 'Qwen Max (最强)' }
    ],

    async analyze(text: string, prompt: string, model: string, apiKey: string): Promise<AIAnalysisResult> {
        // 阿里云百炼API兼容OpenAI格式
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'qwen-turbo',
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
            throw new Error(error.message || `Qwen API error: ${response.status}`);
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

export default QwenProvider;
