import type { Metadata } from 'next';
import { DM_Sans, Newsreader } from 'next/font/google';
import './globals.css';

const display = Newsreader({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600'],
});

const body = DM_Sans({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Holyarted — Know how you move through life',
  description: 'A refined Human Design profile built from your own answers.',
  openGraph: {
    title: 'Holyarted — Know how you move through life',
    description: 'A refined Human Design profile built from your own answers.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Holyarted — Know how you move through life' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Holyarted — Know how you move through life',
    description: 'A refined Human Design profile built from your own answers.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>{children}</body>
    </html>
  );
}
