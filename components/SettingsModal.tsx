import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertCircle } from 'lucide-react';
import { getSettingsSync, saveSettings, AISettings } from '../services/bookStorage';
import { DeepSeekProvider, QwenProvider, KimiProvider, GeminiProvider, OpenAIProvider } from '../services/providers';
import { AIProviderType } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange?: (settings: AISettings) => void;
}

const providers = [
    DeepSeekProvider,
    QwenProvider,
    KimiProvider,
    GeminiProvider,
    OpenAIProvider
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsChange }) => {
    const [settings, setSettings] = useState<AISettings>(getSettingsSync());
    const [activeTab, setActiveTab] = useState<'ai' | 'display'>('ai');
    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

    useEffect(() => {
        if (isOpen) {
            setSettings(getSettingsSync());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleProviderChange = (provider: AIProviderType) => {
        const newSettings = { ...settings, provider };
        // 设置默认模型
        const providerConfig = providers.find(p => p.name === provider);
        if (providerConfig && providerConfig.models.length > 0) {
            newSettings.model = providerConfig.models[0].id;
        }
        setSettings(newSettings);
    };

    const handleApiKeyChange = (provider: string, key: string) => {
        setSettings({
            ...settings,
            apiKeys: {
                ...settings.apiKeys,
                [provider]: key
            }
        });
    };

    const handleSave = () => {
        saveSettings(settings);
        onSettingsChange?.(settings);
        onClose();
    };

    const testApiKey = async (providerName: string) => {
        setTestStatus({ ...testStatus, [providerName]: 'testing' });

        try {
            const provider = providers.find(p => p.name === providerName);
            const apiKey = settings.apiKeys[providerName as keyof typeof settings.apiKeys];

            if (!provider || !apiKey) {
                throw new Error('No API key');
            }

            // 简单的测试请求
            await provider.analyze('测试文本', '请简单分析一下', provider.models[0].id, apiKey);
            setTestStatus({ ...testStatus, [providerName]: 'success' });

            setTimeout(() => {
                setTestStatus({ ...testStatus, [providerName]: 'idle' });
            }, 3000);
        } catch (error) {
            setTestStatus({ ...testStatus, [providerName]: 'error' });
            setTimeout(() => {
                setTestStatus({ ...testStatus, [providerName]: 'idle' });
            }, 3000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white dark:bg-card-dark w-[600px] max-h-[80vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-900 dark:text-white">系统设置</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ai'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            AI 模型配置
                        </button>
                        <button
                            onClick={() => setActiveTab('display')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'display'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            显示设置
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'ai' && (
                        <div className="space-y-6">
                            {/* Default Provider */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">默认 AI 提供商</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {providers.map(provider => (
                                        <button
                                            key={provider.name}
                                            onClick={() => handleProviderChange(provider.name as AIProviderType)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${settings.provider === provider.name
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{provider.displayName}</span>
                                            {settings.provider === provider.name && (
                                                <Check size={16} className="ml-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* API Keys */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Key size={16} />
                                    API Keys 配置
                                </h4>

                                {providers.map(provider => (
                                    <div key={provider.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-slate-500">{provider.displayName}</label>
                                            {settings.apiKeys[provider.name as keyof typeof settings.apiKeys] && (
                                                <button
                                                    onClick={() => testApiKey(provider.name)}
                                                    disabled={testStatus[provider.name] === 'testing'}
                                                    className="text-xs text-primary hover:text-blue-600 disabled:opacity-50"
                                                >
                                                    {testStatus[provider.name] === 'testing' ? '测试中...' :
                                                        testStatus[provider.name] === 'success' ? '✓ 有效' :
                                                            testStatus[provider.name] === 'error' ? '✗ 无效' :
                                                                '测试连接'}
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="password"
                                            value={settings.apiKeys[provider.name as keyof typeof settings.apiKeys] || ''}
                                            onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                                            placeholder={`输入 ${provider.displayName} API Key...`}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none dark:text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <p className="font-medium mb-1">如何获取 API Key？</p>
                                        <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
                                            <li>• DeepSeek: <a href="https://platform.deepseek.com" target="_blank" className="underline">platform.deepseek.com</a></li>
                                            <li>• 通义千问: <a href="https://dashscope.console.aliyun.com" target="_blank" className="underline">dashscope.console.aliyun.com</a></li>
                                            <li>• Kimi: <a href="https://platform.moonshot.cn" target="_blank" className="underline">platform.moonshot.cn</a></li>
                                            <li>• Gemini: <a href="https://aistudio.google.com/apikey" target="_blank" className="underline">aistudio.google.com</a></li>
                                            <li>• OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'display' && (
                        <div className="space-y-6">
                            <p className="text-sm text-slate-500">显示设置功能开发中...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors"
                    >
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
