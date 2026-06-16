"use client";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { NotificationsPopover } from './notifications-popover';
import api from '@/lib/api';
import { Home, User as UserIcon, LogOut, MessageSquare, Shield } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="sticky top-4 z-50 px-4">
      <nav className="max-w-5xl mx-auto h-16 flex items-center justify-between px-6 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up">
        <Link href="/" className="font-bold text-lg sm:text-xl tracking-tight text-ink flex items-center gap-2 transition hover:scale-105">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/30">
            <MessageSquare color="white" size={18} strokeWidth={2.5} />
          </div>
          <span className="hidden sm:inline">Cool</span><span className="text-brand sm:inline hidden">genz</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-brand transition-all hover:-translate-y-0.5">
                  <Shield size={20} className="sm:hidden" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-brand transition-all hover:-translate-y-0.5">
                <Home size={20} className="sm:hidden" />
                <span className="hidden sm:inline">Feed</span>
              </Link>
              <NotificationsPopover />
              <Link href="/profile" className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-brand transition-all hover:-translate-y-0.5">
                <UserIcon size={20} className="sm:hidden" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-semibold text-coral/80 hover:text-coral transition-all hover:-translate-y-0.5" title="Logout">
                <LogOut size={20} className="sm:hidden" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-ink/70 hover:text-brand transition-all hover:-translate-y-0.5">Log In</Link>
              <Link href="/signup" className="text-sm font-semibold bg-brand text-white px-5 py-2 rounded-full shadow-md shadow-brand/20 hover:bg-brand-hover hover:shadow-lg transition-all hover:-translate-y-0.5">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
