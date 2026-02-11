'use client';

import { useState } from 'react';
import { TestConnectionButton } from './TestConnectionButton';
import { testCloudinaryConnection } from '@/lib/connection-tests';

interface CloudinarySettingsProps {
  initialCloudName: string;
  initialApiKey: string;
  initialApiSecret: string;
}

export function CloudinarySettings({ initialCloudName, initialApiKey, initialApiSecret }: CloudinarySettingsProps) {
  const [cloudName, setCloudName] = useState(initialCloudName);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [apiSecret, setApiSecret] = useState(initialApiSecret);
  const [url, setUrl] = useState('');

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (val.startsWith('cloudinary://')) {
      try {
        const u = new URL(val);
        setCloudName(u.hostname);
        setApiKey(u.username);
        setApiSecret(u.password);
      } catch (e) {
        // Ignore parse errors while typing
      }
    }
  };

  return (
    <section className="bg-white border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-orange-600">Cloudinary Media Storage</h2>
      
      <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
        <label className="block text-sm font-bold text-orange-800 mb-1 text-xs uppercase tracking-tight">Rapid Configuration (Cloudinary URL)</label>
        <input 
          name="cloudinary_url"
          type="text" 
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="cloudinary://key:secret@cloudname"
          className="w-full p-2 border rounded-md text-sm bg-white"
        />
        <p className="text-[10px] text-orange-600 mt-1 italic font-medium">Paste the CLOUDINARY_URL from your dashboard to auto-populate all fields below.</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Name</label>
          <input 
            name="cloudinary_cloud_name"
            type="text" 
            value={cloudName}
            onChange={(e) => setCloudName(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input 
            name="cloudinary_api_key"
            type="text" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
          <input 
            name="cloudinary_api_secret"
            type="password" 
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
      <TestConnectionButton 
        testFn={testCloudinaryConnection} 
        label="Test Cloudinary Connection" 
        inputNames={{
          cloudName: 'cloudinary_cloud_name',
          apiKey: 'cloudinary_api_key',
          apiSecret: 'cloudinary_api_secret'
        }}
      />
    </section>
  );
}
