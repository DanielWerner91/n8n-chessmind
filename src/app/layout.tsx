import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/lib/QueryProvider';
import { ChessProvider } from '@/lib/ChessContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://chessmind.pro'),
  title: 'ChessMind - AI Chess Coach',
  description: 'Your personal AI chess coach. Connect your Chess.com or Lichess account for personalized analysis and training.',
  openGraph: {
    title: 'ChessMind - AI Chess Coach',
    description: 'Personalized chess analysis and training plans powered by AI. Connect your Chess.com or Lichess account.',
    url: 'https://chessmind.pro',
    siteName: 'ChessMind',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChessMind - AI Chess Coach',
    description: 'Personalized chess analysis and training plans powered by AI.',
  },
  alternates: {
    canonical: 'https://chessmind.pro',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          <ChessProvider>
            {children}
          </ChessProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
