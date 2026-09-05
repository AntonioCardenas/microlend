import React, { useState, useEffect } from 'react';
import type { LoanRequest } from '../lib/types';
import LendModal from './LendModal';
import { getStore, subscribeStore, getUserLentToLoan } from '../lib/store';
import { 
  Users, 
  Clock, 
  ArrowRight,
  CheckCircle,
  Check
} from '@phosphor-icons/react';

interface LoanCardProps {
  loan: LoanRequest;
}

export default function LoanCard({ loan }: LoanCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [store, setStore] = useState(getStore());

  useEffect(() => {
    return subscribeStore(() => setStore({ ...getStore() }));
  }, []);

  const currentLoan = store.loans.find(l => l.id === loan.id) || loan;
  const percentFunded = Math.min(100, Math.round((currentLoan.raisedUSD / currentLoan.goalUSD) * 100));
  const remainingUSD = Math.max(0, currentLoan.goalUSD - currentLoan.raisedUSD);
  const isFullyFunded = currentLoan.raisedUSD >= currentLoan.goalUSD;

  const { hasLended, totalLentUSD } = getUserLentToLoan(currentLoan.id, store.wallet.address);

  return (
    <>
      <article className="group rounded-2xl bg-[#0e1526] border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 flex flex-col overflow-hidden shadow-lg">
        
        {/* Card Header Image */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-950">
          <img 
            src={loan.borrowerAvatar} 
            alt={loan.borrowerName}
            width={400}
            height={208}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
          />

          {/* Category & Country Code Badge (No emojis) */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-[#080c16]/90 text-indigo-300 border border-indigo-900/60 font-mono">
              {loan.category}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 text-xs font-medium rounded bg-[#080c16]/90 text-slate-300 border border-slate-800 font-mono">
              {loan.location.countryCode} · {loan.location.city}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white leading-snug font-['Syne']">
                {loan.borrowerName}
              </h3>
            </div>
            <p className="text-xs text-indigo-400 font-medium mb-2.5">
              {loan.borrowerRole}
            </p>
            <a 
              href={`/loan/${loan.id}`}
              className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug block"
            >
              {loan.title}
            </a>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {loan.summary}
            </p>
          </div>

          {/* Key Impact Stats */}
          <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-slate-800 text-xs bg-[#090e1a]/50 rounded-lg px-3">
            {loan.impactMetrics.slice(0, 2).map((metric, i) => (
              <div key={i}>
                <span className="text-[10px] uppercase text-slate-400 font-medium tracking-wider block">
                  {metric.label}
                </span>
                <span className="text-xs font-bold text-indigo-300 font-mono tabular-nums">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          {/* Funding Progress Bar (Solid Indigo) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-white font-mono tabular-nums">
                ${loan.raisedUSD.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">({loan.raisedSOL} SOL)</span>
              </span>
              <span className="text-xs font-mono font-semibold text-indigo-400 tabular-nums">
                {percentFunded}% funded
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${percentFunded}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Goal: ${loan.goalUSD.toLocaleString()}</span>
              <span>{isFullyFunded ? 'Goal Achieved' : `$${remainingUSD.toLocaleString()} remaining`}</span>
            </div>
          </div>

          {/* Card Footer: Lenders & Solid Action Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <Users size={16} className="text-indigo-400" />
              <span>{currentLoan.lendersCount} lenders</span>
              {hasLended && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-0.5">
                  <Check size={10} weight="bold" />
                  <span>You lent ${totalLentUSD}</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={`/loan/${currentLoan.id}`}
                className="py-2.5 px-3 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 text-xs transition-colors font-medium min-h-[44px] flex items-center justify-center"
              >
                Story
              </a>
              <button
                onClick={() => setShowModal(true)}
                disabled={isFullyFunded}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer min-h-[44px] ${
                  isFullyFunded 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {isFullyFunded ? (
                  <>
                    <CheckCircle size={15} weight="bold" />
                    <span>Funded</span>
                  </>
                ) : (
                  <>
                    <span>{hasLended ? 'Lend More' : 'Lend SOL'}</span>
                    <ArrowRight size={15} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </article>

      {showModal && (
        <LendModal
          loan={currentLoan}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
