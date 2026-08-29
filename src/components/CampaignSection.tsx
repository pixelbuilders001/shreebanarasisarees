"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, DbCampaign, fetchActiveCampaigns } from '../data/supabase';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholder';

interface CampaignSectionProps {
  slot: 'top' | 'middle' | 'bottom';
  initialCampaign?: DbCampaign | null;
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({ slot, initialCampaign }) => {
  const [campaign, setCampaign] = useState<DbCampaign | null>(initialCampaign || null);
  const [loading, setLoading] = useState<boolean>(initialCampaign === undefined && !initialCampaign);

  useEffect(() => {
    let isMounted = true;

    async function getCampaignForSlot() {
      try {
        // 1. Try fetching slot mapping from homepage_campaign_slots
        const { data: slotData } = await supabase
          .from('homepage_campaign_slots')
          .select('campaign_id, is_visible')
          .eq('slot_key', slot)
          .single();

        const now = new Date();

        if (slotData && slotData.is_visible && slotData.campaign_id) {
          const { data: campaignData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', slotData.campaign_id)
            .eq('status', 'active')
            .single();

          if (campaignData) {
            const startDate = new Date(campaignData.start_date);
            const endDate = campaignData.end_date ? new Date(campaignData.end_date) : null;
            if (now >= startDate && (!endDate || now <= endDate)) {
              if (isMounted) {
                setCampaign(campaignData as DbCampaign);
                setLoading(false);
              }
              return;
            }
          }
        }

        // 2. Fallback: Fetch active campaigns directly from `campaigns` table
        const activeCampaigns = await fetchActiveCampaigns();

        if (activeCampaigns && activeCampaigns.length > 0) {
          // Assign slots: top = 0, middle = 1, bottom = 2
          const slotIndex = slot === 'top' ? 0 : slot === 'middle' ? 1 : 2;
          const targetCampaign = activeCampaigns[slotIndex] || activeCampaigns[0];

          if (targetCampaign) {
            if (isMounted) {
              setCampaign(targetCampaign);
              setLoading(false);
            }
            return;
          }
        }

        if (isMounted) {
          setCampaign(null);
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

    if (!initialCampaign) {
      getCampaignForSlot();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [slot, initialCampaign]);

  if (loading || !campaign) {
    return null;
  }

  return (
    <section className="my-1 sm:my-3 max-w-7xl mx-auto px-4 animate-fade-in">
      {/* Campaign Header Details (Centered) - Only render if title is provided */}
      {campaign.title && campaign.title.trim() !== '' && (
        <div className="text-center mb-2 sm:mb-4 px-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-8 h-px bg-[#B08A3C]/50" />
            <span className="text-[10px] sm:text-xs text-[#B08A3C] uppercase tracking-[0.2em] font-bold block font-sans">
              Exclusive Campaign
            </span>
            <div className="w-8 h-px bg-[#B08A3C]/50" />
          </div>
          <h2 className="font-serif text-xl sm:text-3xl font-extrabold tracking-wide text-[#292524]">
            {campaign.title}
          </h2>
          <div className="w-12 sm:w-16 h-0.5 bg-[#6B1725] mx-auto my-1.5 sm:my-2" />
          {campaign.subtitle && campaign.subtitle.trim() !== '' && (
            <p className="text-xs sm:text-sm text-[#6B625D] max-w-xl mx-auto leading-relaxed font-light">
              {campaign.subtitle}
            </p>
          )}
        </div>
      )}

      <Link
        href={`/collections/${campaign.slug}`}
        className="group block relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#B08A3C]/20 hover:border-[#B08A3C]/50 hover:shadow-[0_12px_28px_rgba(107,23,37,0.15)] transition-all duration-300"
      >
        <picture className="block w-full">
          {campaign.mobile_banner_url && (
            <source media="(max-width: 640px)" srcSet={campaign.mobile_banner_url} />
          )}
          <img
            src={campaign.desktop_banner_url || campaign.mobile_banner_url || NO_IMAGE_PLACEHOLDER}
            alt={campaign.name || campaign.title || "Active Campaign Banner"}
            className="w-full h-auto sm:aspect-[1024/331] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"
          />
        </picture>
        {/* Gold Glow Overlay */}
        <div className="absolute inset-0 bg-[#B08A3C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>
    </section>
  );
};
