"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CreatePost } from './create-post';
import { PostCard } from './post-card';
import { PostSkeleton } from './post-skeleton';
import { SearchUsers } from './search-users';
import { GamificationSidebar } from './gamification-sidebar';

export function FeedContainer() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await api.get('/posts');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
          <div className="hidden lg:block space-y-6 animate-pulse">
            <div className="h-44 bg-slate-200/40 rounded-3xl" />
            <div className="h-48 bg-slate-200/40 rounded-3xl" />
            <div className="h-60 bg-slate-200/40 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Failed to load feed.</div>;
  }

  const posts = data?.posts || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left Feed Column */}
        <div>
          <SearchUsers />
          <CreatePost />
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 px-6 text-ink/50 bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <p className="font-bold text-lg text-ink">No posts yet</p>
                <p className="text-sm text-ink/50 mt-1">Follow some creators or write your first post to start sharing!</p>
              </div>
            ) : (
              posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="hidden lg:block">
          <GamificationSidebar />
        </div>
      </div>
    </div>
  );
}
