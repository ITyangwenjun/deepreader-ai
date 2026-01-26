import { AIAnalysisResult } from '../types';

// AI Provider 接口
export interface AIProvider {
    name: string;
    displayName: string;
    models: { id: string; name: string }[];
    analyze(text: string, prompt: string, model: string, apiKey: string): Promise<AIAnalysisResult>;
}

// 系统提示词，用于所有模型
export const SYSTEM_PROMPT = `你是一个专业的文学分析助手。请分析用户提供的文本，并根据用户的提示词给出深度分析。

请以JSON格式返回分析结果，格式如下：
{
  "summary": "对所分析内容的整体概述（100-200字）",
  "points": [
    {
      "title": "分析要点标题（不超过5个字）",
      "description": "详细的分析描述（50-100字）"
    }
  ]
}

请提供3-5个分析要点，确保分析深入、专业且有见地。`;

// 通用的分析提示词生成器
export const createAnalysisPrompt = (text: string, userPrompt: string): string => {
    return `请分析以下文本：

文本内容：
"""
${text.substring(0, 3000)}
"""

用户的分析要求：${userPrompt}

请以JSON格式返回分析结果。`;
};

// 解析AI响应
export const parseAIResponse = (response: string): AIAnalysisResult | null => {
    try {
        // 尝试直接解析
        const parsed = JSON.parse(response);
        if (parsed.summary && Array.isArray(parsed.points)) {
            return parsed as AIAnalysisResult;
        }
    } catch {
        // 尝试从Markdown代码块中提取JSON
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                if (parsed.summary && Array.isArray(parsed.points)) {
                    return parsed as AIAnalysisResult;
                }
            } catch {
                console.error('Failed to parse JSON from code block');
            }
        }
    }

    // 如果解析失败，返回一个默认结构
    return {
        summary: response.substring(0, 500),
        points: [
            {
                title: '分析结果',
                description: response.substring(0, 200)
            }
        ]
    };
};
