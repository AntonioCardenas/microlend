import React, { useState, useEffect } from 'react';
import PrivySolanaProvider from './PrivySolanaProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useCreateWallet } from '@privy-io/react-auth/solana';
import { MagneticButton } from './ui/magnetic-button';
import { FadeUp } from './ui/fade-up';
import type { LoanCategory } from '../lib/types';
import {
  HandHeart, Lightning, Wallet, ArrowRight, ArrowLeft, CheckCircle,
  MapPin, Sparkle, CircleNotch, ShieldCheck, WarningCircle, PlusCircle,
  Globe, Users, Leaf, PaperPlaneTilt, ArrowSquareOut, X,
  Plant, Sun, Storefront, UsersThree, GraduationCap,
} from '@phosphor-icons/react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { id: LoanCategory; icon: React.ElementType }[] = [
  { id: 'Agriculture',        icon: Plant },
  { id: 'Clean Energy',       icon: Sun },
  { id: 'Small Business',     icon: Storefront },
  { id: 'Women-Led',          icon: UsersThree },
  { id: 'Education',          icon: GraduationCap },
  { id: 'Climate Resilience', icon: Leaf },
];

const AMOUNT_PRESETS = [250, 500, 1000, 2000, 3500, 5000];
const TERM_PRESETS   = [6, 8, 10, 12, 14, 18];
const SOL_RATE = 145;

interface FormData {
  fullName: string; role: string; country: string; city: string;
  title: string; category: LoanCategory | ''; summary: string;
  story: string; businessPlan: string;
  goalUSD: number; termsMonths: number;
  peopleBenefited: string; impactStatement: string;
  agreedTerms: boolean;
}

const INIT: FormData = {
  fullName: '', role: '', country: '', city: '',
  title: '', category: '', summary: '', story: '', businessPlan: '',
  goalUSD: 1000, termsMonths: 12,
  peopleBenefited: '', impactStatement: '',
  agreedTerms: false,
};

function fmt(addr: string, n = 5) {
  return addr && addr.length > n * 2 + 3 ? `${addr.slice(0, n)}...${addr.slice(-n)}` : addr;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

const STEPS = ['Identity', 'Project', 'Loan Terms', 'Impact'];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const idx   = i + 1;
        const done  = idx < step;
        const active = idx === step;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done   ? 'bg-indigo-600 border-indigo-500 text-white'
                : active ? 'bg-[#0e1526] border-indigo-400 text-indigo-300'
                :          'bg-[#090e1a] border-slate-700 text-slate-600'}`}>
                {done ? <CheckCircle size={16} weight="bold" /> : idx}
              </div>
              <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-wider text-center w-16 ${
                active ? 'text-indigo-300' : done ? 'text-indigo-500/60' : 'text-slate-700'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 ${done ? 'bg-indigo-600' : 'bg-slate-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Reusable field components ────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-3 bg-[#090e1a] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-colors min-h-[48px]';

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}{note && <span className="text-slate-600 font-normal normal-case ml-1">({note})</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ f, set }: { f: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white font-['Syne']">Who are you?</h2>
        <p className="text-xs text-slate-400 mt-1">Your identity is linked on-chain to your Solana wallet for transparency.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name / Organization *">
          <input className={inputCls} value={f.fullName} onChange={e => set('fullName', e.target.value)}
            placeholder="e.g. Fatima Zahra & Al-Amal Cooperative" />
        </Field>
        <Field label="Your Role / Title *">
          <input className={inputCls} value={f.role} onChange={e => set('role', e.target.value)}
            placeholder="e.g. Cooperative President" />
        </Field>
        <Field label="Country *">
          <div className="relative">
            <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input className={`${inputCls} pl-9`} value={f.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Morocco" />
          </div>
        </Field>
        <Field label="City / Region *">
          <div className="relative">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input className={`${inputCls} pl-9`} value={f.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Essaouira" />
          </div>
        </Field>
      </div>
      <div className="flex gap-3 p-4 rounded-xl bg-indigo-950/20 border border-indigo-700/20">
        <ShieldCheck size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">Only your Solana wallet address is stored on-chain. No personal data is shared without consent.</p>
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ f, set }: { f: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white font-['Syne']">Describe your project</h2>
        <p className="text-xs text-slate-400 mt-1">Give lenders a clear picture of your enterprise and how you'll use the funds.</p>
      </div>

      <Field label="Project Title *">
        <input className={inputCls} value={f.title} onChange={e => set('title', e.target.value)}
          placeholder="e.g. Solar-Powered Cold Olive Press for Argan Cooperative" />
      </Field>

      <Field label="Category *">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = f.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => set('category', cat.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-950/50'
                    : 'bg-[#090e1a] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Icon size={18} weight={isSelected ? "bold" : "regular"} className={isSelected ? "text-indigo-400" : "text-slate-500"} />
                <span>{cat.id}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="One-line summary *" note={`${f.summary.length}/140 · shown on loan card`}>
        <input className={inputCls} value={f.summary} onChange={e => set('summary', e.target.value)}
          maxLength={140} placeholder="A single sentence pitch for your project..." />
      </Field>

      <Field label="Your story *" note="personal background & why this matters">
        <textarea rows={4} className={`${inputCls} resize-none`} value={f.story}
          onChange={e => set('story', e.target.value)}
          placeholder="Share your background, the community problem, and why this loan matters..." />
      </Field>

      <Field label="Business plan & fund allocation *" note="how will you use the money?">
        <textarea rows={4} className={`${inputCls} resize-none`} value={f.businessPlan}
          onChange={e => set('businessPlan', e.target.value)}
          placeholder="Break down exactly how funds will be spent (equipment, supplies, services) and your repayment plan..." />
      </Field>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ f, set }: { f: FormData; set: (k: keyof FormData, v: any) => void }) {
  const goalSOL    = (f.goalUSD / SOL_RATE).toFixed(2);
  const monthlyUSD = f.termsMonths > 0 ? Math.ceil(f.goalUSD / f.termsMonths) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-['Syne']">Set your loan terms</h2>
        <p className="text-xs text-slate-400 mt-1">All LendingChain loans are zero-interest. Funds go directly to your Solana wallet.</p>
      </div>

      <div className="space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Loan Amount (USD) *</label>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNT_PRESETS.map(p => (
            <button key={p} type="button" onClick={() => set('goalUSD', p)}
              className={`py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all min-h-[44px] ${
                f.goalUSD === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#090e1a] border-slate-800 text-slate-300 hover:border-slate-600'}`}>
              ${p.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 inset-y-0 flex items-center text-slate-500 font-bold pointer-events-none">$</span>
          <input type="number" min={50} max={10000} step={50} value={f.goalUSD}
            onChange={e => set('goalUSD', Math.max(50, Number(e.target.value)))}
            className={`${inputCls} pl-8 pr-24`} />
          <span className="absolute right-4 inset-y-0 flex items-center text-xs font-mono text-indigo-400 pointer-events-none">≈ {goalSOL} SOL</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Repayment Period *</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TERM_PRESETS.map(mo => (
            <button key={mo} type="button" onClick={() => set('termsMonths', mo)}
              className={`py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all min-h-[44px] ${
                f.termsMonths === mo ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#090e1a] border-slate-800 text-slate-300 hover:border-slate-600'}`}>
              {mo} mo
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#090e1a] border border-[#172554] space-y-2.5">
        <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Loan Summary</p>
        {([
          ['Total requested', `$${f.goalUSD.toLocaleString()} ≈ ${goalSOL} SOL`, ''],
          ['Repayment period', `${f.termsMonths} months`, ''],
          ['Monthly payment', `$${monthlyUSD}/mo`, ''],
          ['Interest rate', '0.00%', 'emerald'],
          ['Platform fee', '$0.00 — Free', 'emerald'],
        ] as [string, string, string][]).map(([k, v, color]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-slate-400">{k}</span>
            <span className={`font-mono font-bold ${color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4({ f, set, walletAddr }: { f: FormData; set: (k: keyof FormData, v: any) => void; walletAddr: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white font-['Syne']">Impact & commitment</h2>
        <p className="text-xs text-slate-400 mt-1">Show lenders who benefits and what measurable change your loan will create.</p>
      </div>

      <Field label="People / families benefited *">
        <div className="relative">
          <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input className={`${inputCls} pl-9`} value={f.peopleBenefited}
            onChange={e => set('peopleBenefited', e.target.value)}
            placeholder="e.g. 34 female farmers, 120 school children, 60 fishing crews..." />
        </div>
      </Field>

      <Field label="Measurable impact statement *">
        <textarea rows={5} className={`${inputCls} resize-none`} value={f.impactStatement}
          onChange={e => set('impactStatement', e.target.value)}
          placeholder="What changes in your community because of this loan? Include numbers: income increase %, jobs created, CO₂ avoided, water saved..." />
      </Field>

      {/* Wallet pill */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090e1a] border border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} weight="bold" className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">Borrower wallet verified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-indigo-300">{fmt(walletAddr, 5)}</span>
          <a href={`https://explorer.solana.com/address/${walletAddr}?cluster=devnet`} target="_blank" rel="noreferrer"
            className="text-slate-600 hover:text-indigo-400 transition-colors">
            <ArrowSquareOut size={12} />
          </a>
        </div>
      </div>

      {/* Consent */}
      <label className="flex items-start gap-3 cursor-pointer group p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 hover:border-slate-700 transition-colors">
        <input type="checkbox" checked={f.agreedTerms} onChange={e => set('agreedTerms', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-indigo-500 cursor-pointer flex-shrink-0" />
        <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
          I confirm all information provided is accurate. I understand my loan request will be recorded on the Solana blockchain with my wallet address as the borrower public key. All repayments are publicly verifiable on-chain.
        </span>
      </label>

      <div className="p-4 rounded-xl bg-[#090e1a] border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-2.5">
          <Leaf size={14} className="text-indigo-400" /><span>What happens next</span>
        </div>
        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Our team reviews your application within 3–5 business days</li>
          <li>Approved loans appear live in the LendingChain directory</li>
          <li>Lenders fund you directly — SOL goes straight to your wallet</li>
          <li>Monthly repayments return to lenders at 0% interest on-chain</li>
        </ol>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ f, walletAddr }: { f: FormData; walletAddr: string }) {
  const ref     = `LC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const goalSOL = (f.goalUSD / SOL_RATE).toFixed(2);
  return (
    <div className="max-w-lg mx-auto py-10 flex flex-col items-center text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-emerald-950 border border-emerald-600/50 flex items-center justify-center">
        <CheckCircle size={44} weight="bold" className="text-emerald-400" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Application Submitted</div>
        <h2 className="text-2xl font-extrabold text-white font-['Syne'] mb-2">You're in the queue!</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Your micro-loan application for <strong className="text-white">{f.title || 'your project'}</strong> has been received.
        </p>
      </div>
      <div className="w-full p-5 rounded-2xl bg-[#090e1a] border border-[#172554] text-xs text-left space-y-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Application Details</p>
        {[
          ['Reference ID', ref],
          ['Applicant', f.fullName],
          ['Location', `${f.city}, ${f.country}`],
          ['Loan', `$${f.goalUSD.toLocaleString()} ≈ ${goalSOL} SOL`],
          ['Term', `${f.termsMonths} months @ 0%`],
          ['Borrower wallet', fmt(walletAddr, 6)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-slate-400">{k}</span>
            <span className="font-mono text-slate-200">{v}</span>
          </div>
        ))}
      </div>
      <div className="w-full p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/30 text-xs text-indigo-200 leading-relaxed text-left flex gap-3">
        <PaperPlaneTilt size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <span>Our team will review within <strong>3–5 business days</strong>. Once approved, your listing goes live and lenders can start funding immediately.</span>
      </div>
      <a href="/" className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
        ← Explore Active Loans
      </a>
    </div>
  );
}

// ─── Inner content (wrapped by PrivySolanaProvider, safe to use hooks) ─────────

const TOTAL = 4;

// ─── ApplyInner: all Privy hooks (safe — inside PrivySolanaProvider) ──────────

function ApplyInner() {
  let privyAuth: { login?: () => void; authenticated?: boolean; ready?: boolean } = {};
  let privyWallets: { wallets?: any[] } = {};
  let privyCreate: { createWallet?: () => Promise<any> } = {};

  try { privyAuth = usePrivy(); } catch {}
  try { privyWallets = useWallets(); } catch {}
  try { privyCreate = useCreateWallet(); } catch {}

  const { login = () => {}, authenticated = false, ready: authReady = true } = privyAuth;
  const { wallets = [] } = privyWallets;
  const { createWallet = async () => null } = privyCreate;

  const wallet = wallets?.[0] ?? null;

  const [walletAddr, setWalletAddr] = useState<string>('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INIT);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const set = (k: keyof FormData, v: any) => setForm(p => ({ ...p, [k]: v }));

  // Auto-detect wallet once Privy is ready
  useEffect(() => {
    if (authenticated && wallet?.address && !walletAddr) {
      setWalletAddr(wallet.address);
    }
  }, [authenticated, wallet?.address]);

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      const w = await createWallet();
      if (w?.address) setWalletAddr(w.address);
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const canNext = (): boolean => {
    if (step === 1) return !!(form.fullName && form.role && form.country && form.city);
    if (step === 2) return !!(form.title && form.category && form.summary && form.story && form.businessPlan);
    if (step === 3) return form.goalUSD >= 50 && form.termsMonths > 0;
    if (step === 4) return !!(form.peopleBenefited && form.impactStatement && form.agreedTerms);
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 1800));
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message ?? 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#080c16] flex items-center justify-center gap-3">
        <CircleNotch size={28} className="animate-spin text-indigo-400" />
        <span className="text-sm text-slate-400">Loading…</span>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080c16]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <SuccessScreen f={form} walletAddr={walletAddr} />
        </div>
      </div>
    );
  }

  // ── Wallet gate ──────────────────────────────────────────────────────────────
  if (!walletAddr) {
    return (
      <div className="min-h-screen bg-[#080c16]">
        <FadeUp duration={0.8} yOffset={30} className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-8">
            ← Back to LendingChain
          </a>

          {/* Page heading */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-950 border border-violet-700/50 flex items-center justify-center text-violet-400 flex-shrink-0">
              <HandHeart size={22} weight="bold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne']">Apply for a Micro-Loan</h1>
              <p className="text-sm text-slate-400">0% interest · Solana on-chain · Free platform</p>
            </div>
          </div>

          <div className="max-w-md mx-auto flex flex-col items-center text-center gap-7">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-950 to-violet-950 border border-indigo-700/50 flex items-center justify-center">
              <Wallet size={40} weight="duotone" className="text-indigo-300" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Syne']">Connect Your Wallet to Apply</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                A Solana wallet is required to link your identity on-chain and receive loan funds directly.
              </p>
            </div>

            {!authenticated ? (
              <div className="w-full max-w-xs space-y-3">
                <MagneticButton onClick={() => login()}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all cursor-pointer min-h-[52px]">
                  <Lightning size={20} weight="fill" />
                  <span>Connect with Privy</span>
                </MagneticButton>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Or</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <MagneticButton
                  onClick={() => setWalletAddr('8sTk7uW3q9jLmPx2vRnYeZsKaBcDeFgHiJkLmNoPqRsT')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-[#090e1a] hover:bg-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer min-h-[44px]"
                >
                  <Wallet size={15} className="text-indigo-400" />
                  <span>Continue with Demo Borrower Wallet</span>
                </MagneticButton>
              </div>
            ) : !wallet ? (
              <div className="w-full max-w-xs space-y-3">
                <MagneticButton onClick={handleCreateWallet} disabled={creating}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-violet-700 hover:bg-violet-600 text-white font-bold text-base transition-all cursor-pointer min-h-[52px]">
                  {creating ? <CircleNotch size={20} className="animate-spin" /> : <PlusCircle size={20} weight="bold" />}
                  <span>{creating ? 'Creating wallet…' : 'Create Solana Wallet'}</span>
                </MagneticButton>
                <p className="text-[11px] text-slate-500">You're signed in. Now create your free embedded Solana wallet — no browser extension needed.</p>
              </div>
            ) : (
              // Wallet exists — button to proceed manually if effect hasn't fired
              <MagneticButton onClick={() => setWalletAddr(wallet.address)}
                className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-all cursor-pointer min-h-[48px]">
                <CheckCircle size={18} weight="bold" />
                <span>Continue with {fmt(wallet.address, 5)}</span>
              </MagneticButton>
            )}

            <div className="grid grid-cols-3 gap-4 w-full border-t border-slate-800 pt-5 text-center text-[11px]">
              {[['0%', 'Interest'], ['On-Chain', 'Verified'], ['Free', 'To Apply']].map(([a, b]) => (
                <div key={a}>
                  <div className="text-indigo-400 font-bold">{a}</div>
                  <div className="text-slate-600">{b}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c16]">
      <FadeUp duration={0.6} className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-6">
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4">
            ← Back to LendingChain
          </a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950 border border-violet-700/50 flex items-center justify-center text-violet-400 flex-shrink-0">
              <HandHeart size={22} weight="bold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne']">Apply for a Micro-Loan</h1>
              <p className="text-sm text-slate-400">0% interest · Solana on-chain · Free platform</p>
            </div>
          </div>
        </div>

        {/* Wallet chip */}
        <div className="flex items-center gap-2 mb-6 px-3.5 py-2 rounded-xl bg-[#090e1a] border border-slate-800 w-fit">
          <CheckCircle size={13} className="text-emerald-400" weight="bold" />
          <span className="text-xs text-slate-400">Borrower wallet:</span>
          <span className="text-xs font-mono text-indigo-300">{fmt(walletAddr, 5)}</span>
          <button onClick={() => setWalletAddr('')} className="text-slate-600 hover:text-rose-400 transition-colors ml-1" title="Disconnect">
            <X size={12} />
          </button>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

          {/* Form card */}
          <div className="bg-[#0e1526] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Progress */}
            <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-slate-800 bg-[#090e1a]">
              <ProgressBar step={step} />
            </div>

            {/* Step body */}
            <div className="px-5 sm:px-8 py-7">
              {step === 1 && <Step1 f={form} set={set} />}
              {step === 2 && <Step2 f={form} set={set} />}
              {step === 3 && <Step3 f={form} set={set} />}
              {step === 4 && <Step4 f={form} set={set} walletAddr={walletAddr} />}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs mt-4">
                  <WarningCircle size={15} className="flex-shrink-0" /><span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="px-5 sm:px-8 py-4 border-t border-slate-800 bg-[#090e1a] flex items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-colors cursor-pointer min-h-[44px]">
                <ArrowLeft size={14} weight="bold" /><span>Back</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === step ? 'w-5 bg-indigo-400' : i + 1 < step ? 'w-1.5 bg-indigo-600' : 'w-1.5 bg-slate-700'}`} />
                ))}
              </div>

              {step < TOTAL ? (
                <MagneticButton onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all cursor-pointer min-h-[44px]">
                  <span>Next</span><ArrowRight size={14} weight="bold" />
                </MagneticButton>
              ) : (
                <MagneticButton onClick={handleSubmit} disabled={!canNext() || submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all cursor-pointer min-h-[44px]">
                  {submitting
                    ? <><CircleNotch size={14} className="animate-spin" /><span>Submitting…</span></>
                    : <><Sparkle size={14} weight="bold" /><span>Submit Application</span></>}
                </MagneticButton>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0e1526] border border-slate-800">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-4">How It Works</p>
              <ol className="space-y-3.5">
                {[
                  ['Apply in 4 steps', 'Fill identity, project, terms, and impact.'],
                  ['Wallet verification', 'Your Solana address is your on-chain identity.'],
                  ['Review in 3–5 days', 'We vet applications for feasibility and impact.'],
                  ['Go live & get funded', 'Lenders send SOL directly to your wallet.'],
                  ['Repay monthly', '0% interest. Repayments go back on-chain.'],
                ].map(([title, desc], i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700/50 text-[10px] font-bold text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <div className="text-xs font-semibold text-white">{title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Platform Guarantees</p>
              {[
                ['0% Interest', 'No interest or fees ever'],
                ['Direct to Wallet', 'No bank or middleman'],
                ['On-Chain Verified', 'Every tx is public'],
                ['Free to Apply', 'Zero application fee'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start gap-2.5">
                  <CheckCircle size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <div className="text-xs font-semibold text-white">{k}</div>
                    <div className="text-[11px] text-slate-500">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ApplyPage] ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080c16] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 rounded-2xl bg-red-950/40 border border-red-500/30 space-y-4">
            <h2 className="text-xl font-bold text-red-300 font-['Syne']">Unable to load Application Form</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors"
              >
                Back Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Exported page (PrivySolanaProvider wraps everything) ─────────────────────

export default function ApplyPage() {
  return (
    <ErrorBoundary>
      <PrivySolanaProvider>
        <ApplyInner />
      </PrivySolanaProvider>
    </ErrorBoundary>
  );
}
