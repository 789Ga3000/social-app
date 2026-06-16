"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Flame, Star, Sparkles, Trophy, CheckCircle2, RefreshCw, Gift } from 'lucide-react';

export function GamificationSidebar() {
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);

  // Fetch full profile info (includes stars balance, streak, creator level, etc.)
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
  });

  // Fetch daily missions
  const { data: missionsData, isLoading: isMissionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const res = await api.get('/users/me/missions');
      return res.data.missions;
    },
  });

  // Spin Wheel Mutation
  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/users/me/spin');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`🎉 Congratulations! You won ${data.reward} ⭐ Stars!`, {
        icon: '🎡',
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Already spun today!');
    },
    onSettled: () => {
      setIsSpinning(false);
    }
  });

  // Claim Mission Mutation
  const claimMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const res = await api.post(`/users/me/missions/${missionId}/claim`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Stars claimed and added to your wallet! 💰');
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to claim reward');
    }
  });

  const handleSpin = () => {
    setIsSpinning(true);
    // Suspense delay
    setTimeout(() => {
      spinMutation.mutate();
    }, 1200);
  };

  const getMissionTitle = (type: string) => {
    switch (type) {
      case 'UPLOAD_POST': return 'Upload a Post';
      case 'RECEIVE_LIKES': return 'Receive 5 Likes';
      case 'WRITE_COMMENTS': return 'Write 3 Comments';
      default: return 'Daily Task';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasSpunToday = profileData?.profile?.lastSpinDate === todayStr;

  if (isProfileLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-60 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const profile = profileData?.profile || {};

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* 1. Wallet & Streak Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-pink-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {profile.creatorLevel || 'Bronze Creator 🥉'}
          </span>
          <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{profile.currentStreak || 0} Days</span>
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <span className="text-sm text-slate-400 font-medium block">Total Balance</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold tracking-tight text-white">
              {profile.starsBalance || 0}
            </span>
            <span className="text-xl font-bold text-brand-light">⭐ Stars</span>
          </div>
        </div>

        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Lifetime Earned</span>
          <span className="font-semibold text-white">{profile.lifetimeStars || 0} ⭐</span>
        </div>
      </div>

      {/* 2. Daily Lucky Spin Card */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20 mb-4">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-bold text-ink text-base">Daily Lucky Spin</h3>
        <p className="text-xs text-ink/50 mt-1 mb-4 leading-relaxed">
          Spin once every 24 hours to win up to 100 Stars!
        </p>

        <button
          onClick={handleSpin}
          disabled={hasSpunToday || isSpinning}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            hasSpunToday
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-tr from-brand to-brand-hover text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {isSpinning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : hasSpunToday ? (
            'Claimed Today'
          ) : (
            <>
              <Sparkles className="h-4 w-4 fill-white" />
              <span>SPIN WHEEL</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Daily Missions */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center">
            <Gift className="h-4 w-4 text-coral" />
          </div>
          <h3 className="font-bold text-ink text-base">Daily Missions</h3>
        </div>

        {isMissionsLoading ? (
          <div className="space-y-4 py-2">
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : !missionsData || missionsData.length === 0 ? (
          <p className="text-sm text-ink/50 py-4 text-center">No missions for today</p>
        ) : (
          <div className="space-y-4">
            {missionsData.map((mission: any) => {
              const pct = Math.min((mission.progress / mission.target) * 100, 100);
              return (
                <div key={mission.id} className="p-3 bg-shell/50 rounded-2xl border border-line/30 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-ink">{getMissionTitle(mission.type)}</div>
                      <div className="text-[10px] text-ink/40 mt-0.5">Reward: +{mission.rewardStars} ⭐</div>
                    </div>
                    <span className="text-[10px] font-bold text-ink/50 bg-white border border-line/50 px-2 py-0.5 rounded-full shrink-0">
                      {mission.progress}/{mission.target}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-brand'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Action */}
                  <div className="flex justify-end mt-1">
                    {mission.claimed ? (
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-slate-400" />
                        <span>Claimed</span>
                      </span>
                    ) : mission.completed ? (
                      <button
                        onClick={() => claimMutation.mutate(mission.id)}
                        disabled={claimMutation.isPending}
                        className="bg-green-500 text-white hover:bg-green-600 px-3 py-1 rounded-xl text-[10px] font-bold shadow-md shadow-green-500/15 hover:shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0"
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <span className="text-[10px] text-brand font-semibold">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
