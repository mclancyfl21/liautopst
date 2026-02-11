import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getPosts, getPlaylists, getChannels } from '@/lib/actions';
import Link from 'next/link';
import { Share2 } from 'lucide-react';

export default async function Home() {
  const { inventory } = await getPosts();
  const playlists = await getPlaylists();
  const channels = await getChannels();

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">LinkedIn AutoPost</h1>
            <p className="text-xs text-gray-500 font-medium">Content Hub & Scheduler</p>
          </div>
        </div>
        <div className="flex gap-4">
          <nav className="flex bg-gray-100 p-1 rounded-lg">
            <Link href="/" className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-medium">Workspace</Link>
            <Link href="/playlists" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Playlists</Link>
            <Link href="/archive" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Archive</Link>
            <Link href="/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Settings</Link>
          </nav>
        </div>
      </header>

      <KanbanBoard 
        initialInventory={inventory} 
        playlists={playlists}
        initialChannels={channels}
      />
    </main>
  );
}
