import React, { useState } from 'react';
import type { LoanRequest, LenderBadge } from '../lib/types';
import { SOL_USD_RATE } from '../lib/loansData';
import { getStore, lendToLoan } from '../lib/store';
import { executeLendTransaction, getSolanaExplorerUrl, formatAddress } from '../lib/solana';
import PrivySolanaProvider from './PrivySolanaProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useSignMessage, useCreateWallet } from '@privy-io/react-auth/solana';
import bs58 from 'bs58';
import confetti from 'canvas-confetti';
import { 
  X, 
  PaperPlaneTilt, 
  CheckCircle, 
  ArrowSquareOut, 
  ShieldCheck, 
  Coins, 
  ChatText, 
  CircleNotch,
  WarningCircle,
  Certificate,
  Key,
  Lightning,
  Check
} from '@phosphor-icons/react';

interface LendModalProps {
  loan: LoanRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

function LendModalContent({ loan, onClose, onSuccess }: LendModalProps) {
  const store = getStore();
  const [amountUSD, setAmountUSD] = useState<number>(25);
  const [memoMessage, setMemoMessage] = useState<string>('Capital deployed in support of sustainable community enterprise.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<{
    txHash: string;
    isRealOnChain: boolean;
    newBadges: LenderBadge[];
    signedViaPrivy: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Privy Solana hooks
  let privyAuth: { login?: () => void; authenticated?: boolean } = {};
  let privyWallets: { wallets?: any[] } = {};
  let privySign: { signMessage?: any } = {};
  let privyCreate: { createWallet?: any } = {};

  try {
    privyAuth = usePrivy();
  } catch {}
  try {
    privyWallets = useWallets();
  } catch {}
  try {
    privySign = useSignMessage();
  } catch {}
  try {
    privyCreate = useCreateWallet();
  } catch {}

  const { login, authenticated } = privyAuth;
  const { wallets } = privyWallets;
  const { signMessage } = privySign;
  const { createWallet } = privyCreate;

  const connectedSolanaWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  const amountSOL = Number((amountUSD / SOL_USD_RATE).toFixed(3));
  const remainingUSD = Math.max(0, loan.goalUSD - loan.raisedUSD);

  const presetAmounts = [10, 25, 50, 100];

  const handleLend = async () => {
    if (amountUSD <= 0) return;
    if (store.wallet.balanceSOL < amountSOL) {
      setErrorMessage(`Insufficient SOL balance (${store.wallet.balanceSOL.toFixed(2)} SOL). Use the faucet in the navigation bar to request +1 Devnet SOL.`);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let finalSignature: string;
      let isPrivySigned = false;

      // Follow Privy's Solana signMessage documentation if a Privy wallet is active
      if (connectedSolanaWallet && signMessage) {
        try {
          const messageText = `LendingChain: Micro-loan commitment of ${amountSOL} SOL ($${amountUSD} USD) to Escrow ${loan.escrowAddress} for ${loan.borrowerName}. Memo: "${memoMessage}". Timestamp: ${new Date().toISOString()}`;
          const encodedMessage = new TextEncoder().encode(messageText);

          const signResult = await signMessage({
            message: encodedMessage,
            wallet: connectedSolanaWallet,
            options: {
              uiOptions: {
                title: 'Sign LendingChain Micro-Loan'
              }
            }
          });

          if (signResult?.signature) {
            finalSignature = bs58.encode(signResult.signature);
            isPrivySigned = true;
          } else {
            throw new Error('No signature returned from Privy');
          }
        } catch (privyErr: any) {
          console.warn('Privy message signing failed or cancelled, using devnet fallback:', privyErr);
          // Fall back to devnet execution if user cancels or testing offline
          const result = await executeLendTransaction({
            fromAddress: connectedSolanaWallet.address || store.wallet.address,
            toEscrowAddress: loan.escrowAddress,
            amountSOL,
            loanId: loan.id,
            message: memoMessage
          });
          finalSignature = result.signature;
        }
      } else {
        // Devnet Keypair direct transaction
        const result = await executeLendTransaction({
          fromAddress: store.wallet.address,
          toEscrowAddress: loan.escrowAddress,
          amountSOL,
          loanId: loan.id,
          message: memoMessage
        });
        finalSignature = result.signature;
      }

      const { newBadges } = lendToLoan({
        loanId: loan.id,
        amountSOL,
        amountUSD,
        message: memoMessage,
        txHash: finalSignature,
        lenderAddress: connectedSolanaWallet?.address || store.wallet.address
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#3b82f6', '#10b981', '#ffffff']
      });

      setTxResult({
        txHash: finalSignature,
        isRealOnChain: !finalSignature.includes('...'),
        newBadges,
        signedViaPrivy: isPrivySigned
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#080c16]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1526] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#090e1a] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Coins size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Syne']">Lend with Solana</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Direct zero-interest capital to borrower escrow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area (Scrollable on small viewports) */}
        {!txResult ? (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto touch-pan-y">
            {/* Borrower Summary */}
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#090e1a] border border-[#172554]">
              <img 
                src={loan.borrowerAvatar} 
                alt={loan.borrowerName} 
                className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate font-['Syne']">{loan.borrowerName}</div>
                <p className="text-xs text-slate-400 truncate">{loan.title}</p>
                <div className="text-[11px] text-indigo-300 font-mono tabular-nums mt-0.5">
                  ${remainingUSD} needed of ${loan.goalUSD} goal
                </div>
              </div>
            </div>

            {/* Privy Solana Wallet State & Connector */}
            <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <Key size={18} className="text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <span className="truncate">Signer:</span>
                    <span className="font-mono text-indigo-300 truncate">
                      {formatAddress(connectedSolanaWallet?.address || store.wallet.address, 4)}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    {connectedSolanaWallet ? 'Privy Solana Wallet Connected' : 'Instant Solana Devnet Keypair'}
                  </div>
                </div>
              </div>

              {!connectedSolanaWallet && login && (
                <button
                  type="button"
                  onClick={() => login()}
                  className="px-3 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer min-h-[38px] flex-shrink-0"
                >
                  <Lightning size={14} weight="fill" />
                  <span>Use Privy</span>
                </button>
              )}
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Amount (USD Equivalent)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountUSD(amt)}
                    className={`py-3 px-2 rounded-xl font-bold text-sm transition-all border cursor-pointer min-h-[44px] flex items-center justify-center ${
                      amountUSD === amt
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-[#090e1a] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  $
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max={remainingUSD || 500}
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(Number(e.target.value))}
                  className="w-full pl-8 pr-28 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                  placeholder="Custom Amount"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono tabular-nums text-indigo-400">
                  ≈ {amountSOL} SOL
                </div>
              </div>
            </div>

            {/* Impact Calculation Preview */}
            <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-indigo-300 block font-['Syne']">Impact Assessment</span>
              <p className="leading-relaxed">
                Your <strong className="text-white font-mono tabular-nums">${amountUSD}</strong> contribution funds <strong className="text-indigo-400 font-mono tabular-nums">{Math.round((amountUSD / loan.goalUSD) * 100)}%</strong> of this initiative. Repayments return to your wallet over {loan.termsMonths} months at 0% interest.
              </p>
            </div>

            {/* On-Chain Memo Message */}
            <div>
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <ChatText size={16} className="text-indigo-400" />
                <span>On-Chain Memo (Recorded on Solana)</span>
              </label>
              <textarea
                rows={2}
                value={memoMessage}
                onChange={(e) => setMemoMessage(e.target.value)}
                maxLength={120}
                placeholder="Write a message for the entrepreneur..."
                className="w-full p-3 bg-[#090e1a] border border-[#172554] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Stored via SPL Memo Program</span>
                <span className="font-mono">{memoMessage.length}/120</span>
              </div>
            </div>

            {/* Escrow Proof */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-[#090e1a] p-2.5 rounded-xl border border-slate-800">
              <ShieldCheck size={16} className="text-indigo-400 flex-shrink-0" />
              <div className="truncate">
                Escrow Address: <span className="font-mono text-slate-300">{formatAddress(loan.escrowAddress, 6)}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                <WarningCircle size={16} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Solid Indigo Action Button */}
            <button
              type="button"
              onClick={handleLend}
              disabled={isSubmitting || amountUSD <= 0}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={18} className="animate-spin text-white" />
                  <span>Signing & Broadcasting on Solana...</span>
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={18} weight="bold" />
                  <span>Confirm Loan: ${amountUSD} ({amountSOL} SOL)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Confirmation State */
          <div className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mx-auto">
              <CheckCircle size={32} weight="bold" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-1 font-['Syne']">Loan Dispatched to Escrow</h4>
              <p className="text-sm text-slate-300">
                You funded <strong className="text-indigo-400 font-mono tabular-nums">${amountUSD}</strong> for{' '}
                <strong className="text-white">{loan.borrowerName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090e1a] border border-[#172554] text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="text-indigo-400 font-mono font-semibold">Solana Devnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signature:</span>
                <span className="font-mono text-slate-300">{formatAddress(txResult.txHash, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signer Verification:</span>
                <span className="text-emerald-400 font-mono font-medium flex items-center space-x-1">
                  <Check size={12} />
                  <span>{txResult.signedViaPrivy ? 'Privy Solana Standard' : 'Solana Devnet ed25519'}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Escrow:</span>
                <span className="font-mono text-slate-300">{formatAddress(loan.escrowAddress, 6)}</span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <a
                  href={getSolanaExplorerUrl(txResult.txHash, 'devnet')}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-[#0e1526] hover:bg-slate-800 text-indigo-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors border border-slate-800"
                >
                  <span>Verify on Solana Explorer</span>
                  <ArrowSquareOut size={14} />
                </a>
              </div>
            </div>

            {txResult.newBadges.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#090e1a] border border-indigo-500/30 text-left flex items-center space-x-3">
                <Certificate size={24} className="text-indigo-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    New Lender Badge Unlocked
                  </div>
                  <p className="text-xs font-semibold text-white">{txResult.newBadges[0].title}</p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Done & Return to Loans
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LendModal(props: LendModalProps) {
  return (
    <PrivySolanaProvider>
      <LendModalContent {...props} />
    </PrivySolanaProvider>
  );
}
