import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { FeedContainer } from '@/components/feed-container';

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('access_token');

  if (!hasSession) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-shell">
      <Navbar />
      <FeedContainer />
    </main>
  );
}
