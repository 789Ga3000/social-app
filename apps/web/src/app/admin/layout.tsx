"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-store';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  FileText, 
  MessageSquare, 
  ShieldAlert, 
  Mail,
  KeyRound,
  Loader2
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both Email and Password');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });
      
      const loggedUser = res.data?.user;
      if (loggedUser && loggedUser.role === 'ADMIN') {
        setUser(loggedUser);
        toast.success('Successfully logged in as Admin!');
        router.refresh();
      } else {
        toast.error('Access Denied: You are not an administrator.');
        await api.post('/auth/logout').catch(() => {});
        setUser(null);
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid admin credentials';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If not authenticated as ADMIN, render Admin Login Form
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Toaster position="top-center" />
        <Navbar />
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <ShieldAlert size={28} />
              </div>
              <h1 className="text-2xl font-bold text-ink tracking-tight">Admin Portal</h1>
              <p className="text-ink/50 text-xs">Enter your administrator credentials to access the moderation panel.</p>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 mt-1 text-[11px] text-indigo-600 font-semibold leading-relaxed">
                ID: <span className="font-mono text-indigo-800">admin@social.com</span> | Pass: <span className="font-mono text-indigo-800">admin123</span>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/60 uppercase tracking-wider">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-ink/35">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@social.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/60 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-ink/35">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover shadow-lg shadow-brand/25 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Access Moderation</span>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="py-6 text-center text-xs text-ink/30 font-medium">
          Protected Administration Panel
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: UsersIcon },
    { href: '/admin/posts', label: 'Posts', icon: FileText },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 flex-1">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sticky top-24">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-brand-hover flex items-center justify-center shadow-md shadow-brand/20">
                <ShieldAlert color="white" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-ink text-sm">Moderation</h2>
                <p className="text-brand text-xs font-semibold uppercase tracking-wider">Admin Panel</p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-brand text-white shadow-md shadow-brand/20 scale-[1.02]'
                        : 'text-ink/60 hover:text-brand hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
