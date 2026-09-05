import React, { useState, useEffect } from 'react';
import { getStore, subscribeStore, relendRepaidFunds } from '../lib/store';
import { formatAddress, getSolanaExplorerUrl } from '../lib/solana';
import BadgesShowcase from './BadgesShowcase';
import { 
  Wallet, 
  ArrowsClockwise, 
  TrendUp, 
  CheckCircle, 
  Clock, 
  ArrowSquareOut,
  Sparkle,
  Handshake
} from '@phosphor-icons/react';
import confetti from 'canvas-confetti';

export default function PortfolioView() {
  const [store, setStore] = useState(getStore());
  const [selectedRelendLoan, setSelectedRelendLoan] = useState<string>('');
  const [relendSuccess, setRelendSuccess] = useState<string | null>(null);

  useEffect(() => {
    return subscribeStore(() => {
      setStore({ ...getStore() });
    });
  }, []);

  const fundingLoans = store.loans.filter(l => l.status === 'funding');

  const handleRelend = () => {
    if (!selectedRelendLoan || store.portfolio.availableToRelendUSD <= 0) return;
    const success = relendRepaidFunds(selectedRelendLoan, store.portfolio.availableToRelendUSD);
    if (success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#4f46e5', '#3b82f6', '#10b981']
      });
      setRelendSuccess(`Recovered capital successfully re-lent. The generosity cycle continues.`);
      setTimeout(() => setRelendSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Portfolio Top Banner & Hero Stats */}
      <section className="p-4 sm:p-8 rounded-2xl bg-[#0e1526] border border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Lender Keypair: {formatAddress(store.portfolio.address, 6)}</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-['Syne']">
              Lending Portfolio & Impact
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Tracking your deployed micro-loans, on-chain repayments, and unlocked impact milestones on Solana.
            </p>
          </div>

          {/* Impact Score Box */}
          <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <Sparkle size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Impact Score
              </span>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                {store.portfolio.impactScore} <span className="text-xs text-indigo-400 font-sans">Pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
          
          <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554]">
            <span className="text-xs text-slate-400 font-medium">Total Capital Deployed</span>
            <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
              ${store.portfolio.totalLentUSD}
            </div>
            <span className="text-[11px] text-indigo-400 font-mono tabular-nums">
              {store.portfolio.totalLentSOL} SOL
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554]">
            <span className="text-xs text-slate-400 font-medium">Active Initiatives</span>
            <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
              {store.portfolio.activeLoansCount} Projects
            </div>
            <span className="text-[11px] text-slate-400">3 Continents</span>
          </div>

          <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554]">
            <span className="text-xs text-slate-400 font-medium">Repaid by Borrowers</span>
            <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
              ${store.portfolio.totalRepaidUSD}
            </div>
            <span className="text-[11px] text-slate-400">100% On-Time</span>
          </div>

          <div className="p-4 rounded-xl bg-[#090e1a] border border-indigo-500/30">
            <span className="text-xs text-indigo-300 font-medium flex items-center space-x-1">
              <ArrowsClockwise size={14} />
              <span>Available to Re-Lend</span>
            </span>
            <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
              ${store.portfolio.availableToRelendUSD}
            </div>
            <span className="text-[11px] text-indigo-400 font-mono">
              Ready to redeploy
            </span>
          </div>

        </div>

      </section>

      {/* Re-Lending Generosity Loop Banner */}
      {store.portfolio.availableToRelendUSD > 0 && (
        <section className="p-6 rounded-2xl bg-[#0e1526] border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm font-['Syne']">
                <Handshake size={18} weight="bold" />
                <span>The Generosity Multiplier (Re-Lend Cycle)</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                You have <strong className="text-white font-mono tabular-nums">${store.portfolio.availableToRelendUSD}</strong> in recovered capital returned from completed projects. Re-lend this capital into another initiative immediately with zero added cost.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedRelendLoan}
                onChange={(e) => setSelectedRelendLoan(e.target.value)}
                aria-label="Select loan to re-lend to"
                className="w-full sm:w-auto bg-[#090e1a] border border-[#172554] rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
              >
                <option value="">Select an initiative to re-lend...</option>
                {fundingLoans.map(l => (
                  <option key={l.id} value={l.id}>{l.borrowerName} ({l.location.countryCode})</option>
                ))}
              </select>

              <button
                onClick={handleRelend}
                disabled={!selectedRelendLoan}
                className="w-full sm:w-auto py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                Re-Lend ${store.portfolio.availableToRelendUSD}
              </button>
            </div>
          </div>

          {relendSuccess && (
            <div className="p-2.5 rounded-xl bg-[#090e1a] border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle size={14} weight="bold" />
              <span>{relendSuccess}</span>
            </div>
          )}
        </section>
      )}

      {/* Badges Section */}
      <BadgesShowcase />

      {/* My Loan Contributions Ledger */}
      <section className="rounded-2xl bg-[#0e1526] border border-slate-800 p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-white font-['Syne']">Personal Lending Ledger</h3>
        <div className="space-y-3">
          {store.transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-white font-['Syne']">{tx.loanTitle}</div>
                <div className="text-slate-400 mt-0.5">
                  Borrower: <span className="text-slate-200">{tx.borrowerName}</span> · Memo: "{tx.message}"
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-bold text-indigo-400 font-mono tabular-nums">
                    +{tx.amountSOL} SOL (${tx.amountUSD})
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </div>
                </div>

                <a
                  href={getSolanaExplorerUrl(tx.txHash, 'devnet')}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors border border-slate-800"
                  title="View on Solana Explorer"
                >
                  <ArrowSquareOut size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
