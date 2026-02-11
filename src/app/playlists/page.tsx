import { getPlaylists, createPlaylist } from '@/lib/actions';
import Link from 'next/link';
import { Share2, ListPlus, ArrowLeft } from 'lucide-react';
import { PlaylistList } from '@/components/playlists/PlaylistList';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export default async function PlaylistsPage() {
  const allPlaylists = await getPlaylists();
  const session = await getSession();

  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    if (name) {
      await createPlaylist(name, description);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div className="bg-blue-600 p-1.5 rounded-md">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold uppercase text-xs tracking-wider">{session?.user?.companyName}</span>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Playlists</h1>
            </div>
            <p className="text-xs text-gray-500 font-medium">Group and sequence your content</p>
          </div>
        </div>
        <nav className="flex bg-gray-100 p-1 rounded-lg">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Workspace</Link>
          <Link href="/playlists" className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-medium">Playlists</Link>
          <Link href="/archive" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Archive</Link>
          <Link href="/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Settings</Link>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="md:col-span-1">
            <section className="bg-white border rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-blue-600" />
                New Playlist
              </h2>
              <form action={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                  <input 
                    name="name" 
                    type="text" 
                    required
                    placeholder="e.g., AI Strategy Series"
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                  <textarea 
                    name="description" 
                    placeholder="Optional details..."
                    className="w-full p-2 border rounded-md text-sm h-24"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Create Playlist
                </button>
              </form>
            </section>
          </div>

          {/* List Section */}
          <div className="md:col-span-2">
            <PlaylistList initialPlaylists={allPlaylists} />
          </div>
        </div>
      </div>
    </div>
  );
}
