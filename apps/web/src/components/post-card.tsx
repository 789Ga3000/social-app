"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useVideoStore } from '@/lib/video-store';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Trash2, MoreHorizontal, Flag, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: {
    id: string;
    caption: string;
    imageUrl: string | null;
    createdAt: string;
    author: { id: string; username: string; displayName: string | null; avatarUrl?: string | null };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    isFollowingAuthor?: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const isGlobalMuted = useVideoStore((state) => state.isGlobalMuted);
  const setGlobalMuted = useVideoStore((state) => state.setGlobalMuted);
  const currentlyPlaying = useVideoStore((state) => state.currentlyPlaying);
  const setCurrentlyPlaying = useVideoStore((state) => state.setCurrentlyPlaying);

  // Pause this video if another video starts playing
  useEffect(() => {
    if (currentlyPlaying && currentlyPlaying !== post.id && videoRef.current) {
      videoRef.current.pause();
    }
  }, [currentlyPlaying, post.id]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (post.isFollowingAuthor) {
        await api.delete(`/users/${post.author.id}/follow`);
      } else {
        await api.post(`/users/${post.author.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const handleDoubleTap = useCallback(() => {
    if (!post.isLiked) {
      toggleLikeMutation.mutate();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  }, [post.isLiked, toggleLikeMutation]);

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete post');
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate();
    }
  };

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Comment deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete comment');
    }
  });

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const reportPostMutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.post('/reports', {
        targetId: post.id,
        type: 'POST',
        reason,
      });
    },
    onSuccess: () => {
      setShowMenu(false);
      toast.success('Post reported successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to report post');
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/blocks/${post.author.id}`);
    },
    onSuccess: () => {
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success(`User @${post.author.username} blocked`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to block user');
    }
  });

  const handleReport = () => {
    const reason = window.prompt('Enter reason for reporting this post:');
    if (reason && reason.trim()) {
      reportPostMutation.mutate(reason.trim());
    }
  };

  const handleBlock = () => {
    if (window.confirm(`Are you sure you want to block @${post.author.username}? You won't see their posts or comments.`)) {
      blockUserMutation.mutate();
    }
  };

  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const res = await api.get(`/posts/${post.id}/comments`);
      return res.data;
    },
    enabled: showComments,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post(`/posts/${post.id}/comments`, { text });
      return res.data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-3xl shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-white mb-6 sm:mb-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500"
    >
      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-brand-light to-brand/20 rounded-full flex items-center justify-center text-brand font-bold overflow-hidden shrink-0 shadow-inner">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt={post.author.username} className="w-full h-full object-cover" />
            ) : (
              post.author.username[0].toUpperCase()
            )}
          </div>
          <div>
            <Link href={`/profile/${post.author.username}`} className="font-bold text-ink hover:text-brand transition-colors text-base">
              {post.author.displayName || post.author.username}
            </Link>
            <div className="flex items-center gap-2 text-sm text-ink/50 font-medium">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          {user && user.id !== post.author.id && (
            <button
              onClick={() => toggleFollowMutation.mutate()}
              disabled={toggleFollowMutation.isPending}
              className={`ml-2 text-xs font-bold px-3 py-1 rounded-full transition-all active:scale-95 ${
                post.isFollowingAuthor
                  ? 'bg-slate-100 text-slate-500 hover:bg-coral hover:text-white hover:border-coral border border-slate-200 shadow-none'
                  : 'bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/10'
              }`}
            >
              {toggleFollowMutation.isPending ? '...' : post.isFollowingAuthor ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        
        {user?.id === post.author.id ? (
          <button 
            onClick={handleDelete}
            disabled={deletePostMutation.isPending}
            className="p-2 text-ink/40 hover:text-coral transition-colors rounded-full hover:bg-coral/10 active:scale-95 disabled:opacity-50"
            title="Delete post"
          >
            <Trash2 size={20} />
          </button>
        ) : (
          user && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-ink/40 hover:text-brand transition-colors rounded-full hover:bg-slate-50 active:scale-95"
                title="Options"
              >
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-line rounded-2xl shadow-lg py-2 z-20 animate-fade-in">
                    <button
                      onClick={handleReport}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-ink/70 hover:text-brand hover:bg-slate-50 transition"
                    >
                      <Flag size={14} />
                      <span>Report Post</span>
                    </button>
                    <button
                      onClick={handleBlock}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-coral hover:bg-coral/5 transition"
                    >
                      <UserX size={14} />
                      <span>Block User</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        )}
      </div>
      <p className="text-ink/90 mb-4 sm:mb-5 whitespace-pre-wrap text-base sm:text-lg leading-relaxed">{post.caption}</p>
      
      {post.imageUrl && (
        <div 
          className="relative mb-4 sm:mb-5 rounded-2xl overflow-hidden border border-line/30 shadow-sm bg-shell/30 select-none"
          onDoubleClick={handleDoubleTap}
        >
          {post.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
            <video 
              ref={videoRef}
              src={post.imageUrl} 
              controls 
              muted={isGlobalMuted} 
              loop 
              playsInline
              onPlay={() => setCurrentlyPlaying(post.id)}
              onVolumeChange={(e) => {
                const video = e.currentTarget;
                const isMutedNow = video.muted || video.volume === 0;
                if (isGlobalMuted !== isMutedNow) {
                  setGlobalMuted(isMutedNow);
                }
              }}
              className="w-full max-h-[600px] bg-black" 
            />
          ) : (
            <img src={post.imageUrl} alt="Post media" className="w-full max-h-[600px] object-cover pointer-events-none" loading="lazy" />
          )}
          
          {/* Double Tap Heart Animation */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <Heart className="text-white drop-shadow-2xl fill-white" size={100} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="flex items-center gap-8 border-t border-line/40 pt-4 mt-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleLikeMutation.mutate()}
          className={`flex items-center gap-2.5 font-semibold transition-all hover:scale-105 ${
            post.isLiked ? 'text-coral' : 'text-ink/50 hover:text-coral'
          }`}
        >
          <Heart 
            className={post.isLiked ? "fill-coral" : ""} 
            size={22} 
            strokeWidth={post.isLiked ? 0 : 2} 
          />
          {post.likesCount}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2.5 font-semibold text-ink/50 hover:text-brand transition-all hover:scale-105"
        >
          <MessageCircle size={22} />
          {post.commentsCount}
        </motion.button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-line/40">
              {/* Quick Emojis */}
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none py-1">
                {['❤️', '😂', '🔥', '🙌', '👏', '😢', '😍', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewComment((prev) => prev + emoji)}
                    className="text-base sm:text-lg hover:scale-125 transition-transform px-2 py-1 bg-slate-50 border border-line/30 rounded-xl hover:bg-slate-100/80 active:scale-95 font-sans"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newComment.trim()) createCommentMutation.mutate(newComment);
                }}
                className="flex gap-3 items-center mb-6"
              >
                <div className="w-9 h-9 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 overflow-hidden shadow-inner">
                  {(user as any)?.profile?.avatarUrl ? (
                    <img src={(user as any).profile.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>

                <div className="flex-1 relative flex items-center bg-shell/60 rounded-full border border-line/50 focus-within:ring-2 focus-within:ring-brand/30 focus-within:bg-white focus-within:border-brand/40 transition-all">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent px-5 py-2.5 text-sm font-medium focus:outline-none placeholder:text-ink/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="bg-brand text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-hover shadow-md shadow-brand/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Post
                </button>
              </form>

              <div className="space-y-4">
                {commentsData?.comments?.map((comment: any) => {
                  const isOwnComment = comment.author.id === user?.id;
                  const canDelete = isOwnComment || user?.role === 'ADMIN';
                  return (
                    <div key={comment.id} className="flex gap-3 group relative animate-fade-in-up">
                      <div className="w-9 h-9 bg-gradient-to-tr from-brand-light to-brand/20 rounded-full flex items-center justify-center text-brand text-sm font-bold shrink-0 overflow-hidden shadow-inner mt-0.5">
                        {comment.author.avatarUrl ? (
                          <img src={comment.author.avatarUrl} alt={comment.author.username} className="w-full h-full object-cover" />
                        ) : (
                          comment.author.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="bg-shell/50 px-4 py-3 rounded-2xl rounded-tl-sm flex-1 border border-line/30 group-hover:bg-shell/80 transition-colors pr-10">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-ink">
                            {comment.author.displayName || comment.author.username}
                          </span>
                          <span className="text-[10px] text-ink/40 font-medium">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-sm text-ink/80 leading-relaxed">{comment.text}</div>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          className="absolute right-3 top-3 p-1.5 text-ink/30 hover:text-coral hover:bg-coral/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shrink-0"
                          title="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
