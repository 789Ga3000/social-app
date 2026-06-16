const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const files = {
  'components/navbar.tsx': `"use client";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-shell/80 backdrop-blur-md border-b border-sand">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-ink">
          Social<span className="text-primary">App</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Feed</Link>
              <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">Profile</Link>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Log In</Link>
              <Link href="/signup" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
`,

  'components/create-post.tsx': `"use client";
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function CreatePost() {
  const [caption, setCaption] = useState('');
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post('/posts', { caption: text });
      return res.data;
    },
    onSuccess: () => {
      setCaption('');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;
    createPostMutation.mutate(caption);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-sand mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-shell resize-none rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-ink"
          rows={3}
        />
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={createPostMutation.isPending || !caption.trim()}
            className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
`,

  'components/post-card.tsx': `"use client";
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import Link from 'next/link';

interface PostCardProps {
  post: {
    id: string;
    caption: string;
    imageUrl: string | null;
    createdAt: string;
    author: { id: string; username: string; displayName: string | null };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        await api.delete(\`/posts/\${post.id}/like\`);
      } else {
        await api.post(\`/posts/\${post.id}/like\`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const res = await api.get(\`/posts/\${post.id}/comments\`);
      return res.data;
    },
    enabled: showComments,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post(\`/posts/\${post.id}/comments\`, { text });
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-sand mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
          {post.author.username[0].toUpperCase()}
        </div>
        <div>
          <Link href={\`/profile/\${post.author.username}\`} className="font-medium text-ink hover:underline">
            {post.author.displayName || post.author.username}
          </Link>
          <div className="text-xs text-ink/60">@{post.author.username}</div>
        </div>
      </div>
      <p className="text-ink mb-4 whitespace-pre-wrap">{post.caption}</p>
      
      <div className="flex items-center gap-6 border-t border-sand pt-4 mt-4">
        <button
          onClick={() => toggleLikeMutation.mutate()}
          className={\`flex items-center gap-2 text-sm font-medium transition-colors \${
            post.isLiked ? 'text-red-500' : 'text-ink/60 hover:text-red-500'
          }\`}
        >
          {post.isLiked ? '♥' : '♡'} {post.likesCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-primary transition-colors"
        >
          💬 {post.commentsCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-sand">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newComment.trim()) createCommentMutation.mutate(newComment);
            }}
            className="flex gap-2 mb-4"
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-shell rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Post
            </button>
          </form>

          <div className="space-y-3">
            {commentsData?.comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {comment.author.username[0].toUpperCase()}
                </div>
                <div className="bg-shell p-3 rounded-2xl flex-1">
                  <div className="font-medium text-sm text-ink mb-1">
                    {comment.author.displayName || comment.author.username}
                  </div>
                  <div className="text-sm text-ink/80">{comment.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(srcDir, filePath);
  const dirPath = path.dirname(fullPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log('Created:', filePath);
}
