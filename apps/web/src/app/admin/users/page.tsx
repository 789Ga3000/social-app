"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  UserMinus, 
  UserPlus, 
  UserX, 
  UserCheck, 
  Mail, 
  Calendar,
  Wallet
} from 'lucide-react';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users list
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(res => res.data),
  });

  const users = usersData?.users || [];

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isDisabled }: { userId: string; isDisabled: boolean }) =>
      api.patch(`/admin/users/${userId}/status`, { isDisabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Change user role mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'USER' | 'ADMIN' }) =>
      api.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const filteredUsers = users.filter((u: any) => {
    const search = searchTerm.toLowerCase();
    return (
      u.username?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      (u.displayName && u.displayName.toLowerCase().includes(search))
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
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">User Moderation</h1>
        <p className="text-ink/50 text-sm mt-1">Manage user roles, credentials, and access permissions.</p>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-ink/40">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search users by name, username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-white/50 rounded-2xl text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-sm text-sm"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-white/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/50">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/50">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/50">Wallet Balance</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/50">Joined</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/50">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink/40 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item: any) => {
                  const hasProfile = !!item.profile;
                  const joinedDate = item.createdAt ? new Date(item.createdAt) : null;
                  const isPendingStatus = toggleStatusMutation.isPending && (toggleStatusMutation.variables as any)?.userId === item.id;
                  const isPendingRole = changeRoleMutation.isPending && (changeRoleMutation.variables as any)?.userId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition duration-150">
                      {/* User Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Circle Avatar */}
                          <div className="w-10 h-10 rounded-full bg-brand-light/30 text-brand flex items-center justify-center font-bold text-sm shadow-inner uppercase">
                            {item.username ? item.username[0] : '?'}
                          </div>
                          <div>
                            <div className="font-bold text-ink text-sm">
                              {item.displayName || 'No Display Name'}
                            </div>
                            <div className="text-ink/40 text-xs flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium">@{item.username}</span>
                              <span>•</span>
                              <Mail size={12} />
                              <span>{item.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 shadow-sm">
                            <ShieldAlert size={12} />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/60 bg-slate-100 px-2.5 py-1 rounded-full">
                            USER
                          </span>
                        )}
                      </td>

                      {/* Wallet Balance */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink font-semibold">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Wallet size={14} />
                          <span>{item.profile?.starsBalance?.toLocaleString() || 0} ⭐</span>
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-ink/50">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>{joinedDate ? format(joinedDate, 'MMM d, yyyy') : 'Unknown'}</span>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isDisabled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Role Button */}
                          <button
                            onClick={() => changeRoleMutation.mutate({
                              userId: item.id,
                              role: item.role === 'ADMIN' ? 'USER' : 'ADMIN'
                            })}
                            disabled={isPendingRole}
                            title={item.role === 'ADMIN' ? 'Demote to USER' : 'Elevate to ADMIN'}
                            className={`p-2 rounded-xl transition border shadow-sm ${
                              item.role === 'ADMIN'
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                                : 'bg-white border-line text-ink/60 hover:border-indigo-400 hover:text-indigo-600'
                            }`}
                          >
                            {item.role === 'ADMIN' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            onClick={() => toggleStatusMutation.mutate({
                              userId: item.id,
                              isDisabled: !item.isDisabled
                            })}
                            disabled={isPendingStatus}
                            title={item.isDisabled ? 'Enable account' : 'Disable account'}
                            className={`p-2 rounded-xl transition border shadow-sm ${
                              item.isDisabled
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            {item.isDisabled ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
