import React from 'react';
import { Metadata } from 'next';
import { fetchFamilyPoll } from '../../../data/supabase';
import FamilyVoteClient from './FamilyVoteClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shreebanarasisarees.in';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const poll = await fetchFamilyPoll(resolvedParams.slug);

  if (!poll) {
    return {
      title: "Family Saree Poll | Shree Banarasi Sarees",
      description: "Vote for your favorite traditional saree.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Pick the primary saree image from the candidate items
  const firstItem = poll.items?.[0];
  const firstSaree = firstItem?.product;
  let ogImageUrl = firstSaree?.images?.[0] || '/my_wishlist.webp';

  if (!ogImageUrl.startsWith('http://') && !ogImageUrl.startsWith('https://')) {
    ogImageUrl = `${siteUrl}${ogImageUrl.startsWith('/') ? '' : '/'}${ogImageUrl}`;
  }

  const title = `🌸 ${poll.creator_name} is choosing a saree ❤️`;
  const description = `Help ${poll.creator_name} pick the best saree for ${poll.occasion}! Tap to vote for your favorite (no sign-up required).`;
  const canonicalUrl = `${siteUrl}/vote/${poll.slug}`;

  return {
    title: `${title} | Shree Banarasi Sarees`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Shree Banarasi Sarees",
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 1067,
          alt: `${poll.creator_name} is choosing a saree`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function FamilyVotePage({ params }: PageProps) {
  const resolvedParams = await params;
  const initialPoll = await fetchFamilyPoll(resolvedParams.slug);

  return <FamilyVoteClient slug={resolvedParams.slug} initialPoll={initialPoll} />;
}
