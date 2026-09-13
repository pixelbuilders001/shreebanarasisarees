"use client";

import React, { Component, ReactNode } from 'react';
import { HomepageSection as HomepageSectionType } from '../../types/homepage-sections';
import { HorizontalSection } from './HorizontalSection';
import { GridSection } from './GridSection';
import { BannerSection } from './BannerSection';
import { CategoryCardsSection } from './CategoryCardsSection';
import { PinterestGrid } from './PinterestGrid';
import { FeaturedSection } from './FeaturedSection';
import { CarouselSection } from './CarouselSection';
import { OfferTimerSection } from './OfferTimerSection';

const sectionRenderers: Record<string, React.ComponentType<{ section: HomepageSectionType }>> = {
  horizontal: HorizontalSection,
  grid: GridSection,
  banner: BannerSection,
  banner_showcase: BannerSection,
  banners_showcase: BannerSection,
  category_cards: CategoryCardsSection,
  pinterest_grid: PinterestGrid,
  featured: FeaturedSection,
  carousel: CarouselSection,
  product_carousel: CarouselSection,
  offer_timer: OfferTimerSection,
};

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionTitle: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`Error rendering homepage section "${this.props.sectionTitle}":`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return null to silently skip the broken section while keeping the rest of the homepage functional
      return null;
    }
    return this.props.children;
  }
}

interface HomepageSectionProps {
  section: HomepageSectionType;
}

export const HomepageSection: React.FC<HomepageSectionProps> = ({ section }) => {
  if (!section) return null;

  // Render by display_style
  const renderContent = () => {
    const style = (section.display_style || '').toLowerCase().replace(/[\s-]+/g, '_');
    const Renderer = sectionRenderers[style] || HorizontalSection;
    return <Renderer section={section} />;
  };

  return (
    <SectionErrorBoundary sectionTitle={section.title || section.id}>
      {renderContent()}
    </SectionErrorBoundary>
  );
};
