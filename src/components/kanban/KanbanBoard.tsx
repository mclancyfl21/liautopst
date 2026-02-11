'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PostCard } from './PostCard';
import { updatePostStatus, createPost, createChannel, deleteChannel, toggleChannel } from '@/lib/actions';
import { Plus, Image as ImageIcon, Radio, Settings2, Power, Trash2, Clock, CalendarDays, List } from 'lucide-react';

interface Post {
  id: number;
  content: string;
  imageUrl?: string | null;
  status: string;
  playlistId?: number | null;
  scheduledAt?: Date | null;
  isScheduleActive: boolean | null;
}

interface Playlist {
  id: number;
  name: string;
}

interface Channel {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  playlistId?: number | null;
  scheduleType: string;
  scheduledTime: string;
}

interface KanbanBoardProps {
  initialInventory: Post[];
  playlists: Playlist[];
  initialChannels: Channel[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  initialInventory, 
  playlists,
  initialChannels 
}) => {
  const [inventory, setInventory] = useState(initialInventory);
  const [channels, setChannels] = useState(initialChannels);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setInventory(initialInventory);
    setChannels(initialChannels);
  }, [initialInventory, initialChannels]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    let items = [...inventory];
    const [removed] = items.splice(source.index, 1);
    items.splice(destination.index, 0, removed);
    setInventory(items);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100vh-100px)] gap-6 p-6 overflow-hidden">
        {/* Inventory Column - Main Area */}
        <div className="flex-[2] flex flex-col bg-gray-100 rounded-xl p-4 min-w-[400px]">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">📦 Inventory Pool</h2>
            <button onClick={() => { setIsAddingPost(!isAddingPost); setSelectedFileName(null); }} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
              <Plus className={`w-7 h-7 ${isAddingPost ? 'rotate-45 text-red-500' : 'text-blue-600'}`} />
            </button>
          </div>

          {isAddingPost && (
            <form 
              action={async (formData: FormData) => {
                const content = formData.get('content') as string;
                const imageFile = formData.get('imageFile') as File;
                const manualUrl = formData.get('imageUrl') as string;
                const scheduledAtStr = formData.get('scheduledAt') as string;
                const isScheduleActive = formData.get('isScheduleActive') === 'on';
                const playlistId = formData.get('playlistId') ? Number(formData.get('playlistId')) : null;
                let imageUrl = manualUrl || '';

                if (imageFile && imageFile.size > 0) {
                  setIsUploading(true);
                  console.log('[UPLOAD] Starting file upload:', imageFile.name);
                  const uploadData = new FormData();
                  uploadData.append('file', imageFile);
                  
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
                    if (res.ok) { 
                      const data = await res.json(); 
                      imageUrl = data.url; 
                      console.log('[UPLOAD] Success, URL:', imageUrl);
                    } else {
                      console.error('[UPLOAD] Failed with status:', res.status);
                    }
                  } catch (err) {
                    console.error('[UPLOAD] Request error:', err);
                  } finally {
                    setIsUploading(false);
                  }
                }

                const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : null;

                if (content) { 
                  console.log('[CREATE_POST] Submitting with image:', imageUrl);
                  await createPost(content, imageUrl, scheduledAt, isScheduleActive, playlistId); 
                  setIsAddingPost(false); 
                  setSelectedFileName(null);
                }
              }}
              className="bg-white p-5 rounded-xl shadow-lg mb-8 border-2 border-blue-100 animate-in fade-in slide-in-from-top-2"
            >
              <textarea name="content" placeholder="Compose your LinkedIn post..." className="w-full p-3 border rounded-md text-sm min-h-[120px] mb-4 outline-none focus:ring-2 focus:ring-blue-500" required />
              
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200 flex-grow">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    <input 
                      name="scheduledAt" 
                      type="datetime-local" 
                      className="bg-transparent text-xs outline-none flex-grow text-gray-600 font-medium" 
                      title="Schedule precise post time"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                    <input name="isScheduleActive" type="checkbox" defaultChecked className="hidden peer" />
                    <Power className="w-4 h-4 text-gray-400 peer-checked:text-green-600 transition-colors" />
                    <span className="text-[10px] font-bold text-gray-500 peer-checked:text-green-700 uppercase tracking-tight">Active</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                  <List className="w-4 h-4 text-blue-500" />
                  <select name="playlistId" className="bg-transparent text-xs outline-none flex-grow text-gray-600 font-medium appearance-none">
                    <option value="">No Playlist (General Inventory)</option>
                    {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 p-3 rounded-md border border-dashed border-gray-300 transition-colors w-full">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{selectedFileName || 'Attach Media File'}</span>
                  <input 
                    name="imageFile" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || null)}
                  />
                </label>
                <input name="imageUrl" type="text" placeholder="Or paste image URL..." className="w-full p-2 border rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading Image...' : 'Add to Pool'}
              </button>
            </form>
          )}

          <Droppable droppableId="inventory">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex-grow overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                {inventory.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id.toString()} index={index}>
                    {(p) => (
                      <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                        <PostCard 
                          id={post.id} 
                          content={post.content} 
                          imageUrl={post.imageUrl} 
                          playlistId={post.playlistId}
                          scheduledAt={post.scheduledAt}
                          isScheduleActive={post.isScheduleActive ?? true}
                          playlists={playlists}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Channels Column - Sidebar Area */}
        <div className="flex-1 flex flex-col bg-purple-50 border-2 border-purple-100 rounded-xl p-4 min-w-[320px] max-w-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-900">📡 Active Streams</h2>
            <button onClick={() => setIsAddingChannel(!isAddingChannel)} className="p-1 hover:bg-purple-200 rounded-full transition-colors text-purple-600">
              <Plus className={`w-6 h-6 transition-transform ${isAddingChannel ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {isAddingChannel && (
            <form action={async (fd) => {
              const name = fd.get('name') as string;
              const type = fd.get('type') as any;
              const plId = fd.get('playlistId') ? Number(fd.get('playlistId')) : null;
              const scheduleType = fd.get('scheduleType') as any;
              const scheduledTime = fd.get('scheduledTime') as string;
              if (name) { 
                await createChannel(name, type, plId, scheduleType, scheduledTime); 
                setIsAddingChannel(false); 
              }
            }} className="bg-white p-5 rounded-xl shadow-lg mb-8 border-2 border-purple-200 space-y-3">
              <input name="name" placeholder="Channel Name" className="w-full p-2 border rounded-md text-sm outline-none" required />
              
              <div className="grid grid-cols-2 gap-2">
                <select name="type" className="p-2 border rounded-md text-xs outline-none">
                  <option value="playlist">Playlist Stream</option>
                  <option value="random">Random Discovery</option>
                </select>
                <select name="scheduleType" className="p-2 border rounded-md text-xs outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border">
                <Clock className="w-4 h-4 text-gray-400" />
                <input name="scheduledTime" type="time" defaultValue="09:00" className="bg-transparent text-xs outline-none flex-grow" required />
              </div>

              <select name="playlistId" className="w-full p-2 border rounded-md text-sm outline-none">
                <option value="">Select Playlist...</option>
                {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
              </select>
              
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700">Go Live</button>
            </form>
          )}

          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {channels.map(channel => (
              <div key={channel.id} className={`p-5 rounded-xl border-2 transition-all ${channel.isActive ? 'bg-white border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-5 h-5 ${channel.isActive ? 'text-purple-600 animate-pulse' : 'text-gray-400'}`} />
                    <h3 className="font-bold text-gray-900 text-lg truncate max-w-[150px]">{channel.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleChannel(channel.id, !channel.isActive)} className={`p-1.5 rounded-lg hover:bg-gray-100 ${channel.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteChannel(channel.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {channel.scheduleType} @ {channel.scheduledTime}
                    </span>
                    <span className="text-purple-600 truncate ml-2">
                      {channel.type === 'playlist' ? 'Playlist' : 'Discovery'}
                    </span>
                  </div>
                  {channel.type === 'playlist' && (
                    <div className="text-[10px] text-purple-400 truncate font-medium italic">
                      {playlists.find(p => p.id === channel.playlistId)?.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};
