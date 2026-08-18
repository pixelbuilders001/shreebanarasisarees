"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, DbCampaign } from '../data/supabase';

interface CampaignSectionProps {
  slot: 'top' | 'middle' | 'bottom';
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({ slot }) => {
  const [campaign, setCampaign] = useState<DbCampaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function getCampaignForSlot() {
      try {
        // 1. Fetch slot data from homepage_campaign_slots
        const { data: slotData, error: slotError } = await supabase
          .from('homepage_campaign_slots')
          .select('campaign_id, is_visible')
          .eq('slot_key', slot)
          .single();

        if (slotError || !slotData || !slotData.is_visible || !slotData.campaign_id) {
          if (isMounted) {
            setCampaign(null);
            setLoading(false);
          }
          return;
        }

        // 2. Fetch campaign details
        const { data: campaignData, error: campError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', slotData.campaign_id)
          .eq('status', 'active')
          .single();

        if (campError || !campaignData) {
          if (isMounted) {
            setCampaign(null);
            setLoading(false);
          }
          return;
        }

        // 3. Verify date validation (start_date <= now <= end_date)
        const now = new Date();
        const startDate = new Date(campaignData.start_date);
        const endDate = campaignData.end_date ? new Date(campaignData.end_date) : null;

        if (now < startDate || (endDate && now > endDate)) {
          if (isMounted) {
            setCampaign(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setCampaign(campaignData as DbCampaign);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Error loading campaign for slot ${slot}:`, err);
        if (isMounted) {
          setCampaign(null);
          setLoading(false);
        }
      }
    }

    getCampaignForSlot();

    return () => {
      isMounted = false;
    };
  }, [slot]);

  if (loading || !campaign) {
    return null;
  }

  return (
    <section className="my-4 sm:my-8 max-w-7xl mx-auto px-4 animate-fade-in">
      {/* Campaign Header Details (Centered) - Only render if title is provided */}
      {campaign.title && campaign.title.trim() !== '' && (
        <div className="text-center mb-3 sm:mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-px bg-gold/50"></div>
            <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
              Exclusive Collection
            </span>
            <div className="w-8 h-px bg-gold/50"></div>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
            {campaign.title}
          </h2>
          <div className="w-16 h-0.5 bg-maroon mx-auto my-3"></div>
          {campaign.subtitle && campaign.subtitle.trim() !== '' && (
            <p className="text-sm text-dark-brown/65 max-w-xl mx-auto leading-relaxed font-light">
              {campaign.subtitle}
            </p>
          )}
        </div>
      )}

      <Link
        href={`/collections/${campaign.slug}`}
        className="group block relative overflow-hidden rounded-xl sm:rounded-2xl border border-gold/15 hover:border-gold/35 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all duration-300 hover:-translate-y-0.5"
      >
        <picture className="block w-full">
          {campaign.mobile_banner_url && (
            <source media="(max-width: 640px)" srcSet={campaign.mobile_banner_url} />
          )}
          <img
            src={campaign.desktop_banner_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200"}
            alt={campaign.name}
            className="w-full aspect-[3/1] sm:aspect-[1024/331] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"
          />
        </picture>
        {/* Subtle premium gold glow overlay on hover */}
        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>
    </section>
  );
};
