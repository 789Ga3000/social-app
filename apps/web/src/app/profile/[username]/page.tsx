"use client";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Navbar } from '@/components/navbar';
import { ProfileHeader } from '@/components/profile-header';
import { PostCard } from '@/components/post-card';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}/profile`);
      return res.data;
    },
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: async () => {
      const res = await api.get(`/posts/user/${profile?.id}`);
      return res.data;
    },
    enabled: !!profile?.id,
  });

  return (
    <main className="min-h-screen bg-shell">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {profileLoading ? (
          <div className="text-center py-10 text-ink/60">Loading profile...</div>
        ) : profile ? (
          <>
            <ProfileHeader profile={{
              id: profile.id,
              username: profile.username || username,
              displayName: profile.displayName,
              avatarUrl: profile.profile?.avatarUrl,
              bio: profile.profile?.bio,
              websiteUrl: profile.profile?.websiteUrl,
              followersCount: profile.profile?.followersCount || 0,
              followingCount: profile.profile?.followingCount || 0,
              postsCount: profile.profile?.postsCount || 0,
              isFollowing: profile.isFollowing,
            }} />
            
            <div className="mt-8">
              <h2 className="text-xl font-bold text-ink mb-4">Posts</h2>
              {postsLoading ? (
                <div className="text-center py-10 text-ink/60">Loading posts...</div>
              ) : postsData?.posts?.length > 0 ? (
                <div className="space-y-6">
                  {postsData.posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-ink/60 bg-white rounded-2xl border border-sand">
                  No posts yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-red-500">Profile not found.</div>
        )}
      </div>
    </main>
  );
}
