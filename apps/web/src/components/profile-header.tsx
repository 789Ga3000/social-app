"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
    bio: string | null;
    websiteUrl?: string | null;
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
        await api.delete(`/users/${profile.id}/follow`);
      } else {
        await api.post(`/users/${profile.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white mb-8 overflow-hidden animate-fade-in-up">
      {/* Cover Photo Area */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-brand to-brand-hover relative">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center text-brand text-3xl sm:text-4xl font-bold overflow-hidden shadow-xl border-4 border-white relative z-10">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </div>
            
            <div className="pb-2">
              <h1 className="text-3xl font-bold text-ink tracking-tight">{profile.displayName || profile.username}</h1>
              <div className="text-ink/50 font-medium text-lg mt-0.5">@{profile.username}</div>
            </div>
          </div>
          
          <div className="pb-2 flex gap-3">
            {!isOwnProfile && user && (
              <button
                onClick={() => toggleFollowMutation.mutate()}
                disabled={toggleFollowMutation.isPending}
                className={`px-8 py-2.5 rounded-full font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                  profile.isFollowing
                    ? 'bg-shell/80 backdrop-blur text-ink border border-line hover:bg-coral hover:text-white hover:border-coral shadow-none'
                    : 'bg-brand text-white hover:bg-brand-hover shadow-brand/20 hover:shadow-lg'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {isOwnProfile && (
              <a href="/profile/edit" className="px-6 py-2.5 rounded-full font-bold bg-shell/80 text-ink border border-line hover:bg-line/50 transition-all shadow-sm hover:-translate-y-0.5">
                Edit Profile
              </a>
            )}
          </div>
        </div>

        {profile.bio && <p className="text-ink/80 max-w-2xl text-lg leading-relaxed mt-4">{profile.bio}</p>}
        {profile.websiteUrl && (
          <a 
            href={profile.websiteUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 mt-4 text-brand hover:text-brand-hover font-semibold transition-colors bg-brand-light/30 px-4 py-1.5 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            {profile.websiteUrl.replace(/^https?:\/\//, '')}
          </a>
        )}

        <div className="flex justify-between sm:justify-start gap-4 sm:gap-12 mt-6 sm:mt-8 pt-6 border-t border-line/40">
          <div className="text-center group cursor-pointer flex-1 sm:flex-none">
            <div className="text-xl sm:text-2xl font-black text-ink group-hover:text-brand transition-colors">{profile.postsCount}</div>
            <div className="text-xs sm:text-sm text-ink/50 font-bold tracking-wide uppercase mt-0.5">Posts</div>
          </div>
          <div className="text-center group cursor-pointer flex-1 sm:flex-none border-l sm:border-l-0 border-line/30 pl-4 sm:pl-0">
            <div className="text-xl sm:text-2xl font-black text-ink group-hover:text-brand transition-colors">{profile.followersCount}</div>
            <div className="text-xs sm:text-sm text-ink/50 font-bold tracking-wide uppercase mt-0.5">Followers</div>
          </div>
          <div className="text-center group cursor-pointer flex-1 sm:flex-none border-l sm:border-l-0 border-line/30 pl-4 sm:pl-0">
            <div className="text-xl sm:text-2xl font-black text-ink group-hover:text-brand transition-colors">{profile.followingCount}</div>
            <div className="text-xs sm:text-sm text-ink/50 font-bold tracking-wide uppercase mt-0.5">Following</div>
          </div>
        </div>
      </div>
    </div>
  );
}
