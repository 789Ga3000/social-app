"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Coins, 
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  UserX
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then(res => res.data),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">System Overview</h1>
          <p className="text-ink/50 text-sm mt-1">Real-time statistics and community metrics.</p>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-line hover:border-brand/40 text-ink/70 hover:text-brand rounded-2xl text-xs font-semibold shadow-sm transition duration-200 active:scale-95"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
              <Users size={22} />
            </div>
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
              Community
            </span>
          </div>
          <div>
            <h3 className="text-ink/65 text-xs font-bold uppercase tracking-wider">Total Users</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-ink tracking-tight">{stats?.usersCount || 0}</span>
              <span className="text-ink/40 text-xs font-medium">registered</span>
            </div>
          </div>
        </div>

        {/* Posts Card */}
        <div className="bg-white border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-brand-light/30 flex items-center justify-center text-brand shadow-inner">
              <FileText size={22} />
            </div>
            <span className="text-xs font-semibold text-brand bg-brand-light/30 px-2.5 py-1 rounded-full">
              Content
            </span>
          </div>
          <div>
            <h3 className="text-ink/65 text-xs font-bold uppercase tracking-wider">Total Posts</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-ink tracking-tight">{stats?.postsCount || 0}</span>
              <span className="text-ink/40 text-xs font-medium">shared</span>
            </div>
          </div>
        </div>

        {/* Comments Card */}
        <div className="bg-white border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
              <MessageSquare size={22} />
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">
              Engagements
            </span>
          </div>
          <div>
            <h3 className="text-ink/65 text-xs font-bold uppercase tracking-wider">Total Comments</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-ink tracking-tight">{stats?.commentsCount || 0}</span>
              <span className="text-ink/40 text-xs font-medium">written</span>
            </div>
          </div>
        </div>

        {/* Stars Economy Card */}
        <div className="bg-white border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
              <Coins size={22} />
            </div>
            <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">
              Stars Economy
            </span>
          </div>
          <div>
            <h3 className="text-ink/65 text-xs font-bold uppercase tracking-wider">Circulating Stars</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-ink tracking-tight">{(stats?.starsTotalBalance || 0).toLocaleString()}</span>
              <span className="text-ink/40 text-xs font-medium">⭐ balance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Status Card */}
        <div className="bg-white border border-white/50 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <Users size={18} className="text-ink/50" />
            <h2 className="font-bold text-ink text-lg">User Status Breakdown</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-sm font-semibold text-ink/70">Active Accounts</span>
              </div>
              <span className="font-bold text-ink">{stats?.activeUsersCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <UserX size={16} />
                </div>
                <span className="text-sm font-semibold text-ink/70">Disabled Accounts</span>
              </div>
              <span className="font-bold text-ink">{stats?.disabledUsersCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Content Status Card */}
        <div className="bg-white border border-white/50 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <FileText size={18} className="text-ink/50" />
            <h2 className="font-bold text-ink text-lg">Content Metrics</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-ink/40 font-semibold uppercase">Active Posts</span>
              <span className="text-2xl font-bold text-ink">{stats?.activePostsCount || 0}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-ink/40 font-semibold uppercase">Deleted Posts</span>
              <span className="text-2xl font-bold text-ink">{stats?.deletedPostsCount || 0}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-ink/40 font-semibold uppercase">Active Comments</span>
              <span className="text-2xl font-bold text-ink">{stats?.activeCommentsCount || 0}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-ink/40 font-semibold uppercase">Deleted Comments</span>
              <span className="text-2xl font-bold text-ink">{stats?.deletedCommentsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
