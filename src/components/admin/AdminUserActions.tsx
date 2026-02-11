'use client';

import { updateUserEmail, resetUserPassword, deleteUser, updateUserTenant } from '@/lib/auth-actions';

export function AdminUserActions({ userId, currentEmail, currentCompany }: { userId: number, currentEmail: string, currentCompany: string }) {
  const handleEditEmail = async () => {
    const newEmail = prompt('Enter new email:', currentEmail);
    if (newEmail && newEmail !== currentEmail) {
      const res = await updateUserEmail(userId, newEmail);
      if (res.success) alert('Email updated');
    }
  };

  const handleEditCompany = async () => {
    const newCompany = prompt('Enter new company name:', currentCompany);
    if (newCompany && newCompany !== currentCompany) {
      const res = await updateUserTenant(userId, newCompany);
      if (res.success) alert('Company updated');
    }
  };

  const handleResetPassword = async () => {
    const newPassword = prompt('Enter new password:');
    if (newPassword) {
      const res = await resetUserPassword(userId, newPassword);
      if (res.success) alert('Password updated successfully');
    }
  };

  const handleDeleteUser = async () => {
    if (confirm('Are you sure you want to delete this user?')) {
      const res = await deleteUser(userId);
      if ('error' in res) {
        alert(res.error);
      } else if (res.success) {
        alert('User deleted');
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleEditEmail}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border transition-colors"
      >
        Email
      </button>
      <button 
        onClick={handleEditCompany}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border transition-colors"
      >
        Company
      </button>
      <button 
        onClick={handleResetPassword}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border transition-colors"
      >
        PW
      </button>
      <button 
        onClick={handleDeleteUser}
        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 transition-colors"
      >
        Del
      </button>
    </div>
  );
}
