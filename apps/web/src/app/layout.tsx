import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Coolgenz',
  description: 'Coolgenz app - Instagram-inspired social media platform',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', borderRadius: '100px' } }} />
        </Providers>
      </body>
    </html>
  );
}
