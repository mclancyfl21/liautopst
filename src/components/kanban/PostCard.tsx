'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Check, X, Image as ImageIcon, Upload, List, Send, Maximize2, Calendar, Clock } from 'lucide-react';
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
  playlists?: Playlist[];
}

export const PostCard: React.FC<PostCardProps> = ({ id, content, imageUrl, playlistId, scheduledAt, playlists = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [editedImageUrl, setEditedImageUrl] = useState(imageUrl || '');
  const [editedPlaylistId, setEditedPlaylistId] = useState<number | null>(playlistId || null);
  
  // Split state for date and time to avoid finicky datetime-local pickers
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(!!scheduledAt);
  const [tempDate, setTempDate] = useState<string>('');
  const [tempTime, setTempTime] = useState<string>('09:00');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize split values when editing starts
  useEffect(() => {
    if (isEditing) {
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        setTempDate(d.toISOString().split('T')[0]);
        setTempTime(d.toTimeString().slice(0, 5));
        setIsScheduleEnabled(true);
      } else {
        setIsScheduleEnabled(false);
        setTempDate(new Date().toISOString().split('T')[0]);
        setTempTime('09:00');
      }
    }
  }, [isEditing, scheduledAt]);

  const handleSave = async () => {
    if (editedContent.trim() !== '') {
      let finalSchedule: Date | null = null;
      if (isScheduleEnabled && tempDate && tempTime) {
        finalSchedule = new Date(`${tempDate}T${tempTime}`);
      }
      
      await updatePost(id, editedContent, editedImageUrl || null, editedPlaylistId, finalSchedule);
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

  const CardContent = () => (
    <>
      <div className={`${isMaximized ? 'w-full h-96' : 'w-full h-48'} relative overflow-hidden bg-gray-100`}>
        {isEditing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-50 border-b">
            {editedImageUrl ? (
              <img src={editedImageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
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
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
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
          imageUrl && <img src={imageUrl} alt="Post Visual" className="w-full h-full object-cover" />
        )}
      </div>
      
      <div className={`p-4 bg-gray-50 flex-grow ${isMaximized ? 'overflow-y-auto' : ''}`}>
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={`w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white ${isMaximized ? 'min-h-[300px]' : 'min-h-[100px]'}`}
              placeholder="Post content..."
              autoFocus
            />
            
            <div className="bg-white p-3 rounded-lg border shadow-inner space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Playlist Assignment</label>
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-gray-400" />
                  <select 
                    value={editedPlaylistId || ''} 
                    onChange={(e) => setEditedPlaylistId(e.target.value ? Number(e.target.value) : null)}
                    className="flex-grow text-xs p-1.5 border rounded-md outline-none bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="">None</option>
                    {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-orange-400" /> Precision Schedule
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Enable</span>
                    <input 
                      type="checkbox" 
                      checked={isScheduleEnabled}
                      onChange={(e) => setIsScheduleEnabled(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
                
                {isScheduleEnabled && (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1.5 p-1.5 border rounded bg-orange-50/20">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <input 
                        type="date" 
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="bg-transparent text-[10px] outline-none flex-grow"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 border rounded bg-orange-50/20">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <input 
                        type="time" 
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className="bg-transparent text-[10px] outline-none flex-grow"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 mt-1 border-t">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Post
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              {currentPlaylist ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  <List className="w-3 h-3" /> {currentPlaylist.name}
                </div>
              ) : <div />}
              
              {scheduledAt && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}
            </div>
            <p className={`${isMaximized ? 'text-lg' : 'text-sm'} text-gray-800 whitespace-pre-wrap leading-relaxed`}>
              {content}
            </p>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col w-full max-w-sm mb-4 group relative">
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {!isEditing && (
            <>
              <button onClick={() => setIsMaximized(true)} className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-blue-600 transition-colors" title="Full Screen View"><Maximize2 className="w-4 h-4" /></button>
              <button onClick={() => setIsEditing(true)} className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-blue-600 transition-colors" title="Edit Card"><Pencil className="w-4 h-4" /></button>
              <button onClick={handleDelete} className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm border text-gray-600 hover:text-red-600 transition-colors" title="Delete Card"><Trash2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (confirm('Post this to LinkedIn immediately?')) await postNow(id); }} className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm border border-blue-700 text-white transition-colors" title="Post Now"><Send className="w-4 h-4" /></button>
            </>
          )}
        </div>
        <CardContent />
      </div>

      {isMaximized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <button onClick={() => { setIsMaximized(false); setIsEditing(false); }} className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg z-20 text-gray-500 hover:text-gray-800 transition-all"><X className="w-6 h-6" /></button>
            <div className="flex flex-col h-full"><CardContent /></div>
            <div className="p-4 bg-white border-t flex justify-between items-center">
              <div className="flex gap-2">
                {!isEditing && <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors"><Pencil className="w-4 h-4" /> Edit Content</button>}
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
              {!isEditing && <button onClick={async () => { if (confirm('Post this to LinkedIn immediately?')) { await postNow(id); setIsMaximized(false); } }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"><Send className="w-4 h-4" /> Post Now</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
