import { getPosts } from '@/lib/actions';
import { PostCard } from '@/components/kanban/PostCard';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export default async function ArchivePage() {
  const { posted } = await getPosts();
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-50">
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
            <p className="text-xs text-gray-500 font-medium">Archive</p>
          </div>
        </div>
        <nav className="flex bg-gray-100 p-1 rounded-lg">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Workspace</Link>
          <Link href="/playlists" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Playlists</Link>
          <Link href="/archive" className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-medium">Archive</Link>
          <Link href="/settings" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Settings</Link>
        </nav>
      </header>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posted.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 italic">
            No posts have been archived yet.
          </div>
        ) : (
          posted.map(post => (
            <div key={post.id} className="opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all">
              <div className="text-xs font-semibold text-gray-500 mb-2">
                Posted on {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : 'Unknown Date'}
              </div>
              <PostCard id={post.id} content={post.content} imageUrl={post.imageUrl} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
