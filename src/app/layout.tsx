import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/lib/QueryProvider';
import { ChessProvider } from '@/lib/ChessContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChessMind - AI Chess Coach',
  description: 'Your personal AI chess coach. Connect your Chess.com or Lichess account for personalized analysis and training.',
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
