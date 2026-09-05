import React, { useState } from 'react';
import type { LoanAIAudit } from '../lib/types';
import { formatAddress, getSolanaExplorerUrl } from '../lib/solana';
import { 
  Sparkle, 
  ShieldCheck, 
  WarningCircle, 
  ShieldWarning, 
  ArrowSquareOut, 
  CircleNotch,
  ArrowsClockwise,
  Clock,
  Wallet,
  CheckCircle,
  FileText
} from '@phosphor-icons/react';

interface GeminiAuditModalProps {
  audit: LoanAIAudit;
  borrowerName: string;
  loanTitle: string;
  onClose: () => void;
  onRefreshAudit?: () => Promise<void>;
  isRefreshing?: boolean;
}

export default function GeminiAuditModal({
  audit,
  borrowerName,
  loanTitle,
  onClose,
  onRefreshAudit,
  isRefreshing = false
}: GeminiAuditModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'findings'>('overview');

  const getRiskBadge = (level: string, score: number) => {
    switch (level) {
      case 'LOW':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
            <ShieldCheck size={16} weight="bold" />
            <span>LOW RISK ({score}/100)</span>
          </div>
        );
      case 'MODERATE':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
            <WarningCircle size={16} weight="bold" />
            <span>MODERATE RISK ({score}/100)</span>
          </div>
        );
      case 'ELEVATED':
      case 'HIGH':
      default:
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono">
            <ShieldWarning size={16} weight="bold" />
            <span>HIGH RISK ({score}/100)</span>
          </div>
        );
    }
  };

  const wallet = audit.walletAudit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#0e1526] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#090e1a]/80 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center">
                <Sparkle size={18} weight="fill" />
              </span>
              <span className="text-xs font-mono font-semibold tracking-wider text-indigo-300 uppercase">
                Gemini On-Chain & Borrower Audit
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-['Syne']">
              Audit Report: {borrowerName}
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {loanTitle}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {getRiskBadge(audit.riskLevel, audit.riskScore)}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-[#090e1a]/40 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'wallet'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>Wallet Forensics</span>
            {wallet.irregularitiesDetected.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {wallet.irregularitiesDetected.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'findings'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Audit Findings ({wallet.findings.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">
                  Initiative Summary
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {audit.summary}
                </p>
              </div>

              {/* Borrower Assessment */}
              <div className="p-4 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                  Borrower & Mission Credibility
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {audit.borrowerAssessment}
                </p>
              </div>

              {/* Auditor Verdict & Recommendation */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                audit.riskLevel === 'LOW' 
                  ? 'bg-emerald-950/30 border-emerald-500/30' 
                  : audit.riskLevel === 'MODERATE'
                  ? 'bg-amber-950/30 border-amber-500/30'
                  : 'bg-rose-950/30 border-rose-500/30'
              }`}>
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={16} className={audit.riskLevel === 'LOW' ? 'text-emerald-400' : 'text-amber-400'} />
                  <span className="text-xs font-bold text-white uppercase font-mono">
                    Protocol Recommendation
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {audit.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: WALLET FORENSICS */}
          {activeTab === 'wallet' && (
            <div className="space-y-5">
              {/* Wallet Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Wallet Age</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {wallet.walletAgeDays !== undefined ? `${wallet.walletAgeDays} days` : 'Brand New'}
                  </span>
                  <span className={`text-[10px] font-mono ${wallet.isNewWallet ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {wallet.isNewWallet ? 'New Wallet' : 'Established'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Confirmed Txs</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {wallet.transactionCount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">On Devnet</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Sol Balance</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {wallet.solBalance} SOL
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Liquid Lamports</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Anomalies</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {wallet.irregularitiesDetected.length}
                  </span>
                  <span className={`text-[10px] font-mono ${wallet.irregularitiesDetected.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {wallet.irregularitiesDetected.length > 0 ? 'Review Needed' : 'Clean'}
                  </span>
                </div>
              </div>

              {/* Wallet Address & On-Chain Explorer Link */}
              <div className="p-3.5 rounded-xl bg-[#090e1a] border border-[#172554] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Borrower Wallet Address:</span>
                  <span className="text-xs font-mono text-indigo-300 break-all">{wallet.address}</span>
                </div>
                <a 
                  href={`https://explorer.solana.com/address/${wallet.address}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs flex items-center space-x-1.5 transition-colors flex-shrink-0 ml-3"
                >
                  <span>Explorer</span>
                  <ArrowSquareOut size={13} />
                </a>
              </div>

              {/* Detected Irregularities Alert */}
              {wallet.irregularitiesDetected.length > 0 ? (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                    <WarningCircle size={16} />
                    <span>Detected Irregularities & Risk Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90 pl-1">
                    {wallet.irregularitiesDetected.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center space-x-2.5 text-xs text-emerald-300">
                  <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                  <span>No suspicious transaction funnels, high error rates, or wallet anomalies detected.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT FINDINGS */}
          {activeTab === 'findings' && (
            <div className="space-y-3">
              {wallet.findings.map((item, i) => (
                <div 
                  key={i}
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
                    item.type === 'danger'
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : item.type === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : item.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-[#090e1a] border-slate-800 text-slate-300'
                  }`}
                >
                  {item.type === 'danger' && <ShieldWarning size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />}
                  {item.type === 'warning' && <WarningCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />}
                  {item.type === 'success' && <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
                  {item.type === 'info' && <FileText size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />}

                  <div className="space-y-0.5">
                    <span className="font-bold block text-white">{item.title}</span>
                    <p className="leading-relaxed opacity-90">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#090e1a]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span>Powered by: {audit.modelUsed}</span>
            <span>·</span>
            <span>{new Date(audit.auditedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center space-x-2">
            {onRefreshAudit && (
              <button
                onClick={onRefreshAudit}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-[#0e1526] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isRefreshing ? (
                  <>
                    <CircleNotch size={14} className="animate-spin text-indigo-400" />
                    <span>Auditing Live RPC...</span>
                  </>
                ) : (
                  <>
                    <ArrowsClockwise size={14} />
                    <span>Re-Audit Wallet</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
