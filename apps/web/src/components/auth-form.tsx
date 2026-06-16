'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { SessionUser, useAuthStore } from '@/lib/auth-store';

type AuthResponse = {
  user: SessionUser;
};

type Mode = 'login' | 'signup';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload =
        mode === 'signup'
          ? {
              email: String(formData.get('email')),
              username: String(formData.get('username')),
              displayName: String(formData.get('displayName')),
              password: String(formData.get('password')),
            }
          : {
              email: String(formData.get('email')),
              password: String(formData.get('password')),
            };

      return apiFetch<AuthResponse>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      setUser(data.user);
      router.push('/');
      router.refresh();
    },
    onError: (err: { message?: string | string[] }) => {
      setError(
        Array.isArray(err.message)
          ? err.message.join(', ')
          : err.message ?? 'Authentication failed',
      );
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate(new FormData(event.currentTarget));
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <Field label="Email" name="email" type="email" autoComplete="email" />
      {mode === 'signup' ? (
        <>
          <Field label="Username" name="username" autoComplete="username" />
          <Field label="Display name" name="displayName" />
        </>
      ) : null}
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
      />
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        className="h-11 w-full rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={mutation.isPending}
        type="submit"
      >
        {mutation.isPending
          ? 'Please wait...'
          : mode === 'signup'
            ? 'Create account'
            : 'Log in'}
      </button>
      {mode === 'signup' && (
        <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline text-slate-700 hover:text-brand">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline text-slate-700 hover:text-brand">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
        name={name}
        required
        type={type}
      />
    </label>
  );
}
