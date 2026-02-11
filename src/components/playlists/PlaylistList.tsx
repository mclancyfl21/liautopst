'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { updatePlaylist, deletePlaylist } from '@/lib/actions';

interface Playlist {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date | null;
}

interface PlaylistListProps {
  initialPlaylists: Playlist[];
}

export const PlaylistList: React.FC<PlaylistListProps> = ({ initialPlaylists }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const startEditing = (pl: Playlist) => {
    setEditingId(pl.id);
    setEditName(pl.name);
    setEditDescription(pl.description || '');
  };

  const handleUpdate = async (id: number) => {
    if (editName.trim()) {
      await updatePlaylist(id, editName, editDescription);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this playlist? Posts in this playlist will not be deleted but will be unassigned.')) {
      await deletePlaylist(id);
    }
  };

  if (initialPlaylists.length === 0) {
    return (
      <div className="bg-white border border-dashed rounded-xl py-12 text-center text-gray-400 italic">
        No playlists created yet. Define one to start grouping content.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {initialPlaylists.map(pl => (
        <div key={pl.id} className="bg-white border rounded-xl p-6 shadow-sm hover:border-blue-200 transition-colors group relative">
          {editingId === pl.id ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Playlist Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm h-20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button 
                  onClick={() => handleUpdate(pl.id)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEditing(pl)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit Playlist"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(pl.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 pr-16">{pl.name}</h3>
                {pl.description && <p className="text-sm text-gray-500 mt-1">{pl.description}</p>}
                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-gray-400">
                  <span>Created {pl.createdAt ? new Date(pl.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
