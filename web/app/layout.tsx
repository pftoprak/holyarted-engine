import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
});

const body = Manrope({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Holyarted — Read the map within you',
  description: 'Discover your personal energy map through your name and birth date.',
  openGraph: {
    title: 'Holyarted — Read the map within you',
    description: 'Discover your personal energy map through your name and birth date.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Holyarted — İçindeki haritayı oku' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Holyarted — Read the map within you',
    description: 'Discover your personal energy map through your name and birth date.',
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
