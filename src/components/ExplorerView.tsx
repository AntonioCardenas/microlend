import React, { useState, useEffect } from 'react';
import { getStore, subscribeStore } from '../lib/store';
import { formatAddress, getSolanaExplorerUrl } from '../lib/solana';
import { 
  ShieldCheck, 
  ArrowSquareOut, 
  MagnifyingGlass, 
  Coins, 
  Stack, 
  Cpu, 
  Lightning,
  Pulse
} from '@phosphor-icons/react';

export default function ExplorerView() {
  const [store, setStore] = useState(getStore());
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    return subscribeStore(() => {
      setStore({ ...getStore() });
    });
  }, []);

  const totalSOLDeployed = store.loans.reduce((acc, l) => acc + l.raisedSOL, 0).toFixed(2);
  const totalUSDDeployed = store.loans.reduce((acc, l) => acc + l.raisedUSD, 0).toLocaleString();

  const filteredTxs = store.transactions.filter(t => 
    t.txHash.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.loanTitle.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.borrowerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.lenderAddress.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Explorer Top Banner */}
      <section className="p-8 rounded-2xl bg-[#0e1526] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 mb-2">
              <Pulse size={14} className="text-indigo-400" />
              <span>Solana Blockchain Transparency Ledger</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-['Syne']">
              On-Chain Accountability Ledger
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Every micro-loan, escrow disbursement, and lender memo is cryptographically verified on the Solana Devnet blockchain. No hidden admin fees, no mystery middlemen.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Capital Routed</span>
              <span className="text-xl font-mono font-bold text-indigo-400 tabular-nums">${totalUSDDeployed}</span>
              <span className="text-xs text-slate-400 block font-mono tabular-nums">{totalSOLDeployed} SOL</span>
            </div>
          </div>
        </div>

        {/* Network Metrics Ticker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#090e1a] border border-[#172554] flex items-center justify-center text-indigo-400">
              <Lightning size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Avg Confirmation</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">~400 ms</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#090e1a] border border-[#172554] flex items-center justify-center text-indigo-400">
              <Coins size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Network Fee</span>
              <span className="text-xs font-bold text-indigo-300 font-mono tabular-nums">&lt;0.00001 SOL</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#090e1a] border border-[#172554] flex items-center justify-center text-indigo-400">
              <Stack size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Active Escrows</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">{store.loans.length} Contracts</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#090e1a] border border-[#172554] flex items-center justify-center text-emerald-400">
              <Cpu size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Cluster Health</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">100% Operational</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ledger Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlass size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tx signature, initiative, or wallet..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0e1526] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono tabular-nums">
          Showing {filteredTxs.length} verified on-chain transactions
        </div>
      </div>

      {/* Desktop Transaction Table */}
      <div className="hidden md:block rounded-2xl bg-[#0e1526] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090e1a] border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Signature</th>
                <th className="py-3.5 px-4">Project & Borrower</th>
                <th className="py-3.5 px-4">Lender Address</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">On-Chain Memo</th>
                <th className="py-3.5 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-semibold text-indigo-400">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span>{formatAddress(tx.txHash, 5)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-white max-w-[220px]">
                    <div className="truncate font-semibold font-['Syne']">{tx.loanTitle}</div>
                    <div className="text-[11px] text-slate-400">Borrower: {tx.borrowerName}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-400">
                    {formatAddress(tx.lenderAddress, 4)}
                  </td>
                  <td className="py-4 px-4 font-mono">
                    <span className="font-bold text-white tabular-nums">+{tx.amountSOL} SOL</span>
                    <span className="text-[10px] text-slate-400 block tabular-nums">(${tx.amountUSD})</span>
                  </td>
                  <td className="py-4 px-4 text-slate-300 max-w-[200px] truncate">
                    "{tx.message || 'Micro-loan contribution'}"
                  </td>
                  <td className="py-4 px-4 text-right">
                    <a
                      href={getSolanaExplorerUrl(tx.txHash, 'devnet')}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#090e1a] hover:bg-slate-800 text-indigo-300 border border-slate-800 text-[11px] font-medium transition-colors"
                    >
                      <span>Solana Explorer</span>
                      <ArrowSquareOut size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Transaction Cards (Optimized for small screens) */}
      <div className="md:hidden space-y-3">
        {filteredTxs.map((tx) => (
          <div 
            key={tx.id}
            className="p-4 rounded-2xl bg-[#0e1526] border border-slate-800 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono text-xs text-indigo-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>{formatAddress(tx.txHash, 6)}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-white tabular-nums">+{tx.amountSOL} SOL</span>
                <span className="text-[10px] text-slate-400 block tabular-nums">(${tx.amountUSD})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-sm font-bold text-white font-['Syne'] leading-snug">{tx.loanTitle}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Borrower: <span className="text-slate-200">{tx.borrowerName}</span> · Lender: <span className="font-mono text-indigo-300">{formatAddress(tx.lenderAddress, 4)}</span>
              </div>
            </div>

            {tx.message && (
              <div className="p-2.5 rounded-xl bg-[#090e1a] border border-[#172554] text-xs text-slate-300 italic">
                "{tx.message}"
              </div>
            )}

            <a
              href={getSolanaExplorerUrl(tx.txHash, 'devnet')}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-[#090e1a] hover:bg-slate-800 text-indigo-300 border border-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors min-h-[44px]"
            >
              <span>Verify on Solana Explorer</span>
              <ArrowSquareOut size={14} />
            </a>
          </div>
        ))}
      </div>

    </div>
  );
}
