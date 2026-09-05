import React, { useState, useEffect } from 'react';
import type { LoanRequest } from '../lib/types';
import { getStore, subscribeStore, getUserLentToLoan } from '../lib/store';
import { formatAddress, getSolanaExplorerUrl } from '../lib/solana';
import { deriveLoanEscrowInfo } from '../lib/escrowProgram';
import LendModal from './LendModal';
import { 
  Users, 
  ShieldCheck, 
  Calendar, 
  CheckCircle, 
  ArrowSquareOut, 
  Coins, 
  CaretLeft, 
  ArrowRight, 
  TrendUp,
  Info,
  Check
} from '@phosphor-icons/react';

interface LoanDetailViewProps {
  initialLoanId: string;
}

export default function LoanDetailView({ initialLoanId }: LoanDetailViewProps) {
  const [store, setStore] = useState(getStore());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    return subscribeStore(() => {
      setStore({ ...getStore() });
    });
  }, []);

  const loan = store.loans.find(l => l.id === initialLoanId) || store.loans[0];
  const percentFunded = Math.min(100, Math.round((loan.raisedUSD / loan.goalUSD) * 100));
  const remainingUSD = Math.max(0, loan.goalUSD - loan.raisedUSD);
  const isFullyFunded = loan.raisedUSD >= loan.goalUSD;

  const { hasLended, totalLentUSD, totalLentSOL } = getUserLentToLoan(loan.id, store.wallet.address);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 lg:pb-0">
      
      {/* Back Button */}
      <div>
        <a 
          href="/" 
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors min-h-[44px]"
        >
          <CaretLeft size={16} />
          <span>Back to All Micro-Loans</span>
        </a>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Image & Story */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl overflow-hidden bg-[#0e1526] border border-slate-800 shadow-xl">
            <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-slate-950">
              <img 
                src={loan.borrowerAvatar} 
                alt={loan.borrowerName} 
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <span className="px-3 py-1 rounded bg-[#080c16]/90 text-indigo-300 text-xs font-bold border border-indigo-900/60 font-mono">
                  {loan.category}
                </span>
                <span className="px-3 py-1 rounded bg-[#080c16]/90 text-white text-xs font-semibold border border-slate-800 font-mono">
                  {loan.location.countryCode} · {loan.location.city}, {loan.location.country}
                </span>
              </div>
            </div>

            <div className="p-6 bg-[#0e1526] border-t border-slate-800">
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight font-['Syne']">
                {loan.title}
              </h1>
              <p className="text-sm text-slate-300 mt-2 font-medium">
                Initiative led by <strong className="text-indigo-400">{loan.borrowerName}</strong> ({loan.borrowerRole})
              </p>
            </div>
          </div>

          {/* Impact Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {loan.impactMetrics.map((metric, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  {metric.label}
                </span>
                <span className="text-base font-bold text-indigo-400 font-mono tabular-nums mt-0.5 block">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          {/* Story Section */}
          <div className="p-6 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Syne']">
              Context & Enterprise Mission
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {loan.story}
            </p>

            <h4 className="text-base font-bold text-white pt-4 border-t border-slate-800 font-['Syne'] flex items-center space-x-2">
              <TrendUp size={18} className="text-indigo-400" />
              <span>Capital Deployment & Business Plan</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {loan.businessPlan}
            </p>
          </div>

          {/* Repayment Schedule */}
          <div className="p-6 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-['Syne'] flex items-center space-x-2">
                <Calendar size={18} className="text-indigo-400" />
                <span>On-Chain Repayment Schedule</span>
              </h3>
              <span className="text-xs text-indigo-300 font-mono font-bold px-2.5 py-1 rounded bg-[#090e1a] border border-[#172554]">
                0% Interest Microloan
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Borrower repayments return to each lender's portfolio on the scheduled due dates. Recovered funds can be withdrawn or re-lent into new initiatives.
            </p>

            <div className="space-y-2 pt-2">
              {loan.repaymentSchedule.map((milestone) => (
                <div 
                  key={milestone.month}
                  className="p-3 rounded-xl bg-[#090e1a] border border-[#172554] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[10px] font-mono">
                      {milestone.month}
                    </span>
                    <div>
                      <span className="font-semibold text-white">Month {milestone.month} Repayment</span>
                      <div className="text-[10px] text-slate-400 font-mono">Due: {milestone.dueDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-white tabular-nums">
                      ${milestone.amountUSD.toFixed(2)} ({milestone.amountSOL} SOL)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                      milestone.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {milestone.status === 'completed' ? 'Repaid' : 'Scheduled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Funding Action Card & Escrow Proof */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-2xl bg-[#0e1526] border border-slate-800 shadow-xl space-y-6 sticky top-28">
            
            {/* Goal Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  ${loan.raisedUSD.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-semibold text-indigo-400 tabular-nums">
                  {percentFunded}% of ${loan.goalUSD.toLocaleString()}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${percentFunded}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1 font-mono">
                <span>{loan.raisedSOL} SOL raised</span>
                <span>{loan.lendersCount} active lenders</span>
              </div>
            </div>

            {/* Quick Action CTA */}
            <div className="space-y-3">
              {hasLended && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300 font-mono">
                  <Check size={14} weight="bold" className="text-emerald-400 flex-shrink-0" />
                  <span>You already funded ${totalLentUSD} ({totalLentSOL} SOL) to this project</span>
                </div>
              )}

              <button
                onClick={() => setShowModal(true)}
                disabled={isFullyFunded}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Coins size={18} weight="bold" />
                <span>{isFullyFunded ? 'Fully Funded' : (hasLended ? 'Lend More' : 'Lend to this Initiative')}</span>
                {!isFullyFunded && <ArrowRight size={16} weight="bold" />}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                100% of your micro-loan goes directly to the borrower's verified Solana escrow wallet.
              </p>
            </div>

            {/* Smart Contract Escrow Details */}
            {(() => {
              const escrow = deriveLoanEscrowInfo(loan.id);
              return (
                <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Anchor Program Escrow</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Non-Custodial PDA
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    Funds are secured inside an autonomous program escrow account on Solana Devnet:
                  </p>

                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-0.5">Vault PDA (Escrow Address)</div>
                      <div className="flex items-center justify-between text-[11px] font-mono bg-[#0e1526] p-2 rounded border border-slate-800">
                        <span className="text-slate-300 truncate max-w-[180px]">{escrow.vaultPda}</span>
                        <a
                          href={`https://explorer.solana.com/address/${escrow.vaultPda}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 ml-2 flex items-center space-x-1"
                        >
                          <span className="text-[10px]">Explorer</span>
                          <ArrowSquareOut size={13} />
                        </a>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 mb-0.5">Program ID (Anchor Contract)</div>
                      <div className="flex items-center justify-between text-[11px] font-mono bg-[#0e1526] p-2 rounded border border-slate-800">
                        <span className="text-slate-400 truncate max-w-[180px]">{escrow.programId}</span>
                        <a
                          href={`https://explorer.solana.com/address/${escrow.programId}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 ml-2 flex items-center space-x-1"
                        >
                          <span className="text-[10px]">Explorer</span>
                          <ArrowSquareOut size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* UN International Day of Charity Badge */}
            <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 flex items-center space-x-3">
              <Info size={18} className="text-indigo-400 flex-shrink-0" />
              <div className="text-[11px] text-slate-300 leading-tight">
                <strong>International Day of Charity:</strong> Zero-interest micro-loans support self-reliance through working capital.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[#080c16]/95 border-t border-slate-800 px-4 py-3 z-40 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <div className="text-xs font-bold text-white font-mono tabular-nums">
            {isFullyFunded ? 'Fully Funded' : `$${remainingUSD} needed`}
          </div>
          <div className="text-[10px] text-indigo-400 font-mono">
            {percentFunded}% of ${loan.goalUSD} goal
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={isFullyFunded}
          className={`py-3 px-5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer min-h-[44px] flex-1 max-w-[200px] shadow-sm ${
            isFullyFunded
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isFullyFunded ? (
            <span>Funded</span>
          ) : (
            <>
              <span>Lend with Solana</span>
              <ArrowRight size={14} weight="bold" />
            </>
          )}
        </button>
      </div>

      {showModal && (
        <LendModal
          loan={loan}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  );
}

