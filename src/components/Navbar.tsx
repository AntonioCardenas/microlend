import React, { useState, useEffect } from 'react';
import { getStore, subscribeStore, airdropToWallet, updateConnectedWallet, resetToDemoWallet } from '../lib/store';
import { formatAddress, requestDevnetAirdrop } from '../lib/solana';
import PrivySolanaProvider from './PrivySolanaProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useCreateWallet } from '@privy-io/react-auth/solana';
import { MagneticButton } from './ui/magnetic-button';
import {
  CurrencyCircleDollar,
  Wallet,
  ArrowSquareOut,
  CaretDown,
  Check,
  Drop,
  ShieldCheck,
  PlusCircle,
  SignOut,
  Lightning,
  List,
  X,
  Compass,
  BookOpen,
  ChartPieSlice,
  Database,
  HandHeart,
} from '@phosphor-icons/react';

function NavbarContent() {
  const [store, setStore] = useState(getStore());
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Privy Solana hooks
  let privyAuth: { login?: () => void; logout?: () => void; authenticated?: boolean; user?: any; ready?: boolean } = {};
  let privyWallets: { wallets?: any[]; ready?: boolean } = {};
  let privyCreate: { createWallet?: () => Promise<any> } = {};

  try { privyAuth = usePrivy(); } catch {}
  try { privyWallets = useWallets(); } catch {}
  try { privyCreate = useCreateWallet(); } catch {}

  const { login, logout, authenticated } = privyAuth;
  const { wallets } = privyWallets;
  const { createWallet } = privyCreate;

  const activePrivySolanaWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  useEffect(() => {
    if (activePrivySolanaWallet?.address) {
      updateConnectedWallet({ address: activePrivySolanaWallet.address, providerType: 'privy' });
    }
  }, [activePrivySolanaWallet?.address]);

  useEffect(() => {
    return subscribeStore(() => setStore({ ...getStore() }));
  }, []);

  const handleCopy = () => {
    if (store.wallet.address) {
      navigator.clipboard.writeText(store.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDevnetAirdrop = async () => {
    setAirdropping(true);
    airdropToWallet(1.0);
    if (store.wallet.address) await requestDevnetAirdrop(store.wallet.address, 1.0);
    setTimeout(() => setAirdropping(false), 800);
  };

  const handleCreateSolanaWallet = async () => {
    if (!createWallet) return;
    try {
      setIsCreatingWallet(true);
      const newWallet = await createWallet();
      if (newWallet?.address) {
        updateConnectedWallet({ address: newWallet.address, providerType: 'privy' });
      }
    } catch (err) {
      console.error('Privy wallet creation:', err);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleDisconnect = async () => {
    if (logout) { try { await logout(); } catch (e) { console.warn(e); } }
    resetToDemoWallet();
    setShowWalletMenu(false);
  };

  const navLinkClass = 'px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition-colors min-h-[44px] flex items-center';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#080c16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          <a href="/" className="flex items-center gap-2.5 group min-h-[44px] flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500 transition-colors">
              <CurrencyCircleDollar size={22} weight="bold" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-['Syne']">
                  Lending<span className="text-indigo-400">Chain</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-900 text-indigo-300 border border-indigo-500/30 rounded font-mono">
                  Devnet
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">0% Interest Micro-Lending on Solana</p>
            </div>
          </a>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-0.5 pl-4 border-l border-slate-800">
            <a href="/" className={navLinkClass}>Explore</a>
            <a href="/how-it-works" className={navLinkClass}>How It Works</a>
            <a href="/portfolio" className={`${navLinkClass} gap-1.5`}>
              <span>Portfolio</span>
              {store.portfolio.badgesUnlocked.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </a>
            <a href="/explorer" className={navLinkClass}>Solana Ledger</a>
            <a
              href="/apply"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-violet-300 hover:text-white bg-violet-950/40 hover:bg-violet-900/60 border border-violet-700/40 rounded-lg transition-all min-h-[44px]"
            >
              <HandHeart size={15} weight="bold" />
              <span>Apply for a Loan</span>
            </a>
          </nav>
        </div>

        {/* ── Right: Charity badge + Wallet + Hamburger ── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Day of Charity badge — hide on small */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>UN International Day of Charity</span>
          </div>

          {/* ── Wallet button ── */}
          <div className="relative">
            <button
              onClick={() => { setShowWalletMenu(!showWalletMenu); setShowMobileNav(false); }}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer min-h-[44px] shadow-sm"
              aria-label="Open wallet menu"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePrivySolanaWallet ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-medium text-slate-300">
                    {formatAddress(store.wallet.address, 3)}
                  </span>
                  <CaretDown size={11} className="text-slate-500" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-indigo-400 font-mono font-semibold flex items-center gap-1">
                  <span>{store.wallet.balanceSOL.toFixed(2)} SOL</span>
                  {activePrivySolanaWallet && (
                    <span className="text-[8px] px-1 bg-indigo-950 text-indigo-300 rounded border border-indigo-700/50">Privy</span>
                  )}
                </div>
              </div>
            </button>

            {/* Mobile backdrop */}
            {showWalletMenu && (
              <div
                className="fixed inset-0 z-40 sm:hidden bg-[#080c16]/70 backdrop-blur-sm"
                onClick={() => setShowWalletMenu(false)}
              />
            )}

            {/* Wallet dropdown */}
            {showWalletMenu && (
              <div className="fixed inset-x-3 top-20 sm:top-auto sm:inset-auto sm:right-0 sm:absolute sm:mt-2 w-auto sm:w-80 rounded-2xl bg-[#0e1526] border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in duration-150 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-indigo-400" />
                    <span className="text-xs font-bold text-white font-['Syne']">
                      {activePrivySolanaWallet ? 'Privy Solana Wallet' : 'Devnet Keypair'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-500/30 font-mono">
                    Solana Devnet
                  </span>
                </div>

                <div className="my-3 p-3 rounded-xl bg-[#090e1a] border border-[#172554]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Public Key</p>
                    {activePrivySolanaWallet ? (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check size={11} />Privy Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-indigo-300 font-mono">Local Devnet Keypair</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">{store.wallet.address}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer text-xs min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs py-1 text-slate-300">
                    <span>Balance:</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {store.wallet.balanceSOL.toFixed(3)} SOL (${store.wallet.balanceUSD})
                    </span>
                  </div>

                  {!authenticated && login && (
                    <MagneticButton
                      onClick={() => { login(); setShowWalletMenu(false); }}
                      className="w-full py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      <Lightning size={15} weight="fill" />
                      <span>Connect Wallet via Privy</span>
                    </MagneticButton>
                  )}

                  {authenticated && !activePrivySolanaWallet && createWallet && (
                    <MagneticButton
                      onClick={handleCreateSolanaWallet}
                      disabled={isCreatingWallet}
                      className="w-full py-3 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      <PlusCircle size={15} weight="bold" />
                      <span>{isCreatingWallet ? 'Creating…' : 'Create Privy Solana Wallet'}</span>
                    </MagneticButton>
                  )}

                  <MagneticButton
                    onClick={handleDevnetAirdrop}
                    disabled={airdropping}
                    className="w-full py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 min-h-[44px]"
                  >
                    <Drop size={15} weight="fill" className={`text-indigo-400 ${airdropping ? 'animate-spin' : ''}`} />
                    <span>{airdropping ? 'Airdropping 1 SOL…' : 'Request +1 Devnet SOL Faucet'}</span>
                  </MagneticButton>

                  <a
                    href={`https://explorer.solana.com/address/${store.wallet.address}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 rounded-lg text-slate-400 hover:text-white text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors min-h-[40px]"
                  >
                    <span>Inspect on Solana Explorer</span>
                    <ArrowSquareOut size={13} />
                  </a>

                  {authenticated && (
                    <MagneticButton
                      onClick={handleDisconnect}
                      className="w-full py-2.5 px-3 rounded-lg text-rose-400 hover:text-rose-300 text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800/80 transition-colors cursor-pointer min-h-[40px]"
                    >
                      <SignOut size={13} />
                      <span>Disconnect Wallet</span>
                    </MagneticButton>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => { setShowMobileNav(!showMobileNav); setShowWalletMenu(false); }}
            className="md:hidden w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
            aria-expanded={showMobileNav}
          >
            {showMobileNav ? <X size={21} weight="bold" /> : <List size={21} weight="bold" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Nav Drawer ── */}
      {showMobileNav && (
        <div className="md:hidden border-t border-slate-800 bg-[#090e1a]/98 backdrop-blur-lg px-4 py-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-0.5">
            <a href="/" onClick={() => setShowMobileNav(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-[#0e1526] transition-colors min-h-[44px]">
              <Compass size={18} className="text-indigo-400" /><span>Explore Initiatives</span>
            </a>
            <a href="/how-it-works" onClick={() => setShowMobileNav(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-[#0e1526] transition-colors min-h-[44px]">
              <BookOpen size={18} className="text-indigo-400" /><span>How Micro-Lending Works</span>
            </a>
            <a href="/portfolio" onClick={() => setShowMobileNav(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-[#0e1526] transition-colors min-h-[44px]">
              <div className="flex items-center gap-3">
                <ChartPieSlice size={18} className="text-indigo-400" /><span>My Portfolio</span>
              </div>
              {store.portfolio.badgesUnlocked.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  {store.portfolio.badgesUnlocked.length} Badges
                </span>
              )}
            </a>
            <a href="/explorer" onClick={() => setShowMobileNav(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-[#0e1526] transition-colors min-h-[44px]">
              <Database size={18} className="text-indigo-400" /><span>Solana Transparency Ledger</span>
            </a>

            {/* Apply CTA — prominent in mobile drawer */}
            <a href="/apply" onClick={() => setShowMobileNav(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-violet-200 bg-violet-950/40 border border-violet-700/30 hover:bg-violet-900/50 transition-colors min-h-[44px] mt-2">
              <HandHeart size={18} className="text-violet-400" /><span>Apply for a Micro-Loan</span>
            </a>
          </nav>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>UN International Day of Charity</span>
            </span>
            <span className="font-mono text-indigo-400">Solana Devnet</span>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <PrivySolanaProvider>
      <NavbarContent />
    </PrivySolanaProvider>
  );
}
