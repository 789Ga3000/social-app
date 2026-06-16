import Link from 'next/link';
import type { Route } from 'next';

export function AuthCard({
  title,
  subtitle,
  switchHref,
  switchLabel,
  children,
}: {
  title: string;
  subtitle: string;
  switchHref: Route;
  switchLabel: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-shell px-4 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <div className="hidden md:block">
          <h1 className="text-4xl font-semibold tracking-normal text-ink">
            Coolgenz app
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
            A clean, privacy-aware foundation for profiles, feeds, stories, and
            messaging.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
          <Link
            href={switchHref}
            className="mt-5 block text-center text-sm font-medium text-brand"
          >
            {switchLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
