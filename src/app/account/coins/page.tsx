"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useStore } from '../../../context/StoreContext';
import {
  Coins,
  Copy,
  Check,
  Share2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  ShoppingBag,
  Sparkles,
  Info,
  RefreshCw,
  Gift
} from 'lucide-react';
import {
  fetchCoinTransactions,
  fetchReferralSummary,
  fetchReferralSettings,
  StoreReferralSettings,
  DEFAULT_STORE_REFERRAL_SETTINGS,
  CoinTransaction
} from '../../../data/supabase';

function formatTransactionDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default function CoinsPage() {
  const { user, userProfile, userWallet, userWalletLoading, refreshWallet } = useStore();

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [stats, setStats] = useState({ totalInvited: 0, successfulPurchases: 0 });
  const [settings, setSettings] = useState<StoreReferralSettings>(DEFAULT_STORE_REFERRAL_SETTINGS);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

  const referralCode = userProfile?.referral_code || '';
  const shareUrl = typeof window !== 'undefined' && referralCode 
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://shreebanarsisarees.com/?ref=${referralCode}`;

  const loadData = async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const [txs, refStats, refSet] = await Promise.all([
        fetchCoinTransactions(user.id, 50),
        fetchReferralSummary(user.id),
        fetchReferralSettings()
      ]);
      setTransactions(txs);
      setStats(refStats);
      setSettings(refSet);
    } catch (err) {
      console.error('Error loading coins history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleManualRefresh = () => {
    startTransition(async () => {
      await Promise.all([refreshWallet(), loadData()]);
    });
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleWhatsAppShare = () => {
    if (!referralCode) return;
    const message = `✨ Namaste! Discover exquisite handcrafted pure silk sarees from *Shree Banarasi Sarees*.\n\nUse my referral code *${referralCode}* to explore the collection:\n${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const availableCoins = Math.floor(userWallet?.available_balance || 0);
  const pendingCoins = Math.floor(userWallet?.pending_balance || 0);
  const totalEarned = Math.floor(userWallet?.total_earned || 0);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO WALLET BALANCE CARD                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6B1725] via-[#52111C] to-[#2B060D] text-[#FAF7F0] p-6 sm:p-8 shadow-xl border border-[#B08A3C]/40">
        {/* Subtle decorative gold blur orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#B08A3C]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#B08A3C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0]/10 backdrop-blur-md border border-[#FAF7F0]/15 text-[#E5D7BF] text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles size={13} className="text-[#D4AF37]" />
              Shree Banarasi Rewards
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF7F0]">
                🪙 {availableCoins}
              </span>
              <span className="text-sm sm:text-base font-sans font-medium text-[#E5D7BF]">
                Banarasi Coins
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#FAF7F0]/75 flex items-center gap-1.5 font-light">
              <span className="font-semibold text-[#D4AF37]">1 Banarasi Coin = ₹1</span> • Spend directly at checkout
            </p>
          </div>

          {/* Quick Refresh & Secondary Balances */}
          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || userWalletLoading}
              className="inline-flex items-center gap-2 self-start sm:self-end px-3.5 py-1.5 rounded-full bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 text-[#FAF7F0] text-xs font-medium border border-[#FAF7F0]/15 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh wallet balance"
            >
              <RefreshCw size={13} className={isRefreshing || userWalletLoading ? 'animate-spin' : ''} />
              <span>Refresh Balance</span>
            </button>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <div className="bg-black/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 text-left sm:text-right">
                <span className="text-[10px] text-[#FAF7F0]/60 uppercase tracking-wider block font-semibold">
                  Pending
                </span>
                <span className="text-sm font-bold text-[#D4AF37]">
                  ₹{pendingCoins}
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 text-left sm:text-right">
                <span className="text-[10px] text-[#FAF7F0]/60 uppercase tracking-wider block font-semibold">
                  Lifetime Earned
                </span>
                <span className="text-sm font-bold text-[#FAF7F0]">
                  ₹{totalEarned}
                </span>
              </div>
            </div>
          </div>
        </div>

        {pendingCoins > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#FAF7F0]/80">
            <Info size={14} className="text-[#D4AF37] flex-shrink-0" />
            <span>
              Pending coins become available 7 days after the referred order is marked Delivered.
            </span>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. REFER & EARN SHARE BOX                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F3ECE0] shadow-[0_2px_16px_rgba(41,37,36,0.03)] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524] flex items-center gap-2">
              <Gift size={20} className="text-[#6B1725]" />
              Refer & Earn Banarasi Coins
            </h2>
            <p className="text-xs sm:text-sm text-[#6B625D] mt-1">
              Invite friends & family. When they buy their first saree, you earn Banarasi Coins!
            </p>
          </div>
        </div>

        {/* Share Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code Box */}
          <div className="bg-[#FAF7F0] border border-[#E5DEC9] p-4 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B625D] block">
                Your Referral Code
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#6B1725] tracking-wide">
                {referralCode || 'Generating...'}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              disabled={!referralCode}
              className="px-3 py-2 rounded-xl bg-white border border-[#D4C39D] hover:border-[#6B1725] hover:bg-[#FAF7F0] text-xs font-semibold text-[#292524] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copiedCode ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-[#6B625D]" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Referral Link Box */}
          <div className="bg-[#FAF7F0] border border-[#E5DEC9] p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B625D] block">
                Your Referral Link
              </span>
              <span className="text-xs text-[#292524] truncate block font-sans">
                {shareUrl}
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              disabled={!referralCode}
              className="px-3 py-2 rounded-xl bg-white border border-[#D4C39D] hover:border-[#6B1725] hover:bg-[#FAF7F0] text-xs font-semibold text-[#292524] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs flex-shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-[#6B625D]" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* WhatsApp Share Action Button */}
        <button
          onClick={handleWhatsAppShare}
          disabled={!referralCode}
          className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
        >
          <Share2 size={16} />
          Share Referral Link on WhatsApp
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. REFERRAL STATS CARDS                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#F3ECE0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#B08A3C]/30 flex items-center justify-center text-[#6B1725] flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs text-[#6B625D] font-medium block">
              Friends Joined
            </span>
            <span className="text-2xl font-bold font-serif text-[#292524]">
              {stats.totalInvited}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#F3ECE0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#B08A3C]/30 flex items-center justify-center text-[#6B1725] flex-shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="text-xs text-[#6B625D] font-medium block">
              Orders Placed
            </span>
            <span className="text-2xl font-bold font-serif text-[#292524]">
              {stats.successfulPurchases}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#F3ECE0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#B08A3C]/30 flex items-center justify-center text-[#6B1725] flex-shrink-0">
            <Coins size={22} />
          </div>
          <div>
            <span className="text-xs text-[#6B625D] font-medium block">
              Total Coins Won
            </span>
            <span className="text-2xl font-bold font-serif text-[#6B1725]">
              🪙 {totalEarned}
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. HOW IT WORKS (3 SIMPLE STEPS)                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F3ECE0] shadow-xs space-y-4">
        <h3 className="font-serif text-base sm:text-lg font-bold text-[#292524]">
          How Does It Work?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#FAF7F0]/60 border border-[#E5DEC9]/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#6B1725] text-white flex items-center justify-center text-xs font-bold font-serif">
              1
            </div>
            <h4 className="font-semibold text-xs text-[#292524]">Share Your Link</h4>
            <p className="text-xs text-[#6B625D] leading-relaxed">
              Send your exclusive referral link or code to friends & family over WhatsApp.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0]/60 border border-[#E5DEC9]/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#6B1725] text-white flex items-center justify-center text-xs font-bold font-serif">
              2
            </div>
            <h4 className="font-semibold text-xs text-[#292524]">Friend Places Order</h4>
            <p className="text-xs text-[#6B625D] leading-relaxed">
              They log in with Google and complete their first authentic Banarasi saree purchase.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0]/60 border border-[#E5DEC9]/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#6B1725] text-white flex items-center justify-center text-xs font-bold font-serif">
              3
            </div>
            <h4 className="font-semibold text-xs text-[#292524]">Earn & Spend Coins</h4>
            <p className="text-xs text-[#6B625D] leading-relaxed">
              You receive Banarasi Coins in your wallet, ready to spend as direct cash discount at checkout!
            </p>
          </div>
        </div>

        {/* Dynamic Tier Slabs Visual Card */}
        <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF7F0] via-white to-[#FAF7F0] border border-[#B08A3C]/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-serif text-xs sm:text-sm font-bold text-[#6B1725] flex items-center gap-1.5">
              <span>🪙</span>
              <span>Tiered Referral Rewards</span>
            </h4>
            <span className="text-[11px] text-[#6B625D]">
              Spend limit: Max {settings.max_redemption_percent}% of cart (min order ₹{settings.min_order_for_redemption.toLocaleString('en-IN')})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white border border-[#E5DEC9]/80 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] text-[#6B625D] font-medium">Tier 1 (₹{settings.tier1_min_order.toLocaleString('en-IN')}+)</p>
                <p className="text-xs font-bold text-[#292524]">First Purchase</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-[#FAF7F0] text-[#6B1725] font-serif font-bold text-xs border border-[#B08A3C]/30">
                +🪙 {settings.tier1_reward_coins}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5DEC9]/80 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] text-[#6B625D] font-medium">Tier 2 (₹{settings.tier2_min_order.toLocaleString('en-IN')}+)</p>
                <p className="text-xs font-bold text-[#292524]">Festive Order</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-[#FAF7F0] text-[#6B1725] font-serif font-bold text-xs border border-[#B08A3C]/30">
                +🪙 {settings.tier2_reward_coins}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-[#FAF7F0] to-white border border-[#B08A3C]/50 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] text-[#B08A3C] font-semibold">Tier 3 (₹{settings.tier3_min_order.toLocaleString('en-IN')}+)</p>
                <p className="text-xs font-bold text-[#6B1725]">Bridal &amp; Royal</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#6B1725] text-white font-serif font-bold text-xs shadow-xs">
                +🪙 {settings.tier3_reward_coins}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. COIN PASSBOOK / TRANSACTION LEDGER                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F3ECE0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#292524] flex items-center gap-2">
            <Clock size={18} className="text-[#6B1725]" />
            Coin Passbook & Ledger
          </h3>
          <span className="text-xs text-[#6B625D]">
            {transactions.length} entries
          </span>
        </div>

        {loadingHistory ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
            <RefreshCw size={22} className="animate-spin text-[#6B1725]" />
            <span className="text-xs">Loading transaction history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-[#E5DEC9] bg-[#FAF7F0]/40 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-cream/50 flex items-center justify-center text-maroon mb-1">
              <Coins size={24} />
            </div>
            <p className="text-sm font-semibold text-[#292524]">No Coin Transactions Yet</p>
            <p className="text-xs text-[#6B625D] max-w-sm mx-auto">
              Start sharing your referral code to earn your first Banarasi Coins! Every completed referral adds coins to your wallet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3ECE0]">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              const isPending = tx.status === 'PENDING';
              const isCancelled = tx.status === 'CANCELLED';

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[#292524] truncate">
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B625D] mt-0.5">
                        <span>{formatTransactionDate(tx.created_at)}</span>
                        <span>•</span>
                        <span className={`capitalize font-medium ${
                          isPending 
                            ? 'text-amber-600' 
                            : isCancelled 
                            ? 'text-stone-400' 
                            : 'text-emerald-600'
                        }`}>
                          {isPending && tx.expires_at
                            ? `Pending (Matures ${new Date(tx.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`
                            : tx.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm sm:text-base font-bold font-mono ${
                      isPending
                        ? 'text-amber-600'
                        : isCredit
                        ? 'text-emerald-700'
                        : 'text-stone-700'
                    }`}>
                      {isCredit ? `+₹${Math.abs(tx.amount)}` : `-₹${Math.abs(tx.amount)}`}
                    </span>
                    <span className="text-[10px] block text-[#6B625D]">
                      {isPending ? 'Pending Return Window' : isCredit ? 'Coins Credited' : 'Coins Spent'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
