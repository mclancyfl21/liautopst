'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Check, X, Image as ImageIcon, Upload, List, Send, Maximize2, Calendar, Clock, Link as LinkIcon, Power } from 'lucide-react';
import { updatePost, deletePost, postNow } from '@/lib/actions';

interface Playlist {
  id: number;
  name: string;
}

interface PostCardProps {
  id: number;
  content: string;
  imageUrl?: string | null;
  playlistId?: number | null;
  scheduledAt?: Date | null;
  isScheduleActive?: boolean;
  playlists?: Playlist[];
}

export const PostCard: React.FC<PostCardProps> = ({ id, content, imageUrl, playlistId, scheduledAt, isScheduleActive, playlists = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [editedContent, setEditedContent] = useState(content);
  const [editedImageUrl, setEditedImageUrl] = useState(imageUrl || '');
  const [editedPlaylistId, setEditedPlaylistId] = useState<number | null>(playlistId || null);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(isScheduleActive ?? !!scheduledAt);
  const [tempDate, setTempDate] = useState<string>('');
  const [tempTime, setTempTime] = useState<string>('09:00');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditedContent(content);
      setEditedImageUrl(imageUrl || '');
      setEditedPlaylistId(playlistId || null);
      setIsScheduleEnabled(isScheduleActive ?? !!scheduledAt);
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        setTempDate(d.toISOString().split('T')[0]);
        setTempTime(d.toTimeString().slice(0, 5));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setTempDate(tomorrow.toISOString().split('T')[0]);
        setTempTime('09:00');
      }
    }
  }, [isEditing, content, imageUrl, playlistId, scheduledAt, isScheduleActive]);

  const handleSave = async () => {
    if (editedContent.trim() !== '') {
      let finalSchedule: Date | null = null;
      if (tempDate && tempTime) {
        finalSchedule = new Date(`${tempDate}T${tempTime}`);
      }
      
      await updatePost(id, editedContent, editedImageUrl.trim() || null, editedPlaylistId, finalSchedule, isScheduleEnabled);
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
    <>
      {/* Standard Card View */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col w-full h-[320px] group relative border-gray-200 hover:border-blue-300 transition-all">
        {/* Hover Actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => setIsMaximized(true)} className="p-1.5 bg-white/95 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-blue-600 transition-colors" title="View Details"><Maximize2 className="w-4 h-4" /></button>
          <button onClick={() => setIsEditing(true)} className="p-1.5 bg-white/95 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-blue-600 transition-colors" title="Edit Post"><Pencil className="w-4 h-4" /></button>
          <button onClick={handleDelete} className="p-1.5 bg-white/95 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
          <button onClick={async () => { if (confirm('Post now?')) await postNow(id); }} className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm border border-blue-700 text-white transition-colors" title="Post Now"><Send className="w-4 h-4" /></button>
        </div>

        {/* Card Content */}
        <div className="w-full h-32 relative overflow-hidden bg-gray-100 flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt="Post Visual" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon className="w-10 h-10 opacity-20" />
            </div>
          )}
        </div>
        <div className="p-4 bg-white flex-grow flex flex-col gap-2 overflow-hidden">
          <div className="flex justify-between items-start">
            {currentPlaylist ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate">
                <List className="w-3 h-3" /> {currentPlaylist.name}
              </div>
            ) : <div />}
            {scheduledAt && (
              <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                isScheduleActive ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-gray-400 bg-gray-50 border-gray-200 grayscale'
              }`}>
                <Calendar className="w-2.5 h-2.5" />
                {new Date(scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                {!isScheduleActive && <Power className="w-2 h-2 ml-0.5" />}
              </div>
            )}
          </div>
          <p className="text-xs line-clamp-6 text-gray-800 whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Edit LinkedIn Post
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto space-y-6">
              {/* Content Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Post Content</label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-4 border-2 border-blue-50 rounded-xl text-sm outline-none focus:border-blue-500 bg-white min-h-[150px] shadow-inner"
                  placeholder="What's the post about?"
                  autoFocus
                />
              </div>

              {/* Image Management */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Media</label>
                <div className="flex gap-4">
                  <div className="w-32 h-32 rounded-lg border bg-gray-50 overflow-hidden flex-shrink-0 relative">
                    {editedImageUrl ? (
                      <>
                        <img src={editedImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => setEditedImageUrl('')} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md shadow-lg hover:bg-red-700 transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8 opacity-20" /></div>
                    )}
                  </div>
                  <div className="flex-grow space-y-3">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 w-full transition-all"
                    >
                      <Upload className="w-4 h-4 text-blue-600" />
                      {isUploading ? 'Uploading...' : 'Upload New Image'}
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    
                    <div className="flex items-center gap-2 p-2 border rounded-xl bg-white">
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        value={editedImageUrl}
                        onChange={(e) => setEditedImageUrl(e.target.value)}
                        placeholder="Or paste external image URL..."
                        className="w-full text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Playlist</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <List className="w-5 h-5 text-gray-400" />
                    <select 
                      value={editedPlaylistId || ''} 
                      onChange={(e) => setEditedPlaylistId(e.target.value ? Number(e.target.value) : null)}
                      className="flex-grow text-sm bg-transparent outline-none font-bold text-gray-700"
                    >
                      <option value="">No Playlist</option>
                      {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Precision Schedule</label>
                    <input 
                      type="checkbox" 
                      checked={isScheduleEnabled}
                      onChange={(e) => setIsScheduleEnabled(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                  </div>
                  <div className={`flex gap-2 p-2 rounded-xl border transition-all ${isScheduleEnabled ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
                    <input 
                      type="date" 
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      disabled={!isScheduleEnabled}
                      className="flex-1 bg-transparent p-1 text-sm outline-none font-medium"
                    />
                    <input 
                      type="time" 
                      value={tempTime}
                      onChange={(e) => setTempTime(e.target.value)}
                      disabled={!isScheduleEnabled}
                      className="flex-1 bg-transparent p-1 text-sm outline-none font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
              >
                <Check className="w-5 h-5" /> Update Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maximize Modal (Read-only View) */}
      {isMaximized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsMaximized(false)} className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg z-50 text-gray-500 hover:text-gray-800 transition-all"><X className="w-6 h-6" /></button>
            
            <div className="flex-grow overflow-y-auto">
              <div className="w-full h-96 bg-gray-100 relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="Post Visual" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-20 h-20 opacity-20" /></div>
                )}
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  {currentPlaylist ? (
                    <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-sm">
                      <List className="w-5 h-5" /> {currentPlaylist.name}
                    </div>
                  ) : <div />}
                  {scheduledAt && (
                    <div className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                      <Calendar className="w-4 h-4" /> Scheduled for {new Date(scheduledAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <p className="text-xl text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsMaximized(false); setIsEditing(true); }} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Pencil className="w-4 h-4 text-blue-600" /> Edit Content
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-2.5 bg-white border rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
              <button onClick={async () => { if (confirm('Post now?')) { await postNow(id); setIsMaximized(false); } }} className="flex items-center gap-2 px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"><Send className="w-4 h-4" /> Post Now</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
