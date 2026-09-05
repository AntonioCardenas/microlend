import React, { useState } from 'react';
import PrivySolanaProvider from './PrivySolanaProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useCreateWallet } from '@privy-io/react-auth/solana';
import { MagneticButton } from './ui/magnetic-button';
import {
  X,
  HandHeart,
  Lightning,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  MapPin,
  CurrencyDollar,
  Clock,
  FileText,
  Sparkle,
  CircleNotch,
  ShieldCheck,
  WarningCircle,
  PlusCircle,
  Plant,
  Sun,
  Storefront,
  UsersThree,
  GraduationCap,
  Leaf,
} from '@phosphor-icons/react';
import type { LoanCategory, LoanRequest } from '../lib/types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { deriveLoanEscrowInfo } from '../lib/escrowProgram';

const CATEGORIES: LoanCategory[] = [
  'Agriculture',
  'Clean Energy',
  'Small Business',
  'Women-Led',
  'Education',
  'Climate Resilience',
];

const CATEGORY_ICONS: Record<LoanCategory, React.ElementType> = {
  Agriculture: Plant,
  'Clean Energy': Sun,
  'Small Business': Storefront,
  'Women-Led': UsersThree,
  Education: GraduationCap,
  'Climate Resilience': Leaf,
};

const REPAYMENT_TERMS = [6, 8, 10, 12, 14, 18];

interface FormData {
  // Step 1 — Who you are
  fullName: string;
  role: string;
  country: string;
  city: string;
  // Step 2 — Your project
  title: string;
  category: LoanCategory | '';
  summary: string;
  story: string;
  businessPlan: string;
  // Step 3 — Loan terms
  goalUSD: number;
  termsMonths: number;
  // Step 4 — Impact
  impactStatement: string;
  peopleBenefited: string;
}

const EMPTY_FORM: FormData = {
  fullName: '',
  role: '',
  country: '',
  city: '',
  title: '',
  category: '',
  summary: '',
  story: '',
  businessPlan: '',
  goalUSD: 500,
  termsMonths: 12,
  impactStatement: '',
  peopleBenefited: '',
};

function formatAddress(addr: string, chars = 4) {
  if (!addr || addr.length < chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

// ─── Step indicator ─────────────────────────────────────────────────────────

function StepBar({ step, total }: { step: number; total: number }) {
  const labels = ['Identity', 'Project', 'Loan Terms', 'Impact'];
  return (
    <div className="flex items-center justify-between mb-6">
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  done
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : active
                    ? 'bg-indigo-950 border-indigo-400 text-indigo-300'
                    : 'bg-[#090e1a] border-slate-700 text-slate-500'
                }`}
              >
                {done ? <CheckCircle size={16} weight="bold" /> : idx}
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider hidden sm:block ${
                  active ? 'text-indigo-300' : done ? 'text-indigo-500' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${done ? 'bg-indigo-600' : 'bg-slate-800'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Individual Steps ────────────────────────────────────────────────────────

function Step1({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-['Syne'] mb-1">Tell us who you are</h3>
        <p className="text-xs text-slate-400">Your identity is linked to your Solana wallet for on-chain accountability.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Full Name / Organization *
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            placeholder="e.g. Fatima Zahra & Al-Amal Cooperative"
            className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Role / Title *
          </label>
          <input
            type="text"
            value={form.role}
            onChange={e => set('role', e.target.value)}
            placeholder="e.g. Cooperative President & Agri Lead"
            className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Country *
          </label>
          <input
            type="text"
            value={form.country}
            onChange={e => set('country', e.target.value)}
            placeholder="e.g. Morocco"
            className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            City / Region *
          </label>
          <input
            type="text"
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="e.g. Essaouira"
            className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-['Syne'] mb-1">Describe your project</h3>
        <p className="text-xs text-slate-400">Help lenders understand your enterprise and why it deserves funding.</p>
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Project Title *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Solar-Powered Cold Olive Press for Argan Cooperative"
          className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Category *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => set('category', cat)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer min-h-[40px] ${
                form.category === cat
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-950/50'
                  : 'bg-[#090e1a] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {(() => {
                const Icon = CATEGORY_ICONS[cat];
                return <Icon size={16} weight={form.category === cat ? "bold" : "regular"} className={form.category === cat ? "text-indigo-400" : "text-slate-500"} />;
              })()}
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          One-Line Summary * <span className="text-slate-600 font-normal normal-case">(shown on loan card)</span>
        </label>
        <input
          type="text"
          value={form.summary}
          onChange={e => set('summary', e.target.value)}
          maxLength={140}
          placeholder="A concise pitch for your project in one sentence..."
          className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
        />
        <div className="text-right text-[10px] text-slate-600 font-mono mt-1">{form.summary.length}/140</div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Your Story * <span className="text-slate-600 font-normal normal-case">(personal background & context)</span>
        </label>
        <textarea
          rows={3}
          value={form.story}
          onChange={e => set('story', e.target.value)}
          placeholder="Share your personal journey, the problem you're solving, and why this matters to your community..."
          className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Business Plan * <span className="text-slate-600 font-normal normal-case">(how will you use the funds?)</span>
        </label>
        <textarea
          rows={3}
          value={form.businessPlan}
          onChange={e => set('businessPlan', e.target.value)}
          placeholder="Break down exactly how you'll spend the loan (equipment, supplies, services) and how repayments are structured..."
          className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

function Step3({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const SOL_RATE = 145;
  const goalSOL = (form.goalUSD / SOL_RATE).toFixed(2);
  const monthlyUSD = form.goalUSD > 0 && form.termsMonths > 0 ? (form.goalUSD / form.termsMonths).toFixed(0) : '0';

  const presets = [250, 500, 1000, 2000, 3500, 5000];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-white font-['Syne'] mb-1">Set your loan terms</h3>
        <p className="text-xs text-slate-400">All loans on LendingChain are 0% interest. Funds go directly to your Solana wallet.</p>
      </div>

      {/* Loan Amount */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Loan Amount (USD) *
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presets.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => set('goalUSD', p)}
              className={`py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all min-h-[40px] ${
                form.goalUSD === p
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-[#090e1a] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              ${p.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 font-bold text-sm pointer-events-none">$</span>
          <input
            type="number"
            min={50}
            max={10000}
            step={50}
            value={form.goalUSD}
            onChange={e => set('goalUSD', Number(e.target.value))}
            className="w-full pl-8 pr-24 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
          <span className="absolute inset-y-0 right-3.5 flex items-center text-indigo-400 font-mono text-xs pointer-events-none">
            ≈ {goalSOL} SOL
          </span>
        </div>
      </div>

      {/* Repayment Terms */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Repayment Period *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {REPAYMENT_TERMS.map(mo => (
            <button
              key={mo}
              type="button"
              onClick={() => set('termsMonths', mo)}
              className={`py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all min-h-[40px] ${
                form.termsMonths === mo
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-[#090e1a] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              {mo} mo
            </button>
          ))}
        </div>
      </div>

      {/* Summary card */}
      <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] text-xs space-y-2">
        <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 mb-2">Loan Summary</div>
        <div className="flex justify-between text-slate-300">
          <span>Total requested</span>
          <span className="font-mono font-bold text-white">${form.goalUSD.toLocaleString()} <span className="text-slate-500">≈ {goalSOL} SOL</span></span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Repayment period</span>
          <span className="font-mono font-bold text-white">{form.termsMonths} months</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Monthly repayment</span>
          <span className="font-mono font-bold text-indigo-400">${monthlyUSD}/mo at 0% interest</span>
        </div>
        <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
          <span>Platform fee</span>
          <span className="font-mono font-bold text-emerald-400">$0.00 — Free</span>
        </div>
      </div>
    </div>
  );
}

function Step4({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-['Syne'] mb-1">Describe your impact</h3>
        <p className="text-xs text-slate-400">Show lenders why this loan matters — who benefits and how.</p>
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          People / Families Benefited *
        </label>
        <input
          type="text"
          value={form.peopleBenefited}
          onChange={e => set('peopleBenefited', e.target.value)}
          placeholder="e.g. 34 female farmers, 120 school children, 60 fishing crews..."
          className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Impact Statement * <span className="text-slate-600 font-normal normal-case">(what changes because of this loan?)</span>
        </label>
        <textarea
          rows={4}
          value={form.impactStatement}
          onChange={e => set('impactStatement', e.target.value)}
          placeholder="After receiving this loan, our community will... Describe measurable outcomes: income increase, CO2 avoided, jobs created, children educated, water saved..."
          className="w-full px-3 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
      </div>

      {/* Blockchain disclosure */}
      <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300">
          <ShieldCheck size={16} className="text-indigo-400 flex-shrink-0" />
          <span>On-Chain Accountability</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          By submitting, you agree that your loan request will be recorded on the Solana blockchain with your wallet address as the borrower public key. All repayments are tracked on-chain and publicly verifiable.
        </p>
      </div>
    </div>
  );
}

// ─── Wallet Gate ─────────────────────────────────────────────────────────────

function WalletGate({ onConnected }: { onConnected: () => void }) {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [isCreating, setIsCreating] = useState(false);

  const solanaWallet = wallets?.[0] ?? null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createWallet();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <CircleNotch size={32} className="animate-spin text-indigo-400" />
        <p className="text-xs text-slate-400">Loading wallet provider...</p>
      </div>
    );
  }

  if (authenticated && solanaWallet) {
    // Already connected — call onConnected immediately
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-950 border border-indigo-600/50 flex items-center justify-center">
          <CheckCircle size={32} className="text-indigo-400" weight="bold" />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">Wallet Connected</div>
          <div className="text-xs text-indigo-300 font-mono mt-1">{formatAddress(solanaWallet.address, 6)}</div>
        </div>
        <MagneticButton
          onClick={onConnected}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all cursor-pointer min-h-[44px]"
        >
          <span>Continue to Application</span>
          <ArrowRight size={16} weight="bold" />
        </MagneticButton>
      </div>
    );
  }

  if (authenticated && !solanaWallet) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
        <div className="w-14 h-14 rounded-full bg-violet-950 border border-violet-600/50 flex items-center justify-center">
          <PlusCircle size={28} className="text-violet-400" weight="bold" />
        </div>
        <div>
          <div className="text-sm font-bold text-white mb-1">Create Your Solana Wallet</div>
          <p className="text-xs text-slate-400 max-w-xs">
            You're signed in. Now create a free embedded Solana wallet — no extensions needed.
          </p>
        </div>
        <MagneticButton
          onClick={handleCreate}
          disabled={isCreating}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold text-sm transition-all cursor-pointer min-h-[44px]"
        >
          {isCreating ? <CircleNotch size={16} className="animate-spin" /> : <PlusCircle size={16} weight="bold" />}
          <span>{isCreating ? 'Creating wallet…' : 'Create Solana Wallet'}</span>
        </MagneticButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center">
        <Wallet size={32} className="text-indigo-400" weight="duotone" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white font-['Syne']">Connect Your Wallet to Apply</h3>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          To apply for a micro-loan, you need a Solana wallet. It's used to verify your identity on-chain and receive funds.
        </p>
      </div>

      <div className="w-full space-y-3 max-w-xs">
        <MagneticButton
          onClick={() => login()}
          className="w-full flex items-center justify-center space-x-3 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-900/30 min-h-[48px]"
        >
          <Lightning size={18} weight="fill" />
          <span>Connect with Privy</span>
        </MagneticButton>

        <p className="text-[10px] text-slate-500 leading-relaxed">
          Use email, Google, or an existing wallet (Phantom, Solflare). We'll create a free Solana wallet for you if you don't have one.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full text-center text-[10px] text-slate-500 border-t border-slate-800 pt-5">
        <div className="space-y-1">
          <div className="text-indigo-400 font-semibold">0% Interest</div>
          <div>Zero predatory fees</div>
        </div>
        <div className="space-y-1">
          <div className="text-indigo-400 font-semibold">On-Chain</div>
          <div>Solana-verified escrow</div>
        </div>
        <div className="space-y-1">
          <div className="text-indigo-400 font-semibold">Free</div>
          <div>No platform cut</div>
        </div>
      </div>
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────────────

function SuccessScreen({ form, walletAddr, onClose }: { form: FormData; walletAddr: string; onClose: () => void }) {
  const refId = `LC-${Date.now().toString(36).toUpperCase()}`;
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-6">
      <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-600/50 flex items-center justify-center">
        <CheckCircle size={36} className="text-emerald-400" weight="bold" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white font-['Syne'] mb-1">Application Submitted!</h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
          Your loan request for <strong className="text-white">{form.title}</strong> has been received.
        </p>
      </div>

      <div className="w-full p-4 rounded-xl bg-[#090e1a] border border-[#172554] text-xs text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Reference ID</span>
          <span className="font-mono text-indigo-300">{refId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Amount requested</span>
          <span className="font-mono text-white">${form.goalUSD.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Repayment term</span>
          <span className="font-mono text-white">{form.termsMonths} months @ 0%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Borrower wallet</span>
          <span className="font-mono text-indigo-300">{formatAddress(walletAddr, 6)}</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-700/30 text-xs text-indigo-200 leading-relaxed">
        Our team will review your application within 3–5 business days. Once approved, your loan will appear in the LendingChain directory and lenders can start funding immediately.
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer"
      >
        Close & Explore Other Loans
      </button>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

function RequestLoanContent({ onClose }: { onClose: () => void }) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets?.[0] ?? null;

  const [walletGatePassed, setWalletGatePassed] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormData, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // If they already have a wallet connected skip the gate
  const alreadyConnected = authenticated && !!solanaWallet;

  const showGate = !walletGatePassed && !alreadyConnected;

  const canProceed = (): boolean => {
    if (step === 1) return !!(form.fullName && form.role && form.country && form.city);
    if (step === 2) return !!(form.title && form.category && form.summary && form.story && form.businessPlan);
    if (step === 3) return form.goalUSD >= 50 && form.termsMonths > 0;
    if (step === 4) return !!(form.peopleBenefited && form.impactStatement);
    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!solanaWallet) throw new Error("Wallet not connected.");
      
      const loanId = `loan-${Date.now()}`;
      
      const newLoan: LoanRequest = {
        id: loanId,
        title: form.title,
        borrowerName: form.fullName,
        borrowerRole: form.role,
        borrowerAvatar: '/images/borrowers/default.jpg',
        location: {
          city: form.city,
          country: form.country,
          countryCode: 'US' // Mock or derive from form if added
        },
        category: form.category as LoanCategory,
        summary: form.summary,
        story: form.story,
        businessPlan: form.businessPlan,
        impactMetrics: [
          { label: 'Beneficiaries', value: form.peopleBenefited, iconName: 'Users' }
        ],
        goalUSD: form.goalUSD,
        goalSOL: Number((form.goalUSD / 145).toFixed(2)),
        raisedUSD: 0,
        raisedSOL: 0,
        lendersCount: 0,
        termsMonths: form.termsMonths,
        interestRate: 0,
        escrowAddress: deriveLoanEscrowInfo(loanId).vaultPda,
        status: 'funding',
        repaymentSchedule: [], // Could be populated based on termsMonths
        createdAt: new Date().toISOString().split('T')[0],
        featured: false
      };

      // Write to Firestore
      await setDoc(doc(db, 'loans', loanId), newLoan);
      
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message ?? 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#080c16]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e1526] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#090e1a] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-violet-950 border border-violet-700/50 flex items-center justify-center text-violet-400">
              <HandHeart size={20} weight="bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Syne']">Request a Micro-Loan</h2>
              <p className="text-[11px] text-slate-400">0% interest · Solana blockchain · Free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto touch-pan-y p-5 sm:p-6">
          {submitted ? (
            <SuccessScreen
              form={form}
              walletAddr={solanaWallet?.address ?? ''}
              onClose={onClose}
            />
          ) : showGate ? (
            <WalletGate onConnected={() => setWalletGatePassed(true)} />
          ) : (
            <>
              <StepBar step={step} total={TOTAL_STEPS} />

              {step === 1 && <Step1 form={form} set={set} />}
              {step === 2 && <Step2 form={form} set={set} />}
              {step === 3 && <Step3 form={form} set={set} />}
              {step === 4 && <Step4 form={form} set={set} />}

              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs mt-4">
                  <WarningCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Wallet reminder banner */}
              {(alreadyConnected || walletGatePassed) && solanaWallet && (
                <div className="flex items-center space-x-2 mt-4 px-3 py-2 rounded-lg bg-[#090e1a] border border-slate-800 text-[11px] text-slate-400">
                  <ShieldCheck size={14} className="text-indigo-400 flex-shrink-0" />
                  <span>
                    Borrower wallet:{' '}
                    <span className="font-mono text-indigo-300">{formatAddress(solanaWallet.address, 5)}</span>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Nav */}
        {!submitted && !showGate && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-[#090e1a] flex-shrink-0 gap-3">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i + 1 === step ? 'bg-indigo-400 w-4' : i + 1 < step ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {step < TOTAL_STEPS ? (
              <MagneticButton
                onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
                disabled={!canProceed()}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all cursor-pointer min-h-[44px]"
              >
                <span>Next</span>
                <ArrowRight size={16} weight="bold" />
              </MagneticButton>
            ) : (
              <MagneticButton
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all cursor-pointer min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={16} className="animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={16} weight="bold" />
                    <span>Submit Application</span>
                  </>
                )}
              </MagneticButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestLoanModal({ onClose }: { onClose: () => void }) {
  return (
    <PrivySolanaProvider>
      <RequestLoanContent onClose={onClose} />
    </PrivySolanaProvider>
  );
}
