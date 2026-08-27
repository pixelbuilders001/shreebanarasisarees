import React from 'react';
import { Metadata } from 'next';
import HomeClient from '../components/HomeClient';
import { fetchProducts, fetchActiveCampaigns, fetchActiveHeroBanners } from '../data/supabase';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shree Banarasi Sarees | Banarasi & Traditional Sarees in Samastipur",
  description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees, Samastipur, Bihar. Explore elegant sarees for weddings, festivals and special occasions.",
  alternates: {
    canonical: "https://shreebanarasisarees.in",
  },
  openGraph: {
    title: "Shree Banarasi Sarees | Banarasi & Traditional Sarees in Samastipur",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees, Samastipur, Bihar. Explore elegant sarees for weddings, festivals and special occasions.",
    url: "https://shreebanarasisarees.in",
    siteName: "Shree Banarasi Sarees",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://shreebanarasisarees.in/og_image.jpg",
        width: 1024,
        height: 537,
        alt: "Shree Banarasi Sarees Showcase",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Shree Banarasi Sarees | Banarasi & Traditional Sarees in Samastipur",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees, Samastipur, Bihar. Explore elegant sarees for weddings, festivals and special occasions.",
    images: ["https://shreebanarasisarees.in/og_image.jpg"],
  }
};

export default async function Home() {
  const [dbProducts, activeCampaigns, heroBanners] = await Promise.all([
    fetchProducts(),
    fetchActiveCampaigns(),
    fetchActiveHeroBanners()
  ]);
  // 1. Organization Schema
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Shree Banarasi Sarees",
    "alternateName": "श्री बनारसी साड़ियाँ",
    "url": "https://shreebanarasisarees.in",
    "logo": "https://shreebanarasisarees.in/brand_logo.png",
    "description": "Premium traditional Indian ethnic fashion showroom in Samastipur, Bihar. Exquisite handloom sarees, Banarasi, Chikankari, Organza and wedding bridal collections.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+916203909946",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  };

  // 2. Local Business Schema (ClothingStore)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Shree Banarasi Sarees",
    "image": "https://shreebanarasisarees.in/brand_logo.png",
    "@id": "https://shreebanarasisarees.in/#store",
    "url": "https://shreebanarasisarees.in",
    "telephone": "+916203909946",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rudauli Chowk, Harpur Aloth",
      "addressLocality": "Samastipur",
      "addressRegion": "Bihar",
      "postalCode": "848103",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.827918,
      "longitude": 85.7546103
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "10:00",
      "closes": "20:30"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <HomeClient allProducts={dbProducts} activeCampaigns={activeCampaigns} heroBanners={heroBanners} />
    </>
  );
}
