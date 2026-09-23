"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Users, 
  Share2, 
  Check, 
  Copy, 
  ShoppingBag, 
  MessageCircle, 
  AlertCircle, 
  ArrowLeft,
  Crown,
  Trophy,
  Smile
} from 'lucide-react';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { 
  fetchFamilyPoll, 
  castFamilyVote, 
  getOrCreateVoterToken, 
  isPollCreator, 
  FamilyPoll, 
  FamilyPollItem,
  supabase 
} from '../../../data/supabase';
import { useStore } from '../../../context/StoreContext';
import { Product } from '../../../data/products';

const REACTION_EMOJIS: Record<string, string> = {
  heart: '❤️',
  fire: '🔥',
  royal: '👑',
  flower: '🌸',
  thumbs_up: '👍',
};

interface FamilyVoteClientProps {
  slug: string;
  initialPoll?: FamilyPoll | null;
}

export default function FamilyVoteClient({ slug, initialPoll }: FamilyVoteClientProps) {
  const router = useRouter();
  const { addToCart, showToast } = useStore();

  const [poll, setPoll] = useState<FamilyPoll | null>(initialPoll || null);
  const [loading, setLoading] = useState(!initialPoll);
  const [isVoting, setIsVoting] = useState(false);
  const [voterToken, setVoterToken] = useState('');
  const [voterName, setVoterName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedReaction, setSelectedReaction] = useState('heart');

  // Voting Dialog State
  const [pendingVoteItem, setPendingVoteItem] = useState<FamilyPollItem | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Celebration state
  const [celebratingItemId, setCelebratingItemId] = useState<string | null>(null);

  // Initialize voter token & name from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getOrCreateVoterToken();
      setVoterToken(token);
      const savedName = localStorage.getItem('sbs_voter_nickname') || '';
      setVoterName(savedName);
    }
  }, []);

  // Fetch poll data
  const loadPollData = useCallback(async (showLoading = true) => {
    if (!slug) return;
    if (showLoading) setLoading(true);
    try {
      const data = await fetchFamilyPoll(slug);
      setPoll(data);
    } catch (err) {
      console.error('Error loading family poll:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!initialPoll) {
      loadPollData(true);
    }
  }, [initialPoll, loadPollData]);

  // Set up Supabase Realtime channel for live votes
  useEffect(() => {
    if (!poll?.id) return;

    const channel = supabase
      .channel(`realtime-family-poll-${poll.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_poll_votes',
          filter: `poll_id=eq.${poll.id}`,
        },
        () => {
          // Re-fetch in background without showing full loader
          loadPollData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll?.id, loadPollData]);

  // Determine which item current voter picked
  const currentUserVote = useMemo(() => {
    if (!poll || !voterToken) return null;
    return poll.votes.find((v) => v.voter_token === voterToken) || null;
  }, [poll, voterToken]);

  // Determine leader / highest vote item
  const leadingItemId = useMemo(() => {
    if (!poll || !poll.items || poll.items.length === 0) return null;
    const maxVotes = Math.max(...poll.items.map((i) => i.votes_count));
    if (maxVotes === 0) return null;
    const leaders = poll.items.filter((i) => i.votes_count === maxVotes);
    return leaders.length === 1 ? leaders[0].id : null;
  }, [poll]);

  // Total votes cast
  const totalVotesCount = useMemo(() => {
    if (!poll || !poll.items) return 0;
    return poll.items.reduce((sum, item) => sum + item.votes_count, 0);
  }, [poll]);

  // Check if current visitor is the creator
  const userIsCreator = useMemo(() => {
    if (!poll) return false;
    return isPollCreator(poll.slug, poll.creator_token);
  }, [poll]);

  // Trigger vote flow
  const handleInitiateVote = (item: FamilyPollItem) => {
    // If user already entered their name before, vote immediately!
    if (voterName.trim()) {
      executeVote(item, voterName.trim(), '', selectedReaction);
    } else {
      setPendingVoteItem(item);
      setShowVoteModal(true);
    }
  };

  const executeVote = async (
    item: FamilyPollItem,
    nameToUse: string,
    comment?: string,
    reaction?: string
  ) => {
    if (!poll) return;
    setIsVoting(true);

    try {
      const res = await castFamilyVote({
        pollId: poll.id,
        itemId: item.id,
        voterName: nameToUse,
        comment: comment || undefined,
        reaction: reaction || 'heart',
      });

      if (!res.success) {
        showToast(res.error || 'Failed to submit vote', 'info');
        return;
      }

      // Save nickname to localStorage
      if (typeof window !== 'undefined' && nameToUse) {
        localStorage.setItem('sbs_voter_nickname', nameToUse);
        setVoterName(nameToUse);
      }

      // Trigger celebratory heart burst
      setCelebratingItemId(item.id);
      setTimeout(() => setCelebratingItemId(null), 2000);

      showToast(`Vote recorded for ${item.product?.name || 'saree'}! ❤️`, 'info');
      setShowVoteModal(false);
      setCommentText('');

      // Refresh poll data
      await loadPollData(false);
    } catch (err: any) {
      console.error('Vote failed:', err);
      showToast(err.message || 'Error recording vote', 'info');
    } finally {
      setIsVoting(false);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVoteItem) return;
    const name = voterName.trim() || 'Family Member';
    executeVote(pendingVoteItem, name, commentText.trim(), selectedReaction);
  };

  // WhatsApp share message
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = `${origin}/vote/${slug}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🌸 ${poll?.creator_name || 'I am'} choosing a saree for ${poll?.occasion || 'an event'}! ❤️\n\nWhich one looks best? Vote here:\n${currentUrl}`
  )}`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleAddWinnerToCart = (product: Product) => {
    addToCart(product, 1);
    showToast(`Added ${product.name} to cart!`, 'info');
    router.push('/cart');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 border-3 border-maroon border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-serif text-dark-brown text-base">Loading family poll...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!poll) {
    return (
      <>
        <Header />
        <main className="max-w-xl mx-auto py-20 px-4 text-center">
          <div className="w-16 h-16 bg-red-50 text-maroon rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-dark-brown mb-2">
            Family Poll Not Found
          </h1>
          <p className="text-sm text-dark-brown/70 mb-6">
            This poll may have expired or the link might be incorrect.
          </p>
          <Link
            href="/sarees"
            className="inline-block px-6 py-2.5 bg-maroon text-ivory rounded-lg font-serif font-bold text-xs tracking-wider uppercase shadow hover:bg-maroon-dark transition-all"
          >
            Explore Traditional Sarees
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-grow">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/wishlist"
            className="inline-flex items-center gap-1.5 text-xs text-dark-brown/60 hover:text-maroon font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Wishlist</span>
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-maroon via-maroon to-maroon-dark text-ivory rounded-2xl p-6 sm:p-8 shadow-lg border border-gold/30 mb-8 text-center sm:text-left">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-gold border border-gold/30">
                <Users size={13} className="text-gold" />
                <span>Family Shopping Poll</span>
                <span>•</span>
                <span>{poll.occasion}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-wide text-ivory">
                {poll.creator_name} is choosing a saree ❤️
              </h1>

              <p className="text-xs sm:text-sm text-ivory/85 max-w-xl leading-relaxed">
                Help her decide the most stunning look! Tap the heart on the saree you love most.
                {totalVotesCount > 0 && ` (${totalVotesCount} ${totalVotesCount === 1 ? 'vote' : 'votes'} cast so far)`}
              </p>
            </div>

            {/* Quick Share Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <MessageCircle size={16} className="fill-white" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-ivory border border-white/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Subtle Decorative Background Motif */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        </div>

        {/* Creator Notification Pill (If Creator) */}
        {userIsCreator && (
          <div className="mb-6 p-3.5 bg-gold/15 border border-gold/40 rounded-xl flex items-center justify-between gap-3 text-xs text-dark-brown">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-maroon shrink-0" />
              <span>
                <strong>Creator View:</strong> Share this page with your family on WhatsApp to watch votes update live!
              </span>
            </div>
          </div>
        )}

        {/* Saree Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          {poll.items.map((item, index) => {
            const product = item.product;
            if (!product) return null;

            const isVotedByMe = currentUserVote?.item_id === item.id;
            const isLeading = leadingItemId === item.id;
            const votePercent = totalVotesCount > 0 
              ? Math.round((item.votes_count / totalVotesCount) * 100) 
              : 0;

            const primaryImage = product.images?.[0] || '/images/placeholder.jpg';
            const priceToDisplay = product.salePrice || product.price;

            return (
              <div
                key={item.id}
                className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-all flex flex-col shadow-sm hover:shadow-md ${
                  isVotedByMe
                    ? 'border-maroon ring-2 ring-maroon/20'
                    : isLeading
                    ? 'border-gold shadow-md'
                    : 'border-cream'
                }`}
              >
                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-ivory text-[10px] font-bold rounded-full tracking-wider uppercase">
                    Option {String.fromCharCode(65 + index)}
                  </span>
                  {isLeading && (
                    <span className="px-2.5 py-1 bg-gold text-dark-brown text-[10px] font-bold rounded-full flex items-center gap-1 shadow">
                      <Trophy size={11} /> Top Choice ({item.votes_count})
                    </span>
                  )}
                  {isVotedByMe && (
                    <span className="px-2.5 py-1 bg-maroon text-ivory text-[10px] font-bold rounded-full flex items-center gap-1 shadow">
                      <Check size={11} strokeWidth={3} /> Your Vote
                    </span>
                  )}
                </div>

                {/* Saree Image */}
                <div className="relative aspect-[3/4] w-full bg-cream/30 overflow-hidden group">
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />

                  {/* Celebrating Heart Burst Animation */}
                  {celebratingItemId === item.id && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-in zoom-in-50 fade-in duration-300">
                      <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                        <Heart size={44} className="text-maroon fill-maroon" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-dark-brown line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {product.fabric && (
                        <span className="text-[10px] px-2 py-0.5 bg-cream/60 rounded text-dark-brown/80 font-medium">
                          {product.fabric}
                        </span>
                      )}
                      {product.color && (
                        <span className="text-[10px] px-2 py-0.5 bg-cream/60 rounded text-dark-brown/80 font-medium">
                          {product.color}
                        </span>
                      )}
                    </div>

                    {poll.show_price && (
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="font-serif font-extrabold text-maroon text-base">
                          ₹{priceToDisplay.toLocaleString('en-IN')}
                        </span>
                        {product.salePrice && product.price > product.salePrice && (
                          <span className="text-xs text-dark-brown/40 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vote Progress Bar */}
                  {totalVotesCount > 0 && (
                    <div className="space-y-1 pt-1 border-t border-cream">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-dark-brown/70">
                        <span>{item.votes_count} {item.votes_count === 1 ? 'vote' : 'votes'}</span>
                        <span>{votePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isLeading ? 'bg-gold' : 'bg-maroon'
                          }`}
                          style={{ width: `${votePercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleInitiateVote(item)}
                      disabled={isVoting}
                      className={`w-full py-2.5 px-3 rounded-xl font-serif text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                        isVotedByMe
                          ? 'bg-maroon text-ivory ring-2 ring-maroon/30 shadow'
                          : 'bg-cream/50 hover:bg-maroon hover:text-ivory text-dark-brown border border-dark-brown/15'
                      }`}
                    >
                      <Heart
                        size={15}
                        className={isVotedByMe ? 'fill-ivory text-ivory' : 'text-maroon'}
                      />
                      <span>{isVotedByMe ? 'You Voted This' : 'Vote For This'}</span>
                    </button>

                    {/* Creator Shortcut: Add this saree to cart */}
                    {userIsCreator && (
                      <button
                        onClick={() => handleAddWinnerToCart(product)}
                        className="w-full py-2 px-3 bg-white hover:bg-cream/40 text-dark-brown border border-dark-brown/20 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={13} />
                        <span>Add To Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Family Comments & Messages Feed */}
        <div className="bg-white rounded-2xl border border-cream p-5 sm:p-6 shadow-xs mb-10">
          <div className="flex items-center justify-between pb-4 border-b border-cream mb-4">
            <h2 className="font-serif text-lg font-bold text-dark-brown flex items-center gap-2">
              <Users size={18} className="text-maroon" />
              <span>Family Votes & Cheer ({poll.votes?.length || 0})</span>
            </h2>
            <span className="text-xs text-dark-brown/50">Live updates</span>
          </div>

          {!poll.votes || poll.votes.length === 0 ? (
            <div className="text-center py-8 text-dark-brown/60 text-xs">
              No votes yet! Be the first family member to vote above ❤️
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {poll.votes.map((vote) => {
                const votedItem = poll.items.find((i) => i.id === vote.item_id);
                const emoji = REACTION_EMOJIS[vote.reaction || 'heart'] || '❤️';

                return (
                  <div
                    key={vote.id}
                    className="p-3 bg-cream/20 rounded-xl border border-cream flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-maroon/10 text-maroon flex items-center justify-center font-bold text-xs shrink-0">
                      {emoji}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-dark-brown truncate">
                          {vote.voter_name || 'Family Member'}
                        </span>
                        <span className="text-[10px] text-dark-brown/40">
                          {new Date(vote.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-dark-brown/70 mt-0.5">
                        Voted for{' '}
                        <strong className="text-maroon">
                          {votedItem?.product?.name || 'a saree'}
                        </strong>
                      </p>
                      {vote.comment && (
                        <p className="text-xs text-dark-brown/90 mt-1 italic bg-white/70 p-2 rounded border border-cream/60">
                          &ldquo;{vote.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Viral Brand Discovery Banner for Family Guests */}
        <div className="bg-gradient-to-r from-cream/40 via-gold/15 to-cream/40 border border-gold/30 rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-serif text-lg font-bold text-dark-brown">
            Attending {poll.creator_name}&apos;s {poll.occasion}?
          </h3>
          <p className="text-xs text-dark-brown/70 max-w-md mx-auto">
            Explore authentic handwoven Banarasi silk sarees, dupattas, and bridal lehengas directly from the looms of Varanasi.
          </p>
          <Link
            href="/sarees"
            className="inline-block px-5 py-2.5 bg-maroon text-ivory rounded-xl font-serif text-xs font-bold tracking-wider uppercase shadow-md hover:bg-maroon-dark transition-all hover:scale-105 active:scale-95"
          >
            Explore Sarees Collection
          </Link>
        </div>

      </main>

      <Footer />

      {/* Vote & Nickname Dialog */}
      {showVoteModal && pendingVoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-cream"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-maroon text-ivory px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm flex items-center gap-1.5">
                <span>Cast Your Vote</span>
                <Heart size={14} className="fill-gold text-gold" />
              </h3>
              <button
                onClick={() => setShowVoteModal(false)}
                className="text-ivory/70 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-2 bg-cream/30 rounded-xl border border-cream">
                <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={pendingVoteItem.product?.images?.[0] || '/images/placeholder.jpg'}
                    alt={pendingVoteItem.product?.name || 'Saree'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-maroon font-bold uppercase tracking-wider block">
                    Voting For
                  </span>
                  <p className="text-xs font-serif font-bold text-dark-brown truncate">
                    {pendingVoteItem.product?.name}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-brown uppercase tracking-wider mb-1">
                  What should {poll.creator_name} call you?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mom, Anita Chachi, Neha Di, Rahul"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-cream/20 border border-dark-brown/20 rounded-xl focus:border-maroon focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-brown uppercase tracking-wider mb-1">
                  Leave a note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. The ruby color will look magical on you!"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-cream/20 border border-dark-brown/20 rounded-xl focus:border-maroon focus:outline-none"
                />
              </div>

              {/* Reaction Emojis */}
              <div>
                <label className="block text-xs font-bold text-dark-brown uppercase tracking-wider mb-1.5">
                  Pick a reaction
                </label>
                <div className="flex gap-2">
                  {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedReaction(key)}
                      className={`text-lg p-2 rounded-xl border transition-all ${
                        selectedReaction === key
                          ? 'border-maroon bg-maroon/10 scale-110'
                          : 'border-cream bg-cream/20 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoteModal(false)}
                  className="flex-1 py-2.5 bg-cream/50 hover:bg-cream text-dark-brown rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVoting}
                  className="flex-1 py-2.5 bg-maroon hover:bg-maroon-dark text-ivory rounded-xl text-xs font-serif font-bold uppercase tracking-wider shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <Heart size={14} className="fill-ivory" />
                  <span>Confirm Vote</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
