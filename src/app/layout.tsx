import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'NoteSwift',
  description: 'A comprehensive note-taking application with advanced features.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
