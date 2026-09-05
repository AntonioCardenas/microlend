import React, { useState } from 'react';
import type { ProjectUpdate } from '../lib/types';
import { addProjectUpdate, getStore } from '../lib/store';
import { formatAddress } from '../lib/solana';
import { 
  PaperPlaneTilt, 
  CircleNotch, 
  Sparkle, 
  Tag, 
  Image as ImageIcon, 
  ShieldCheck, 
  Calendar,
  CheckCircle,
  Plus,
  ArrowSquareOut
} from '@phosphor-icons/react';

interface BorrowerUpdatesSectionProps {
  loanId: string;
  borrowerName: string;
  borrowerRole: string;
  borrowerAddress?: string;
  updates?: ProjectUpdate[];
}

export default function BorrowerUpdatesSection({
  loanId,
  borrowerName,
  borrowerRole,
  borrowerAddress,
  updates = []
}: BorrowerUpdatesSectionProps) {
  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'progress' | 'milestone' | 'equipment' | 'financial'>('progress');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [localUpdates, setLocalUpdates] = useState<ProjectUpdate[]>(updates);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const store = getStore();
      const newUpd = await addProjectUpdate({
        loanId,
        title,
        content,
        category,
        imageUrl: imageUrl.trim() || undefined,
        authorName: borrowerName,
        authorRole: borrowerRole,
        authorAddress: store.wallet.address || borrowerAddress
      });

      if (newUpd) {
        setLocalUpdates([newUpd, ...localUpdates]);
        setTitle('');
        setContent('');
        setImageUrl('');
        setShowPostForm(false);
        setSuccessMsg('Update published! Lenders can now inspect your live milestones.');
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'milestone':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">MILESTONE HIT</span>;
      case 'equipment':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">EQUIPMENT & ASSETS</span>;
      case 'financial':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50">EXPENSE RECEIPT</span>;
      case 'progress':
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-700/50">FIELD PROGRESS</span>;
    }
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white font-['Syne']">
              Live Project Updates & Field Proof
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Direct dispatches, equipment receipts, and milestone verifications from {borrowerName}.
          </p>
        </div>

        <button
          onClick={() => setShowPostForm(!showPostForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto min-h-[40px]"
        >
          <Plus size={14} weight="bold" />
          <span>{showPostForm ? 'Cancel' : 'Post Borrower Update'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Post Update Form */}
      {showPostForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-[#090e1a] border border-[#172554] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
              New Borrower Dispatch
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Posting as {borrowerName}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Update Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Solar Inverters Delivered & Initial Test Completed"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1526] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Update Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1526] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="progress">Field Progress & Work</option>
                  <option value="milestone">Goal & Milestone Reached</option>
                  <option value="equipment">Equipment & Asset Installation</option>
                  <option value="financial">Financial & Supply Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1526] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Progress Details & Message to Lenders</label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe exactly what capital was spent on, operational improvements, and current community impact..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1526] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={14} className="animate-spin" />
                  <span>Publishing Dispatch...</span>
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={14} weight="bold" />
                  <span>Publish Proof Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Updates Timeline List */}
      <div className="space-y-4">
        {localUpdates.length > 0 ? (
          localUpdates.map((update) => (
            <article 
              key={update.id}
              className="p-4 sm:p-5 rounded-xl bg-[#090e1a] border border-[#172554]/70 space-y-3 transition-all hover:border-indigo-500/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  {getCategoryBadge(update.category)}
                  <h4 className="text-sm font-bold text-white font-['Syne']">
                    {update.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>{timeAgo(update.timestamp)}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {update.content}
              </p>

              {update.imageUrl && (
                <div className="rounded-lg overflow-hidden max-h-64 border border-slate-800">
                  <img 
                    src={update.imageUrl} 
                    alt={update.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Author: {update.authorName} ({update.authorRole})</span>
                </div>

                {update.authorAddress && (
                  <span className="text-indigo-400 font-mono text-[10px]">
                    Key: {formatAddress(update.authorAddress, 4)}
                  </span>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="p-8 text-center rounded-xl bg-[#090e1a]/50 border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400">
              No updates posted yet. As milestones are reached and equipment is purchased, borrower progress dispatches will be published here.
            </p>
            <button
              onClick={() => setShowPostForm(true)}
              className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
            >
              + Post the first update
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
