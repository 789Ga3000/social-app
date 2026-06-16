"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  Search, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function AdminComments() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch comments list
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['adminComments'],
    queryFn: () => api.get('/admin/comments').then(res => res.data),
  });

  const comments = commentsData?.comments || [];

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/admin/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminComments'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Restore comment mutation
  const restoreCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.patch(`/admin/comments/${commentId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminComments'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const filteredComments = comments.filter((c: any) => {
    const search = searchTerm.toLowerCase();
    return (
      c.text?.toLowerCase().includes(search) ||
      c.author?.username?.toLowerCase().includes(search) ||
      c.author?.displayName?.toLowerCase().includes(search) ||
      c.postCaption?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        <div className="h-12 bg-slate-200 rounded-2xl w-full"></div>
        <div className="h-96 bg-slate-200 rounded-3xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Comment Moderation</h1>
        <p className="text-ink/50 text-sm mt-1">Review, moderate, and manage user comments shared on posts.</p>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-ink/40">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search comments by text, author or post caption..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-white/50 rounded-2xl text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-sm text-sm"
        />
      </div>

      {/* Comments List */}
      <div className="bg-white border border-white/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="divide-y divide-line">
          {filteredComments.length === 0 ? (
            <div className="p-12 text-center text-ink/40 text-sm">
              No comments found matching your search.
            </div>
          ) : (
            filteredComments.map((comment: any) => {
              const createdDate = comment.createdAt ? new Date(comment.createdAt) : null;
              const isDeleted = !!comment.deletedAt;
              const isPendingDelete = deleteCommentMutation.isPending && deleteCommentMutation.variables === comment.id;
              const isPendingRestore = restoreCommentMutation.isPending && restoreCommentMutation.variables === comment.id;

              return (
                <div 
                  key={comment.id} 
                  className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/40 transition duration-150 ${
                    isDeleted ? 'bg-red-50/10 opacity-75' : ''
                  }`}
                >
                  {/* Left Column: Comment Meta & Content */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-brand-light/30 text-brand flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                        {comment.author?.username ? comment.author.username[0] : '?'}
                      </div>
                      
                      {/* Author */}
                      <div>
                        <span className="font-bold text-ink text-sm">
                          {comment.author?.displayName || 'No Display Name'}
                        </span>
                        <span className="text-ink/40 text-xs font-semibold ml-1.5">
                          @{comment.author?.username}
                        </span>
                      </div>

                      {/* Date */}
                      <span className="text-ink/30 text-xs flex items-center gap-1">
                        <Calendar size={12} />
                        {createdDate ? format(createdDate, 'MMM d, yyyy h:mm a') : 'Unknown'}
                      </span>

                      {/* Status Badge */}
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
                    </div>

                    {/* Comment text */}
                    <p className="text-ink/75 text-sm leading-relaxed pl-11 bg-slate-50 border border-slate-100 rounded-2xl p-4 italic">
                      "{comment.text}"
                    </p>

                    {/* Post context */}
                    <div className="flex items-center gap-1.5 text-xs text-brand/70 pl-11 font-semibold">
                      <FileText size={12} />
                      <span className="truncate">Post: {comment.postCaption || 'No Caption'}</span>
                      <span className="text-ink/20 font-mono select-all font-normal">(ID: {comment.postId})</span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-4">
                    <span className="text-[10px] text-ink/30 font-mono select-all">
                      Comment ID: {comment.id}
                    </span>

                    {isDeleted ? (
                      <button
                        onClick={() => restoreCommentMutation.mutate(comment.id)}
                        disabled={isPendingRestore}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-100 shadow-sm transition"
                      >
                        <RotateCcw size={14} />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        disabled={isPendingDelete}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold border border-red-100 shadow-sm transition"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
