'use client';

import { useState } from 'react';
import { Trash2, CheckCircle2, Circle, Plus, Server, Play } from 'lucide-react';
import { createAiProvider, deleteAiProvider, setActiveAiProvider } from '@/lib/ai-settings-actions';
import { testAiProviderConnection } from '@/lib/connection-tests';

interface AiProvider {
  id: number;
  name: string;
  endpoint: string;
  model: string;
  systemPrompt: string | null;
  userPrompt: string | null;
  isActive: boolean | null;
}

export function AiProviderList({ providers }: { providers: AiProvider[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [testResults, setTestResults] = useState<Record<number, { status: 'loading' | 'success' | 'error', message: string }>>({});

  async function handleAdd(formData: FormData) {
    const name = formData.get('name') as string;
    const endpoint = formData.get('endpoint') as string;
    const apiKey = formData.get('apiKey') as string | null;
    const model = formData.get('model') as string;
    const systemPrompt = formData.get('systemPrompt') as string;
    const userPrompt = formData.get('userPrompt') as string;
    
    if (name && endpoint && model) {
      await createAiProvider(name, endpoint, apiKey || null, model, systemPrompt, userPrompt);
      setIsAdding(false);
    }
  }

  async function runTest(id: number) {
    setTestResults(prev => ({ ...prev, [id]: { status: 'loading', message: 'Testing...' } }));
    try {
      const result = await testAiProviderConnection(id);
      setTestResults(prev => ({ 
        ...prev, 
        [id]: { 
          status: result.success ? 'success' : 'error', 
          message: result.message 
        } 
      }));
    } catch {
      setTestResults(prev => ({ 
        ...prev, 
        [id]: { status: 'error', message: 'Unexpected connection error' } 
      }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium flex items-center gap-2">
          <Server className="w-4 h-4 text-green-600" />
          AI Provider Configurations
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Provider
        </button>
      </div>

      {isAdding && (
        <form action={handleAdd} className="bg-gray-50 p-4 rounded-lg border mb-4 text-sm animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Provider Name</label>
              <input name="name" placeholder="e.g. OpenAI GPT-4" className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Model ID</label>
              <input name="model" placeholder="gpt-4o" className="w-full p-2 border rounded" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">API Endpoint URL</label>
              <input name="endpoint" placeholder="https://api.openai.com/v1" className="w-full p-2 border rounded" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
              <input name="apiKey" type="password" placeholder="sk-... (optional)" className="w-full p-2 border rounded" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">System Prompt</label>
              <textarea name="systemPrompt" placeholder="You are a social media expert..." className="w-full p-2 border rounded h-20" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">User Prompt Template</label>
              <textarea name="userPrompt" placeholder="Write a post about: {{topic}}" className="w-full p-2 border rounded h-20" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Save Provider</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {providers.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4 border-2 border-dashed rounded-lg">
            No AI providers configured.
          </p>
        ) : (
          providers.map((p) => (
            <div key={p.id} className="flex flex-col gap-2">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${p.isActive ? 'bg-green-50 border-green-200 ring-1 ring-green-400' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveAiProvider(p.id)}
                    className={`hover:scale-110 transition-transform ${p.isActive ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
                    title={p.isActive ? "Active Provider" : "Set as Active"}
                  >
                    {p.isActive ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${p.isActive ? 'text-green-900' : 'text-gray-700'}`}>{p.name}</p>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono uppercase">{p.model}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{p.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => runTest(p.id)}
                    disabled={testResults[p.id]?.status === 'loading'}
                    className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-50"
                    title="Run Hello World Test"
                  >
                    <Play className={`w-4 h-4 ${testResults[p.id]?.status === 'loading' ? 'animate-pulse text-blue-400' : ''}`} />
                  </button>
                  <button 
                    onClick={() => deleteAiProvider(p.id)}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete Provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {testResults[p.id] && (
                <div className={`px-3 py-1.5 rounded text-[10px] font-medium border animate-in fade-in slide-in-from-top-1 ${
                  testResults[p.id].status === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 
                  testResults[p.id].status === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 
                  'bg-blue-50 border-blue-100 text-blue-700'
                }`}>
                  {testResults[p.id].message}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
