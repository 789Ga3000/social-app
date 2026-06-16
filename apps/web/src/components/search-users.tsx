"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

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
      const res = await api.get(`/users/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.data;
    },
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div className="relative mb-6 sm:mb-8 z-30">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-ink/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl pl-12 pr-10 py-3.5 text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 focus:bg-white shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300 text-sm sm:text-base"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 p-1 rounded-full text-ink/40 hover:text-ink hover:bg-slate-100 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {query && (
        <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-50 animate-fade-in-up">
          {isLoading ? (
            <div className="p-4 text-center text-ink/50 text-sm">Searching...</div>
          ) : data?.users?.length > 0 ? (
            data.users.map((user: any) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 p-3.5 hover:bg-slate-50/80 transition-colors"
                onClick={() => setQuery('')}
              >
                <div className="w-9 h-9 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-extrabold shadow-inner shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-ink">{user.displayName || user.username}</div>
                  <div className="text-xs text-ink/50 font-medium">@{user.username}</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-ink/50 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
