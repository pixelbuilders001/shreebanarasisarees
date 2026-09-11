"use client";

import React, { Component, ReactNode } from 'react';
import { HomepageSection as HomepageSectionType } from '../../types/homepage-sections';
import { HorizontalSection } from './HorizontalSection';
import { GridSection } from './GridSection';
import { BannerSection } from './BannerSection';
import { CategoryCardsSection } from './CategoryCardsSection';
import { PinterestGrid } from './PinterestGrid';

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
    switch (style) {
      case 'horizontal':
        return <HorizontalSection section={section} />;
      case 'grid':
        return <GridSection section={section} />;
      case 'banner':
      case 'banner_showcase':
      case 'banners_showcase':
        return <BannerSection section={section} />;
      case 'category_cards':
        return <CategoryCardsSection section={section} />;
      case 'pinterest_grid':
        return <PinterestGrid section={section} />;
      default:
        return <HorizontalSection section={section} />;
    }
  };

  return (
    <SectionErrorBoundary sectionTitle={section.title || section.id}>
      {renderContent()}
    </SectionErrorBoundary>
  );
};
