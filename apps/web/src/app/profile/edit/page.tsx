'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';

type UserProfile = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  isPrivate: boolean;
  profile: {
    avatarUrl: string | null;
    bio: string | null;
    websiteUrl: string | null;
    location: string | null;
  } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { data: userProfile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<UserProfile>('/users/me'),
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let rawWebsite = String(formData.get('websiteUrl')).trim();
      if (rawWebsite && !/^https?:\/\//i.test(rawWebsite)) {
        rawWebsite = `https://${rawWebsite}`;
      }

      const payload = {
        displayName: String(formData.get('displayName')),
        avatarUrl: avatarUrl || String(formData.get('avatarUrl')).trim() || undefined,
        bio: String(formData.get('bio')),
        websiteUrl: rawWebsite || undefined,
        location: String(formData.get('location')),
        isPrivate: formData.get('isPrivate') === 'on',
      };
      return apiFetch<UserProfile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setUser({
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.displayName,
      });
      router.refresh();
    },
    onError: (err: { message?: string | string[] }) => {
      setError(
        Array.isArray(err.message)
          ? err.message.join(', ')
          : err.message ?? 'Update failed',
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      setUser(null);
      router.push('/login');
      router.refresh();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiFetch('/users/me', { method: 'DELETE' }),
    onSuccess: () => {
      setUser(null);
      toast.success('Account deleted successfully');
      router.push('/signup');
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete account');
    }
  });

  const handleDeleteAccount = () => {
    if (window.confirm('WARNING: Are you sure you want to delete your account? This action is permanent and will soft-delete all your posts and comments.')) {
      if (window.confirm('Double verification: Please confirm you want to delete your account.')) {
        deleteAccountMutation.mutate();
      }
    }
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    updateMutation.mutate(new FormData(event.currentTarget));
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-shell flex items-center justify-center">
        <div className="text-slate-500">Loading profile...</div>
      </main>
    );
  }

  if (isError || !userProfile) {
    return (
      <main className="min-h-screen bg-shell flex items-center justify-center">
        <div className="text-red-500">Failed to load profile. Please log in again.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-shell">
      <Navbar />
      
      <section className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-ink">Edit Profile</h1>
          <Link href="/profile" className="text-sm font-medium text-brand hover:underline">
            View Profile
          </Link>
        </div>
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field
              label="Display Name"
              name="displayName"
              defaultValue={userProfile.displayName || ''}
            />
            
            <input type="hidden" name="avatarUrl" value={avatarUrl ?? userProfile.profile?.avatarUrl ?? ''} />
            <AvatarUpload 
              initialUrl={userProfile.profile?.avatarUrl ?? null} 
              onUploadSuccess={(url) => setAvatarUrl(url)} 
            />

            <Field
              label="Bio"
              name="bio"
              defaultValue={userProfile.profile?.bio || ''}
            />
            <Field
              label="Website"
              name="websiteUrl"
              type="text"
              defaultValue={userProfile.profile?.websiteUrl?.replace(/^https?:\/\//i, '') || ''}
            />
            <Field
              label="Location"
              name="location"
              defaultValue={userProfile.profile?.location || ''}
            />
            
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                name="isPrivate"
                defaultChecked={userProfile.isPrivate}
                className="w-4 h-4 rounded border-line text-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-slate-700">Private Account</span>
            </label>

            {error && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            
            {success && (
              <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Profile updated successfully!
              </p>
            )}

            <button
              className="mt-6 h-11 w-full rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={updateMutation.isPending}
              type="submit"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-6">
            <h3 className="text-sm font-bold text-coral uppercase tracking-wider mb-2">Danger Zone</h3>
            <p className="text-xs text-ink/40 mb-4 leading-relaxed">Permanently delete your profile, posts, comments, and transaction records from the platform.</p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              className="h-11 px-4 bg-coral/10 hover:bg-coral/20 hover:text-white border border-coral/30 rounded-md text-sm font-semibold transition duration-200 active:scale-95 disabled:opacity-50"
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
        name={name}
        type={type}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function AvatarUpload({ initialUrl, onUploadSuccess }: { initialUrl: string | null; onUploadSuccess: (url: string) => void }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch<{ url: string }>('/media/upload', {
        method: 'POST',
        body: formData,
      });
      setUrl(res.url);
      onUploadSuccess(res.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mb-4">
      <span className="mb-1 block text-sm font-medium text-slate-700">Profile Picture</span>
      <div className="flex items-center gap-4 mt-2">
        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border border-line flex items-center justify-center">
          {url ? (
            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          )}
        </div>
        <div>
          <label className="cursor-pointer bg-white border border-line px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            {uploading ? 'Uploading...' : 'Change Avatar'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}

