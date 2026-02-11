'use client';

import { createTenant } from '@/lib/auth-actions';
import { useActionState, useEffect, useRef } from 'react';

export function CreateTenantForm() {
  const [state, action, pending] = useActionState(createTenant, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
      <h2 className="font-semibold text-gray-900 mb-4">Create New Tenant</h2>
      <form ref={formRef} action={action} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Company Name</label>
          <input
            type="text"
            name="companyName"
            placeholder="Acme Corp"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="tenant@example.com"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Password</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Role</label>
          <select
            name="role"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="admin">Admin (Tenant)</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {pending ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
      {state?.error && <p className="text-red-500 text-xs mt-2">{state.error}</p>}
      {state?.success && <p className="text-green-500 text-xs mt-2">{state.success}</p>}
    </div>
  );
}
