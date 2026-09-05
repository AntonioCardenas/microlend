import React, { useState, useEffect } from 'react';
import { getStore, subscribeStore } from '../lib/store';
import { formatAddress, getSolanaExplorerUrl } from '../lib/solana';
import { ArrowSquareOut, Clock, ShieldCheck } from '@phosphor-icons/react';

export default function TransactionFeed() {
  const [store, setStore] = useState(getStore());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return subscribeStore(() => {
      setStore({ ...getStore() });
    });
  }, []);

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="rounded-2xl bg-[#0e1526] border border-slate-800 p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
          <h3 className="text-sm font-bold text-white tracking-wide font-['Syne']">Live Solana Lending Ledger</h3>
        </div>
        <span className="text-[11px] font-mono text-indigo-300 px-2 py-0.5 rounded bg-slate-900 border border-indigo-900/60">
          Devnet Confirmed
        </span>
      </div>

      <div className="space-y-2.5">
        {store.transactions.slice(0, 5).map((tx) => (
          <div 
            key={tx.id}
            className="p-3.5 rounded-xl bg-[#090e1a] border border-[#172554] hover:border-indigo-900/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono font-medium text-slate-300">
                  {formatAddress(tx.lenderAddress, 4)}
                </span>
                <span className="text-slate-500">funded</span>
                <span className="font-semibold text-white truncate max-w-[200px] font-['Syne']">
                  {tx.borrowerName}
                </span>
              </div>
              {tx.message && (
                <p className="text-[11px] text-slate-400">
                  "{tx.message}"
                </p>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3 text-right">
              <div>
                <div className="text-xs font-bold text-indigo-400 font-mono tabular-nums">
                  +{tx.amountSOL} SOL <span className="text-slate-400 text-[10px]">(${tx.amountUSD})</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1">
                  <Clock size={12} />
                  <span suppressHydrationWarning>{isMounted ? timeAgo(tx.timestamp) : 'Recently'}</span>
                </div>
              </div>

              <a
                href={getSolanaExplorerUrl(tx.txHash, 'devnet')}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors border border-slate-800"
                title="Verify on Solana Explorer"
              >
                <ArrowSquareOut size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 text-center">
        <a 
          href="/explorer"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all on-chain transactions on the Transparency Ledger &rarr;
        </a>
      </div>
    </div>
  );
}
