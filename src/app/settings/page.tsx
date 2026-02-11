import { getCredentials, updateCredential } from '@/lib/credential-actions';
import Link from 'next/link';
import { ArrowLeft, Share2 } from 'lucide-react';

export default async function SettingsPage() {
  const creds = await getCredentials();

  async function handleSubmit(formData: FormData) {
    'use server';
    const keys = ['linkedin_client_id', 'linkedin_client_secret', 'linkedin_urn', 'openai_api_key', 'inbound_api_token', 'random_mode_active', 'cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret'];
    
    for (const key of keys) {
      const value = formData.get(key) as string;
      if (value !== undefined) {
        await updateCredential(key, value);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div className="bg-blue-600 p-1.5 rounded-md mx-2">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">LinkedIn AutoPost</h1>
            <p className="text-xs text-gray-500 font-medium">Settings</p>
          </div>
        </div>
        <nav className="flex bg-gray-100 p-1 rounded-lg">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Workspace</Link>
          <Link href="/playlists" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Playlists</Link>
          <Link href="/archive" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Archive</Link>
          <Link href="/settings" className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-medium">Settings</Link>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-8 pb-12">
        <form action={handleSubmit} className="space-y-8">
          <section className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">LinkedIn OAuth Credentials</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                <input 
                  name="linkedin_client_id"
                  type="text" 
                  defaultValue={creds.linkedin_client_id || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                <input 
                  name="linkedin_client_secret"
                  type="password" 
                  defaultValue={creds.linkedin_client_secret || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company URN</label>
                <input 
                  name="linkedin_urn"
                  type="text" 
                  placeholder="urn:li:organization:12345"
                  defaultValue={creds.linkedin_urn || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-purple-700">Automation Settings</h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Random Mode Distribution</h3>
                <p className="text-sm text-gray-500">Pick a random inventory item and post it daily.</p>
              </div>
              <select 
                name="random_mode_active" 
                defaultValue={creds.random_mode_active || 'false'}
                className="p-2 border rounded-md"
              >
                <option value="false">Inactive</option>
                <option value="true">Active (Daily)</option>
              </select>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">Cloudinary Media Storage</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Name</label>
                <input 
                  name="cloudinary_cloud_name"
                  type="text" 
                  defaultValue={creds.cloudinary_cloud_name || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input 
                  name="cloudinary_api_key"
                  type="text" 
                  defaultValue={creds.cloudinary_api_key || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                <input 
                  name="cloudinary_api_secret"
                  type="password" 
                  defaultValue={creds.cloudinary_api_secret || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-green-700">AI & External APIs</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                <input 
                  name="openai_api_key"
                  type="password" 
                  defaultValue={creds.openai_api_key || ''}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inbound API Token (Bearer)</label>
                <input 
                  name="inbound_api_token"
                  type="text" 
                  defaultValue={creds.inbound_api_token || 'secret-token'}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700">
              Save All Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
