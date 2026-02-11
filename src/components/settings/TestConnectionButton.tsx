'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface TestConnectionButtonProps {
  testFn: (args?: any) => Promise<{ success: boolean; message: string }>;
  label?: string;
  inputNames?: Record<string, string>; // { argName: inputName }
}

export function TestConnectionButton({ testFn, label = 'Test Connection', inputNames }: TestConnectionButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTest = async (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      let args: any = undefined;
      
      if (inputNames) {
        args = {};
        for (const [argName, inputName] of Object.entries(inputNames)) {
          const input = document.querySelector(`[name="${inputName}"]`) as HTMLInputElement | HTMLSelectElement;
          if (input) {
            args[argName] = input.value;
          }
        }
      }

      const result = await testFn(args);
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch {
      setStatus('error');
      setMessage('An unexpected error occurred');
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <button
        onClick={handleTest}
        disabled={status === 'loading'}
        className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : status === 'error' ? (
          <XCircle className="w-4 h-4 text-red-600" />
        ) : null}
        {label}
      </button>
      {message && (
        <p className={`text-xs font-medium ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
