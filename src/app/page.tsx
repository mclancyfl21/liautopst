import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getPosts, getPlaylists, getChannels } from '@/lib/actions';
import Link from 'next/link';
import { Share2, LogOut } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { logout } from '@/lib/auth-actions';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function Home() {
  // Bootstrap check: If no users, redirect to register
  const userCountResult = await db.select({ count: sql`count(*)` }).from(users).get();
  const userCount = (userCountResult as { count: number })?.count || 0;
  
  if (userCount === 0) {
    redirect('/register');
  }

  const { inventory } = await getPosts();
  const playlists = await getPlaylists();
  const channels = await getChannels();
  const session = await getSession();

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold uppercase text-xs tracking-wider">{session?.user?.companyName}</span>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">LinkedIn AutoPost</h1>
            </div>
            <p className="text-xs text-gray-500 font-medium">Content Hub & Scheduler</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex bg-gray-100 p-1 rounded-lg">
            <Link href="/" className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-medium">Workspace</Link>
            <Link href="/playlists" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Playlists</Link>
            <Link href="/archive" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Archive</Link>
            <Link href="/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Settings</Link>
          </nav>
          
          <div className="flex items-center gap-4 pl-6 border-l">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session?.user?.email}</p>
              <div className="flex items-center justify-end gap-2">
                <p className="text-xs text-gray-500 capitalize">{session?.user?.role}</p>
                {session?.user?.role === 'superadmin' && (
                  <Link href="/admin" className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold hover:bg-purple-200 transition-colors">ADMIN</Link>
                )}
              </div>
            </div>
            <form action={logout}>
              <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
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
