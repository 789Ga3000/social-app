"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  Search, 
  Trash2, 
  RotateCcw, 
  User, 
  Calendar, 
  Eye, 
  AlertCircle,
  Video
} from 'lucide-react';

export default function AdminPosts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch posts list
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['adminPosts'],
    queryFn: () => api.get('/admin/posts').then(res => res.data),
  });

  const posts = postsData?.posts || [];

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.delete(`/admin/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Restore post mutation
  const restorePostMutation = useMutation({
    mutationFn: (postId: string) => api.patch(`/admin/posts/${postId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const filteredPosts = posts.filter((p: any) => {
    const search = searchTerm.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(search) ||
      p.author?.username?.toLowerCase().includes(search) ||
      p.author?.displayName?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        <div className="h-12 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Post Moderation</h1>
        <p className="text-ink/50 text-sm mt-1">Review, delete, or restore shared posts across the community.</p>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-ink/40">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search posts by caption, author or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-white/50 rounded-2xl text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-sm text-sm"
        />
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full bg-white border border-white/50 rounded-3xl p-12 text-center text-ink/40 text-sm">
            No posts found matching your search.
          </div>
        ) : (
          filteredPosts.map((post: any) => {
            const createdDate = post.createdAt ? new Date(post.createdAt) : null;
            const isDeleted = !!post.deletedAt;
            const isPendingDelete = deletePostMutation.isPending && deletePostMutation.variables === post.id;
            const isPendingRestore = restorePostMutation.isPending && restorePostMutation.variables === post.id;
            const isVid = post.imageUrl && (post.imageUrl.endsWith('.mp4') || post.imageUrl.endsWith('.mov') || post.imageUrl.includes('video/'));

            return (
              <div 
                key={post.id} 
                className={`bg-white border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200 ${
                  isDeleted ? 'border-red-100 bg-red-50/10 opacity-75' : 'border-white/50'
                }`}
              >
                {/* Header & Author */}
                <div className="p-5 flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-light/30 text-brand flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                      {post.author?.username ? post.author.username[0] : '?'}
                    </div>
                    <div>
                      <div className="font-bold text-ink text-sm leading-tight">
                        {post.author?.displayName || 'No Display Name'}
                      </div>
                      <div className="text-ink/40 text-xs flex items-center gap-1.5 mt-0.5 font-medium">
                        <span>@{post.author?.username}</span>
                        <span>•</span>
                        <Calendar size={12} />
                        <span>{createdDate ? format(createdDate, 'MMM d, yyyy') : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5">
                    {isDeleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        <AlertCircle size={10} />
                        DELETED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        ACTIVE
                      </span>
                    )}
                    <span className="text-xs font-semibold text-ink/50 flex items-center gap-1">
                      <Eye size={12} />
                      <span>{post.viewsCount || 0} views</span>
                    </span>
                  </div>
                </div>

                {/* Media Preview (If any) */}
                {post.imageUrl && (
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden flex items-center justify-center border-y border-line">
                    {isVid ? (
                      <div className="flex flex-col items-center justify-center text-ink/40 gap-2">
                        <Video size={32} />
                        <span className="text-xs font-medium">Video Content</span>
                      </div>
                    ) : (
                      <img 
                        src={post.imageUrl} 
                        alt="Post media" 
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                )}

                {/* Body & Caption */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-ink/70 text-sm leading-relaxed whitespace-pre-wrap italic">
                    "{post.caption || 'No Caption'}"
                  </p>

                  <div className="pt-2 border-t border-line flex justify-between items-center">
                    <span className="text-ink/30 text-xs font-mono select-all">
                      ID: {post.id}
                    </span>
                    
                    {/* Action buttons */}
                    {isDeleted ? (
                      <button
                        onClick={() => restorePostMutation.mutate(post.id)}
                        disabled={isPendingRestore}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-100 shadow-sm transition"
                      >
                        <RotateCcw size={14} />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => deletePostMutation.mutate(post.id)}
                        disabled={isPendingDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold border border-red-100 shadow-sm transition"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
