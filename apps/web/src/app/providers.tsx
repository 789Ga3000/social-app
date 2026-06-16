'use client';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/users/me');
        if (res.data) setUser(res.data);
        return res.data;
      } catch (e) {
        return null;
      }
    },
    enabled: !user, // Only fetch if we don't have the user yet
    retry: false,
  });

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
