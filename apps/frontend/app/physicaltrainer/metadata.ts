import { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    title: 'Physical Trainer Dashboard - Hockey Hub',
    description: 'Manage training sessions, workouts, and player fitness with Hockey Hub\'s comprehensive physical trainer tools.',
    keywords: [
      'hockey training',
      'physical trainer',
      'workout management',
      'athlete fitness',
      'sports training',
      'hockey conditioning',
      'strength training',
      'agility training',
    ],
    openGraph: {
      title: 'Physical Trainer Dashboard - Hockey Hub',
      description: 'Professional training management for hockey teams',
      type: 'website',
      images: [
        {
          url: '/og-physical-trainer.png',
          width: 1200,
          height: 630,
          alt: 'Hockey Hub Physical Trainer Dashboard',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Physical Trainer Dashboard - Hockey Hub',
      description: 'Professional training management for hockey teams',
      images: ['/og-physical-trainer.png'],
    },
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
  };
}