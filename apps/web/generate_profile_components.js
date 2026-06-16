const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const files = {
  'components/profile-header.tsx': `"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isFollowing: boolean;
  };
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwnProfile = user?.username === profile.username;

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (profile.isFollowing) {
        await api.delete(\`/users/\${profile.id}/follow\`);
      } else {
        await api.post(\`/users/\${profile.id}/follow\`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-sand mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">{profile.displayName || profile.username}</h1>
            <div className="text-ink/60 mb-2">@{profile.username}</div>
            {profile.bio && <p className="text-ink max-w-md">{profile.bio}</p>}
          </div>
        </div>
        
        {!isOwnProfile && user && (
          <button
            onClick={() => toggleFollowMutation.mutate()}
            disabled={toggleFollowMutation.isPending}
            className={\`px-6 py-2 rounded-full font-medium transition-colors \${
              profile.isFollowing
                ? 'bg-shell text-ink border border-sand hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-primary text-white hover:bg-primary/90'
            }\`}
          >
            {profile.isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <div className="flex gap-8 mt-8 border-t border-sand pt-6">
        <div className="text-center">
          <div className="text-xl font-bold text-ink">{profile.postsCount}</div>
          <div className="text-sm text-ink/60 font-medium">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-ink">{profile.followersCount}</div>
          <div className="text-sm text-ink/60 font-medium">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-ink">{profile.followingCount}</div>
          <div className="text-sm text-ink/60 font-medium">Following</div>
        </div>
      </div>
    </div>
  );
}
`,

  'components/search-users.tsx': `"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

export function SearchUsers() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search-users', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { users: [] };
      const res = await api.get(\`/users/search?q=\${encodeURIComponent(debouncedQuery)}\`);
      return res.data;
    },
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div className="relative mb-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
        className="w-full bg-white border border-sand rounded-xl px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
      />
      
      {query && (
        <div className="absolute top-full mt-2 w-full bg-white border border-sand rounded-xl shadow-lg z-10 overflow-hidden max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-ink/60 text-sm">Searching...</div>
          ) : data?.users?.length > 0 ? (
            data.users.map((user: any) => (
              <Link
                key={user.id}
                href={\`/profile/\${user.username}\`}
                className="flex items-center gap-3 p-3 hover:bg-shell transition-colors"
                onClick={() => setQuery('')}
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-ink">{user.displayName || user.username}</div>
                  <div className="text-xs text-ink/60">@{user.username}</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-ink/60 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
`,

  'app/profile/[username]/page.tsx': `"use client";
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
      const res = await api.get(\`/users/\${username}/profile\`);
      return res.data;
    },
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', profile?.userId],
    queryFn: async () => {
      const res = await api.get(\`/posts/user/\${profile?.userId}\`);
      return res.data;
    },
    enabled: !!profile?.userId,
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
              id: profile.userId,
              username: profile.username || username,
              displayName: profile.displayName,
              bio: profile.bio,
              followersCount: profile.followersCount,
              followingCount: profile.followingCount,
              postsCount: profile.postsCount,
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
