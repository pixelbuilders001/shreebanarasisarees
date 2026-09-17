"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useStore } from '../../../context/StoreContext';
import {
  Coins,
  Copy,
  Check,
  Share2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Info,
  RefreshCw,
  Gift,
  ChevronDown,
  ChevronUp,
  ShieldCheck
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
  const [showTiers, setShowTiers] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'credited' | 'spent'>('all');
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
    const message = `✨ Namaste! Discover authentic handwoven Banarasi pure silk sarees from *Shree Banarasi Sarees*.\n\nUse my code *${referralCode}* to get ₹150 off your first purchase:\n${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const availableCoins = Math.floor(userWallet?.available_balance || 0);
  const pendingCoins = Math.floor(userWallet?.pending_balance || 0);
  const totalEarned = Math.floor(userWallet?.total_earned || 0);

  const filteredTransactions = useMemo(() => {
    if (txFilter === 'credited') {
      return transactions.filter(t => t.amount > 0);
    }
    if (txFilter === 'spent') {
      return transactions.filter(t => t.amount < 0);
    }
    return transactions;
  }, [transactions, txFilter]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 0. REFERRAL FLOW EXPLAINER STRIP BANNER                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#E7DFC9] shadow-2xs bg-white">
        <img
          src="/referal_flow.webp"
          alt="How Referral and Banarasi Coins Work"
          className="w-full h-auto object-contain block"
          loading="eager"
        />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. LUXURY DIGITAL WALLET PASS CARD                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#801B2E] via-[#6B1725] to-[#4E0E1A] text-[#FAF7F0] p-6 sm:p-7 shadow-xl border border-[#D4AF37]/40">
        {/* Subtle gold metallic shimmer corner accents */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Pass Header: Brand & Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E5D7BF] animate-pulse" />
              <span className="font-sans text-xs sm:text-sm font-bold tracking-wider text-[#FAF7F0]/90 uppercase">
                Banarasi Coins Wallet
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || userWalletLoading}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F0] transition-all cursor-pointer disabled:opacity-40"
              title="Refresh wallet balance"
              aria-label="Refresh wallet balance"
            >
              <RefreshCw size={14} className={isRefreshing || userWalletLoading ? 'animate-spin text-[#FAF7F0]' : ''} />
            </button>
          </div>

          {/* Main Balance Display */}
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#E5D7BF] block font-semibold">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                ₹{availableCoins.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-sans font-semibold text-[#E5D7BF]">
                Coins
              </span>
            </div>
            <p className="text-xs text-[#FAF7F0]/80 mt-1 flex items-center gap-1.5 font-sans">
              <Sparkles size={12} className="text-[#D4AF37]" />
              <span>1 Coin = ₹1 instant cash discount at checkout</span>
            </p>
          </div>

          {/* Bottom Card Strip: Sub-balances & Patron Code */}
          <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-[#E5D7BF]/75 uppercase block font-medium">Pending</span>
                <span className="font-sans font-bold text-amber-300">₹{pendingCoins.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-6 w-px bg-white/15" />
              <div>
                <span className="text-[10px] text-[#E5D7BF]/75 uppercase block font-medium">Lifetime Won</span>
                <span className="font-sans font-bold text-white">₹{totalEarned.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* In-Card Referral Code Pill */}
            {referralCode && (
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 text-xs font-sans font-bold text-white transition-all cursor-pointer"
                title="Click to copy your code"
              >
                <span>CODE: {referralCode}</span>
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[#E5D7BF]" />}
              </button>
            )}
          </div>
        </div>

        {/* Small pending alert if any */}
        {pendingCoins > 0 && (
          <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-[#FAF7F0]/85">
            <Info size={13} className="text-amber-300 shrink-0" />
            <span>Pending coins unlock 7 days after the referred order is delivered.</span>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DIRECT ACTION BUTTONS (Clean, Unified)                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          onClick={handleWhatsAppShare}
          disabled={!referralCode}
          className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <Share2 size={16} />
          <span>Invite on WhatsApp (+₹150 off)</span>
        </button>

        <button
          onClick={handleCopyLink}
          disabled={!referralCode}
          className="w-full py-3 px-4 bg-white hover:bg-[#FAF8F5] border border-[#D4C39D] text-[#292524] rounded-2xl font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {copiedLink ? (
            <>
              <Check size={15} className="text-emerald-600" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy size={15} className="text-[#6B1725]" />
              <span>Copy Invite Link</span>
            </>
          )}
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. COLLAPSIBLE TIERS & HOW IT WORKS                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7DFC9] shadow-2xs overflow-hidden">
        <button
          onClick={() => setShowTiers(!showTiers)}
          className="w-full py-3 px-4 sm:px-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1C1917]">
            <Gift size={16} className="text-[#6B1725]" />
            <span>How to Earn &amp; Reward Slabs</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
            <span>{showTiers ? 'Hide' : 'View Tiers'}</span>
            {showTiers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showTiers && (
          <div className="p-4 sm:p-5 pt-1 border-t border-[#F0EBE1] space-y-3.5 bg-[#FAF8F5]/30 animate-fadeIn">
            {/* 3 Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#E7DFC9] space-y-0.5">
                <span className="font-bold text-[#6B1725]">1. Share Code</span>
                <p className="text-[11px] text-[#78716C]">Send your invite link to friends &amp; family.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E7DFC9] space-y-0.5">
                <span className="font-bold text-[#6B1725]">2. Friend Shops</span>
                <p className="text-[11px] text-[#78716C]">They get ₹150 off on their first saree purchase.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E7DFC9] space-y-0.5">
                <span className="font-bold text-[#6B1725]">3. You Get Coins</span>
                <p className="text-[11px] text-[#78716C]">You receive up to ₹500 in coins based on order tier.</p>
              </div>
            </div>

            {/* Slabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#E7DFC9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase block font-medium">First Order</span>
                  <span className="font-sans font-semibold text-[#1C1917]">₹{settings.tier1_min_order.toLocaleString('en-IN')}+</span>
                </div>
                <span className="font-sans font-bold text-xs sm:text-sm text-[#6B1725]">+₹{settings.tier1_reward_coins} Coins</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#E7DFC9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase block font-medium">Festive Order</span>
                  <span className="font-sans font-semibold text-[#1C1917]">₹{settings.tier2_min_order.toLocaleString('en-IN')}+</span>
                </div>
                <span className="font-sans font-bold text-xs sm:text-sm text-[#6B1725]">+₹{settings.tier2_reward_coins} Coins</span>
              </div>

              <div className="p-2.5 rounded-xl bg-gradient-to-r from-white to-[#FAF7F0] border border-[#B08A3C]/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#B08A3C] uppercase font-bold block">Bridal Order</span>
                  <span className="font-sans font-semibold text-[#6B1725]">₹{settings.tier3_min_order.toLocaleString('en-IN')}+</span>
                </div>
                <span className="font-sans font-bold text-xs sm:text-sm text-[#6B1725]">+₹{settings.tier3_reward_coins} Coins</span>
              </div>
            </div>

            {/* Stats summary */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#78716C] border-t border-[#EFEBE4] font-sans">
              <span>Friends Invited: <strong className="text-[#1C1917] font-sans font-semibold">{stats.totalInvited}</strong></span>
              <span>Orders Placed: <strong className="text-[#1C1917] font-sans font-semibold">{stats.successfulPurchases}</strong></span>
              <span>Max Discount: <strong className="text-[#1C1917] font-sans font-semibold">{settings.max_redemption_percent}% off</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. COIN PASSBOOK / TRANSACTIONS LEDGER                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E7DFC9] shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#6B1725]" />
            <h3 className="font-sans text-sm sm:text-base font-bold text-[#1C1917]">
              Passbook &amp; Activity
            </h3>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1">
            {(['all', 'credited', 'spent'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTxFilter(filter)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] capitalize font-medium transition-colors cursor-pointer ${
                  txFilter === filter
                    ? 'bg-[#6B1725] text-white font-semibold'
                    : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-[#78716C]">
            <RefreshCw size={18} className="animate-spin text-[#6B1725]" />
            <span className="text-xs font-sans">Loading passbook history...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-[#E5DEC9] bg-[#FAF8F5]/50 space-y-1.5">
            <Coins size={22} className="mx-auto text-[#B08A3C]" />
            <p className="text-xs sm:text-sm font-semibold text-[#1C1917]">No Transactions Recorded</p>
            <p className="text-[11px] text-[#78716C] max-w-xs mx-auto font-sans">
              Share your code with friends to start earning Banarasi Coins!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EBE1]">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.amount > 0;
              const isPending = tx.status === 'PENDING';
              const isCancelled = tx.status === 'CANCELLED';

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1C1917] truncate">
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#78716C]">
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

                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-sans font-bold ${
                      isPending
                        ? 'text-amber-600'
                        : isCredit
                        ? 'text-emerald-700'
                        : 'text-stone-700'
                    }`}>
                      {isCredit ? `+₹${Math.abs(tx.amount).toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-[10px] block text-[#78716C]">
                      {isPending ? 'Pending Window' : isCredit ? 'Coins Credited' : 'Coins Spent'}
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
