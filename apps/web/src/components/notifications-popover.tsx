"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: isOpen,
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = countData?.count || 0;

  const getMessage = (n: any) => {
    const actorName = n.actor.displayName || n.actor.username;
    if (n.type === 'LIKE') return `${actorName} liked your post`;
    if (n.type === 'COMMENT') return `${actorName} commented on your post`;
    if (n.type === 'FOLLOW') return `${actorName} started following you`;
    return 'New notification';
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            readAllMutation.mutate();
          }
        }}
        className="relative text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
      >
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-line rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-line font-bold text-ink">Notifications</div>
          <div className="divide-y divide-line">
            {!notifData ? (
              <div className="p-4 text-center text-sm text-ink/60">Loading...</div>
            ) : notifData.notifications?.length === 0 ? (
              <div className="p-4 text-center text-sm text-ink/60">No notifications</div>
            ) : (
              notifData.notifications.map((n: any) => (
                <Link
                  key={n.id}
                  href={n.type === 'FOLLOW' ? `/profile/${n.actor.username}` : '/'}
                  className={`block p-4 hover:bg-shell transition-colors ${!n.read ? 'bg-brand/5' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center text-brand text-xs font-bold shrink-0 overflow-hidden">
                      {n.actor.avatarUrl ? (
                        <img src={n.actor.avatarUrl} alt={n.actor.username} className="w-full h-full object-cover" />
                      ) : (
                        n.actor.username[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-ink">{getMessage(n)}</div>
                      <div className="text-xs text-ink/60 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
