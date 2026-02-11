'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PostCard } from './PostCard';
import { updatePostStatus, createPost } from '@/lib/actions';
import { Plus, Image as ImageIcon } from 'lucide-react';

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

interface KanbanBoardProps {
  initialInventory: Post[];
  initialQueue: Post[];
  playlists: Playlist[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialInventory, initialQueue, playlists }) => {
  const [inventory, setInventory] = useState(initialInventory);
  const [queue, setQueue] = useState(initialQueue);

  useEffect(() => {
    setInventory(initialInventory);
    setQueue(initialQueue);
  }, [initialInventory, initialQueue]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle moving between columns or reordering
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
      updatePostStatus(removed.id, newStatus).catch(err => {
        console.error('Failed to update post status:', err);
        // Optional: Revert state if needed
      });
    }
  };

  const [isAdding, setIsAdding] = useState(false);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100vh-100px)] gap-6 p-6 overflow-hidden">
        {/* Inventory Pane */}
        <div className="flex-1 flex flex-col bg-gray-100 rounded-xl p-4 min-w-[350px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📦 Inventory <span className="text-sm font-normal text-gray-500">({inventory.length})</span>
            </h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Plus className={`w-6 h-6 transition-transform ${isAdding ? 'rotate-45 text-red-500' : 'text-blue-600'}`} />
            </button>
          </div>

          {isAdding && (
            <form 
              action={async (formData: FormData) => {
                const content = formData.get('content') as string;
                const imageFile = formData.get('imageFile') as File;
                let imageUrl = '';

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
                  setIsAdding(false);
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
              <div className="flex items-center gap-2 mb-4">
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
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-grow overflow-y-auto pr-2 custom-scrollbar"
              >
                {inventory.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <PostCard 
                          id={post.id} 
                          content={post.content} 
                          imageUrl={post.imageUrl} 
                          playlistId={post.playlistId}
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

        {/* Action Zone / Queue Pane */}
        <div className="flex-1 flex flex-col bg-blue-50 border-2 border-blue-100 rounded-xl p-4 min-w-[350px]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🗓️ 7-Day Queue <span className="text-sm font-normal text-gray-500">({queue.length}/7)</span>
          </h2>
          <Droppable droppableId="queue">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-grow overflow-y-auto pr-2 custom-scrollbar"
              >
                {queue.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <PostCard 
                          id={post.id} 
                          content={post.content} 
                          imageUrl={post.imageUrl} 
                          playlistId={post.playlistId}
                          playlists={playlists}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {queue.length === 0 && (
                  <div className="border-2 border-dashed border-blue-200 rounded-lg h-32 flex items-center justify-center text-blue-300 italic">
                    Drag items here to schedule
                  </div>
                )}
              </div>
            )}
          </Droppable>
          
          <div className="mt-4 pt-4 border-t border-blue-100">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
              Post Now (Immediate)
            </button>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};
