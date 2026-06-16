"use client";

import React from 'react';
import { Navbar } from '@/components/navbar';
import { Scale, Users, HeartHandshake, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfService() {
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
              <Scale size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Terms of Service</h1>
              <p className="text-ink/50 text-xs mt-1">Last Updated: June 15, 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-ink/75 leading-relaxed">
            <p>
              By accessing or using the <strong>Coolgenz</strong> social platform, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before creating an account.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                1. Eligibility & Accounts
              </h2>
              <p>
                To create an account, you must provide accurate registration details (email, username, and password). You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                2. User Conduct & Content Policies
              </h2>
              <p>
                We strive to build a healthy and welcoming community. You agree not to upload, publish, or share any content that:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1.5 text-xs text-ink/60">
                <li>Contains hate speech, harassment, abuse, or violence.</li>
                <li>Infringes upon copyrights, patents, trademarks, or proprietary rights.</li>
                <li>Is fraudulent, deceitful, or malicious (e.g. bots, automated scraping).</li>
                <li>Contains explicit adult content or illegal substances promotion.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                3. Content Moderation & Reporting System
              </h2>
              <p>
                To safeguard our community, Coolgenz runs a real-time moderation and user feedback engine:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1.5 text-xs text-ink/60">
                <li><strong>Report Post/User:</strong> Any user can report a post or a creator for violating policies. Reports are sent directly to the System Administrators.</li>
                <li><strong>Block User:</strong> You can block any user to immediately sever followings, hide their content from your view, and prevent them from finding or viewing your profile.</li>
                <li><strong>Moderation Action:</strong> Administrators reserve the right to review reports, soft-delete content (posts/comments), or suspend/ban user accounts that breach these terms.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand"></span>
                4. Rewards and Wallet Economy
              </h2>
              <p>
                Gamification Stars (⭐) earned via daily logins, lucky spins, and daily missions are virtual tokens provided to reward creator engagement. We reserve the right to audit streaks, balances, or transaction histories, and adjust balances if we discover bugs or fraudulent gaming of the rewards loop.
              </p>
            </section>

            <section className="space-y-3 border-t border-line pt-6">
              <h2 className="text-base font-bold text-ink">Acceptance of Terms</h2>
              <p className="text-xs text-ink/60">
                Creating an account or signing into Coolgenz implies full acceptance of these terms. If you do not agree, please deactivate your account or discontinue your use of our platform immediately.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
