import { db } from '@/db';
import { users, posts, playlists, channels, tenants } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { Share2, Users, FileText, List, Radio } from 'lucide-react';
import { CreateTenantForm } from '@/components/admin/CreateTenantForm';
import { AdminUserActions } from '@/components/admin/AdminUserActions';

export const runtime = 'nodejs';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.user.role !== 'superadmin') {
    redirect('/');
  }

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    apiToken: users.apiToken,
    createdAt: users.createdAt,
    companyName: tenants.name,
    tenantId: users.tenantId,
  }).from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .all();
  
  // Basic stats
  const stats = await db.select({
    userCount: sql<number>`count(distinct ${users.id})`,
    postCount: sql<number>`count(distinct ${posts.id})`,
    playlistCount: sql<number>`count(distinct ${playlists.id})`,
    channelCount: sql<number>`count(distinct ${channels.id})`,
    tenantCount: sql<number>`count(distinct ${tenants.id})`,
  }).from(tenants)
    .leftJoin(users, eq(tenants.id, users.tenantId))
    .leftJoin(posts, eq(tenants.id, posts.tenantId))
    .leftJoin(playlists, eq(tenants.id, playlists.tenantId))
    .leftJoin(channels, eq(tenants.id, channels.tenantId))
    .get();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Superadmin Dashboard</h1>
            <p className="text-xs text-gray-500 font-medium">System-wide Management</p>
          </div>
        </div>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">Back to Workspace</Link>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={allUsers.length} color="bg-blue-500" />
          <StatCard icon={<Radio className="w-5 h-5" />} label="Total Tenants" value={stats?.tenantCount || 0} color="bg-indigo-500" />
          <StatCard icon={<FileText className="w-5 h-5" />} label="Total Posts" value={stats?.postCount || 0} color="bg-green-500" />
          <StatCard icon={<List className="w-5 h-5" />} label="Total Playlists" value={stats?.playlistCount || 0} color="bg-orange-500" />
          <StatCard icon={<Radio className="w-5 h-5" />} label="Total Channels" value={stats?.channelCount || 0} color="bg-red-500" />
        </div>

        <CreateTenantForm />

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Registered Users</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Tenant (Company)</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right pr-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allUsers.map((user) => (
                <tr key={user.id} className="text-sm hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{user.id}</td>
                  <td className="px-6 py-4 font-bold text-blue-600 uppercase text-xs">
                    <div className="flex flex-col">
                      <span>{user.companyName}</span>
                      <span className="text-[10px] text-gray-400 font-normal normal-case">ID: {user.tenantId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end pr-8">
                    <AdminUserActions userId={user.id} currentEmail={user.email} currentCompany={user.companyName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
      <div className={`${color} p-3 rounded-lg text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
