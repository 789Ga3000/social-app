"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  Check, 
  Trash2, 
  Ban, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

export default function AdminReports() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => api.get('/admin/reports').then(res => res.data.reports || []),
    refetchInterval: 15000, // Poll every 15 seconds
  });

  const resolveReport = useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER' }) => {
      return api.post(`/admin/reports/${reportId}/resolve`, { action });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success(`Report resolved with action: ${variables.action}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to resolve report');
    }
  });

  const handleAction = (reportId: string, action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER') => {
    let confirmMsg = 'Are you sure you want to take this action?';
    if (action === 'DISMISS') confirmMsg = 'Dismiss this report? This will mark it as resolved with no penalty.';
    if (action === 'DELETE_POST') confirmMsg = 'Delete the reported post permanently?';
    if (action === 'BAN_USER') confirmMsg = 'Ban/Disable this user account?';

    if (window.confirm(confirmMsg)) {
      resolveReport.mutate({ reportId, action });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-slate-200 rounded-3xl"></div>
        ))}
      </div>
    );
  }

  const pendingReports = data?.filter((r: any) => r.status === 'PENDING') || [];
  const resolvedReports = data?.filter((r: any) => r.status !== 'PENDING') || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Community Reports</h1>
          <p className="text-ink/50 text-sm mt-1">Review and resolve reported posts and user profiles.</p>
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

      {/* Pending Reports */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <span>Pending Moderation ({pendingReports.length})</span>
        </h2>

        {pendingReports.length === 0 ? (
          <div className="bg-white border border-line rounded-3xl p-12 text-center text-ink/40 font-medium">
            No pending reports. Inbox is clean! ✨
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReports.map((report: any) => (
              <div 
                key={report.id} 
                className="bg-white border border-line hover:border-brand/20 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      report.type === 'POST' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      Reported {report.type}
                    </span>
                    <span className="text-xs text-ink/40">by @{report.reporterUsername}</span>
                    <span className="text-xs text-ink/30">• {new Date(report.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <div className="text-xs text-ink/40 font-bold uppercase tracking-wider mb-1">
                      {report.type === 'POST' ? 'Post Content' : 'Offending User'}
                    </div>
                    <div className="text-sm font-semibold text-ink leading-relaxed">
                      {report.targetDetail}
                    </div>
                    {report.targetSubDetail && (
                      <div className="text-xs text-ink/40 mt-1 font-medium">
                        {report.targetSubDetail}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-amber-600 font-medium">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span><strong>Reason:</strong> {report.reason}</span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 border-line pt-4 md:pt-0">
                  <button
                    onClick={() => handleAction(report.id, 'DISMISS')}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-ink/70 rounded-2xl text-xs font-bold transition duration-200 active:scale-95"
                  >
                    <Check size={14} />
                    <span>Dismiss</span>
                  </button>
                  {report.type === 'POST' && (
                    <button
                      onClick={() => handleAction(report.id, 'DELETE_POST')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-coral/10 hover:bg-coral/25 text-coral rounded-2xl text-xs font-bold transition duration-200 active:scale-95"
                    >
                      <Trash2 size={14} />
                      <span>Delete Post</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(report.id, 'BAN_USER')}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition duration-200 active:scale-95"
                  >
                    <Ban size={14} />
                    <span>Ban Creator</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Reports History */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-ink/60 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-ink/40" />
          <span>Moderation History ({resolvedReports.length})</span>
        </h2>

        {resolvedReports.length === 0 ? (
          <div className="text-xs text-ink/30 font-medium pl-2">
            No logs in history.
          </div>
        ) : (
          <div className="space-y-3 opacity-70">
            {resolvedReports.map((report: any) => (
              <div 
                key={report.id} 
                className="bg-white/50 border border-line rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink/70">
                      Report #{report.id.substring(0, 8)}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      report.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-ink/30">• resolved {new Date(report.resolvedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-ink/50">
                    Target: <span className="font-medium text-ink/70">{report.targetDetail}</span> ({report.type})
                  </div>
                  <div className="text-ink/40">
                    Reason: <span className="italic">"{report.reason}"</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
