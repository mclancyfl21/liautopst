'use client';

import React, { useState, useRef } from 'react';
import { Pencil, Trash2, Check, X, Image as ImageIcon, Upload, List } from 'lucide-react';
import { updatePost, deletePost } from '@/lib/actions';

interface Playlist {
  id: number;
  name: string;
}

interface PostCardProps {
  id: number;
  content: string;
  imageUrl?: string | null;
  playlistId?: number | null;
  playlists?: Playlist[];
}

export const PostCard: React.FC<PostCardProps> = ({ id, content, imageUrl, playlistId, playlists = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [editedImageUrl, setEditedImageUrl] = useState(imageUrl || '');
  const [editedPlaylistId, setEditedPlaylistId] = useState<number | null>(playlistId || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (editedContent.trim() !== '') {
      await updatePost(id, editedContent, editedImageUrl || null, editedPlaylistId);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost(id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEditedImageUrl(data.url);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const currentPlaylist = playlists.find(p => p.id === playlistId);

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col w-full max-w-sm mb-4 group relative">
      {/* Action Buttons Overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {!isEditing && (
          <>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Image Section */}
      <div className="w-full h-48 relative overflow-hidden bg-gray-100">
        {isEditing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-50 border-b">
            {editedImageUrl ? (
              <img 
                src={editedImageUrl} 
                alt="Preview" 
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            ) : null}
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border shadow-sm text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Change Image'}
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-1 w-full max-w-[200px]">
                <ImageIcon className="w-3 h-3 text-gray-400 shrink-0" />
                <input 
                  type="text"
                  value={editedImageUrl}
                  onChange={(e) => setEditedImageUrl(e.target.value)}
                  placeholder="Or paste URL..."
                  className="w-full text-[10px] p-1 border rounded outline-none focus:ring-1 focus:ring-blue-500 bg-white/80"
                />
              </div>
            </div>
          </div>
        ) : (
          imageUrl && (
            <img 
              src={imageUrl} 
              alt="Post Visual" 
              className="w-full h-full object-cover"
            />
          )
        )}
      </div>
      
      <div className="p-4 bg-gray-50 flex-grow">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border rounded-md text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Post content..."
              autoFocus
            />
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Assign to Playlist</label>
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-gray-400" />
                <select 
                  value={editedPlaylistId || ''} 
                  onChange={(e) => setEditedPlaylistId(e.target.value ? Number(e.target.value) : null)}
                  className="flex-grow text-xs p-1.5 border rounded-md outline-none bg-white"
                >
                  <option value="">None</option>
                  {playlists.map(pl => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(content);
                  setEditedImageUrl(imageUrl || '');
                  setEditedPlaylistId(playlistId || null);
                }}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSave}
                className="p-1 text-gray-500 hover:text-green-600"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentPlaylist && (
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                <List className="w-3 h-3" />
                {currentPlaylist.name}
              </div>
            )}
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
