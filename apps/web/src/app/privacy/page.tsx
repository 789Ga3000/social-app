"use client";

import React from 'react';
import { Navbar } from '@/components/navbar';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-hover mb-6 uppercase tracking-wider transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>

        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 space-y-8">
          <div className="flex items-center gap-4 border-b border-line pb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow-inner">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Privacy Policy</h1>
              <p className="text-ink/50 text-xs mt-1">Last Updated: June 15, 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-ink/75 leading-relaxed">
            <p>
              Welcome to <strong>Coolgenz</strong>. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our mobile application and tell you about your privacy rights.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <h3 className="font-bold text-ink text-sm">Security First</h3>
                <p className="text-xs text-ink/60 leading-relaxed">We employ state-of-the-art encryption and hashing to keep your password and credentials safe.</p>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Eye size={16} />
                </div>
                <h3 className="font-bold text-ink text-sm">Transparency</h3>
                <p className="text-xs text-ink/60 leading-relaxed">We only gather the information necessary to provide you with streak tracking, rewards, and social feed metrics.</p>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <h3 className="font-bold text-ink text-sm">Control</h3>
                <p className="text-xs text-ink/60 leading-relaxed">You hold full authority over your account, including options to edit details or delete your profile and contents permanently.</p>
              </div>
            </div>

            <section className="space-y-3 pt-4">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                1. Information We Collect
              </h2>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1.5 text-xs text-ink/60">
                <li><strong>Identity Data:</strong> Username, display name, and profile photos.</li>
                <li><strong>Contact Data:</strong> Email address.</li>
                <li><strong>Technical Data:</strong> Internet protocol (IP) address, login data, browser type and version, time zone setting, and device identifiers.</li>
                <li><strong>Content Data:</strong> Posts, captions, comments, and interactions (likes, blocks, follows).</li>
                <li><strong>Gamification Data:</strong> Wallet balances (Stars ⭐), transactions log, spin records, and mission achievements.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                2. How We Use Your Information
              </h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to register your account, manage daily streaks, verify daily mission completions, deliver rewards balance updates, and run our global content moderation systems.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                3. Account Deletion Rights
              </h2>
              <p>
                We believe in giving you complete control over your data. You can initiate account deletion at any time directly through your Profile Settings. Once initiated:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1.5 text-xs text-ink/60">
                <li>Your profile is marked as deleted and deactivated.</li>
                <li>All posts and comments authored by you are soft-deleted and hidden from public feed instantly.</li>
                <li>All active login sessions are terminated immediately.</li>
              </ul>
            </section>

            <section className="space-y-3 border-t border-line pt-6">
              <h2 className="text-base font-bold text-ink">Contact Us</h2>
              <p className="text-xs text-ink/60">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at <span className="text-brand font-semibold">privacy@coolgenz.com</span>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
