import React from 'react';
import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';

const BASE_URL = 'https://rankforge-gate.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // Title with template for child pages
  title: {
    default: 'RANKFORGE — AI-Powered GATE Mock Testing & Rank Prediction',
    template: '%s | RANKFORGE',
  },

  description:
    'AI-Powered GATE mock testing, rank prediction, and weak topic recommendations engine. Practice with real GATE-style questions, get AI-driven insights, and predict your GATE rank.',

  keywords: [
    'GATE',
    'GATE CSE',
    'GATE mock test',
    'GATE rank prediction',
    'GATE preparation',
    'GATE previous year questions',
    'GATE AI',
    'mock test engine',
    'rank prediction',
    'weak topic analysis',
    'GATE 2026',
    'computer science engineering',
    'RANKFORGE',
  ],

  authors: [{ name: 'RANKFORGE Team' }],
  creator: 'RANKFORGE',
  publisher: 'RANKFORGE',

  // Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Google Search Console verification
  verification: {
    google: 'M2cVNyiiJT4QL-Bwu3P7sD9b7sLzA5Mt2Zzx-NChWsM',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'RANKFORGE',
    title: 'RANKFORGE — AI-Powered GATE Mock Testing & Rank Prediction',
    description:
      'Practice GATE-style questions, predict your rank with AI, and get personalized weak topic recommendations.',
    images: [
      {
        url: '/logo_transparent.png',
        width: 512,
        height: 512,
        alt: 'RANKFORGE Logo',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'RANKFORGE — AI-Powered GATE Mock Testing & Rank Prediction',
    description:
      'Practice GATE-style questions, predict your rank with AI, and get personalized weak topic recommendations.',
    images: ['/logo_transparent.png'],
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },

  // Canonical
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent text-zinc-100 font-sans antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
