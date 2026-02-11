'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PostCard } from './PostCard';
import { updatePostStatus, createPost, createChannel, deleteChannel, toggleChannel } from '@/lib/actions';
import { Plus, Image as ImageIcon, Radio, Settings2, Power, Trash2 } from 'lucide-react';

interface Post {
  id: number;
  content: string;
  imageUrl?: string | null;
  status: string;
  playlistId?: number | null;
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
}

interface KanbanBoardProps {
  initialInventory: Post[];
  initialQueue: Post[];
  playlists: Playlist[];
  initialChannels: Channel[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  initialInventory, 
  initialQueue, 
  playlists,
  initialChannels 
}) => {
  const [inventory, setInventory] = useState(initialInventory);
  const [queue, setQueue] = useState(initialQueue);
  const [channels, setChannels] = useState(initialChannels);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  useEffect(() => {
    setInventory(initialInventory);
    setQueue(initialQueue);
    setChannels(initialChannels);
  }, [initialInventory, initialQueue, initialChannels]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    let sourceList = source.droppableId === 'inventory' ? [...inventory] : [...queue];
    let destList = destination.droppableId === 'inventory' ? [...inventory] : [...queue];
    
    const [removed] = sourceList.splice(source.index, 1);
    
    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, removed);
      if (source.droppableId === 'inventory') setInventory(sourceList);
      else setQueue(sourceList);
    } else {
      destList.splice(destination.index, 0, removed);
      setInventory(source.droppableId === 'inventory' ? sourceList : destList);
      setQueue(source.droppableId === 'queue' ? sourceList : destList);
      
      const newStatus = destination.droppableId === 'inventory' ? 'inventory' : 'queued';
      updatePostStatus(removed.id, newStatus).catch(err => console.error(err));
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100vh-100px)] gap-6 p-6 overflow-hidden">
        {/* Inventory Column - Main Area */}
        <div className="flex-[1.5] flex flex-col bg-gray-100 rounded-xl p-4 min-w-[350px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">📦 Inventory</h2>
            <button onClick={() => setIsAddingPost(!isAddingPost)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
              <Plus className={`w-6 h-6 ${isAddingPost ? 'rotate-45 text-red-500' : 'text-blue-600'}`} />
            </button>
          </div>

          {isAddingPost && (
            <form 
              action={async (formData: FormData) => {
                const content = formData.get('content') as string;
                const imageFile = formData.get('imageFile') as File;
                const manualUrl = formData.get('imageUrl') as string;
                let imageUrl = manualUrl || '';

                if (imageFile && imageFile.size > 0) {
                  const uploadData = new FormData();
                  uploadData.append('file', imageFile);
                  
                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    imageUrl = data.url;
                  }
                }

                if (content) {
                  await createPost(content, imageUrl);
                  setIsAddingPost(false);
                }
              }}
              className="bg-white p-4 rounded-lg shadow-md mb-6 border-2 border-blue-100 animate-in fade-in slide-in-from-top-2"
            >
              <textarea
                name="content"
                placeholder="What's the post about? (Emojis will be added automatically)"
                className="w-full p-3 border rounded-md text-sm min-h-[100px] mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <div className="space-y-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 p-2 rounded-md border border-dashed border-gray-300 transition-colors w-full">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-500">Upload Image</span>
                  <input
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Or URL:</span>
                  <input
                    name="imageUrl"
                    type="text"
                    placeholder="https://..."
                    className="flex-grow p-1.5 border rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add to Inventory
              </button>
            </form>
          )}

          <Droppable droppableId="inventory">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
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

        {/* Daily Queue Column - Narrower */}
        <div className="flex-1 flex flex-col bg-blue-50 border-2 border-blue-100 rounded-xl p-4 min-w-[300px] max-w-[380px]">
          <h2 className="text-xl font-bold mb-4">🗓️ Daily Queue</h2>
          <Droppable droppableId="queue">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {queue.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id.toString()} index={index}>
                    {(p) => (
                      <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                        <PostCard 
                          id={post.id} 
                          content={post.content} 
                          imageUrl={post.imageUrl} 
                          playlistId={post.playlistId}
                          scheduledAt={post.scheduledAt}
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

        {/* Channels Column - Narrowest */}
        <div className="flex-[0.8] flex flex-col bg-purple-50 border-2 border-purple-100 rounded-xl p-4 min-w-[280px] max-w-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-900">📡 Channels</h2>
            <button onClick={() => setIsAddingChannel(!isAddingChannel)} className="p-1 hover:bg-purple-200 rounded-full transition-colors text-purple-600">
              <Plus className={`w-6 h-6 transition-transform ${isAddingChannel ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {isAddingChannel && (
            <form action={async (fd) => {
              const name = fd.get('name') as string;
              const type = fd.get('type') as any;
              const plId = fd.get('playlistId') ? Number(fd.get('playlistId')) : null;
              if (name) { await createChannel(name, type, plId); setIsAddingChannel(false); }
            }} className="bg-white p-4 rounded-lg shadow-md mb-6 border-2 border-purple-200">
              <input name="name" placeholder="Channel Name" className="w-full p-2 border rounded-md text-sm mb-2 outline-none" required />
              <select name="type" className="w-full p-2 border rounded-md text-sm mb-2 outline-none">
                <option value="playlist">Playlist Stream</option>
                <option value="random">Random Discovery</option>
              </select>
              <select name="playlistId" className="w-full p-2 border rounded-md text-sm mb-4 outline-none">
                <option value="">Select Playlist...</option>
                {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 rounded-md hover:bg-purple-700">Create Channel</button>
            </form>
          )}

          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {channels.map(channel => (
              <div key={channel.id} className={`p-4 rounded-lg border-2 transition-all ${channel.isActive ? 'bg-white border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${channel.isActive ? 'text-purple-600 animate-pulse' : 'text-gray-400'}`} />
                    <h3 className="font-bold text-gray-900 truncate max-w-[120px]">{channel.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleChannel(channel.id, !channel.isActive)} className={`p-1 rounded hover:bg-gray-100 ${channel.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteChannel(channel.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex flex-col gap-1">
                  <span>{channel.type === 'playlist' ? 'Stream' : 'Discovery'}</span>
                  {channel.type === 'playlist' && <span className="text-purple-600 truncate">{playlists.find(p => p.id === channel.playlistId)?.name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};
