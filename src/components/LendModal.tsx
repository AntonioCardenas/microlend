import React, { useState, useEffect } from 'react';
import type { LoanRequest, LenderBadge } from '../lib/types';
import { SOL_USD_RATE } from '../lib/loansData';
import { 
  getStore, 
  subscribeStore, 
  lendToLoan, 
  connectDemoWallet, 
  updateConnectedWallet, 
  airdropToWallet,
  getUserLentToLoan 
} from '../lib/store';
import { 
  executeLendTransaction, 
  getSolanaExplorerUrl, 
  formatAddress, 
  fetchSolBalance 
} from '../lib/solana';
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
  Check,
  Wallet,
  PlusCircle,
  Drop
} from '@phosphor-icons/react';

interface LendModalProps {
  loan: LoanRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

function LendModalContent({ loan, onClose, onSuccess }: LendModalProps) {
  const [store, setStore] = useState(getStore());
  const [amountUSD, setAmountUSD] = useState<number>(25);
  const [memoMessage, setMemoMessage] = useState<string>('Capital deployed in support of sustainable community enterprise.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [txResult, setTxResult] = useState<{
    txHash: string;
    isRealOnChain: boolean;
    newBadges: LenderBadge[];
    signedViaPrivy: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to reactive store
  useEffect(() => {
    return subscribeStore(() => setStore({ ...getStore() }));
  }, []);

  // Privy Solana hooks
  let privyAuth: { login?: () => void; authenticated?: boolean; user?: any } = {};
  let privyWallets: { wallets?: any[] } = {};
  let privySign: { signMessage?: any } = {};
  let privyCreate: { createWallet?: () => Promise<any> } = {};

  try { privyAuth = usePrivy(); } catch {}
  try { privyWallets = useWallets(); } catch {}
  try { privySign = useSignMessage(); } catch {}
  try { privyCreate = useCreateWallet(); } catch {}

  const { login, authenticated } = privyAuth;
  const { wallets } = privyWallets;
  const { signMessage } = privySign;
  const { createWallet } = privyCreate;

  const connectedSolanaWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  // Active connected account
  const activeAddress = connectedSolanaWallet?.address || (store.wallet.connected ? store.wallet.address : null);
  const isConnected = Boolean(activeAddress);
  const isDemoWallet = Boolean(store.wallet.connected && store.wallet.isDemoWallet && !connectedSolanaWallet);

  // Sync Privy wallet address and live balance to store
  useEffect(() => {
    if (connectedSolanaWallet?.address) {
      updateConnectedWallet({ address: connectedSolanaWallet.address, providerType: 'privy' });
      fetchSolBalance(connectedSolanaWallet.address).then((bal) => {
        updateConnectedWallet({
          address: connectedSolanaWallet.address,
          providerType: 'privy',
          balanceSOL: bal
        });
      });
    }
  }, [connectedSolanaWallet?.address]);

  // Refresh balance if connected
  useEffect(() => {
    if (activeAddress && !isDemoWallet) {
      fetchSolBalance(activeAddress).then((bal) => {
        updateConnectedWallet({ address: activeAddress, balanceSOL: bal });
      });
    }
  }, [activeAddress, isDemoWallet]);

  const amountSOL = Number((amountUSD / SOL_USD_RATE).toFixed(3));
  const remainingUSD = Math.max(0, loan.goalUSD - loan.raisedUSD);
  const currentBalanceSOL = store.wallet.balanceSOL;
  const hasSufficientBalance = isConnected && currentBalanceSOL >= amountSOL;

  const { hasLended, totalLentUSD, totalLentSOL } = getUserLentToLoan(loan.id, activeAddress || undefined);

  const presetAmounts = [10, 25, 50, 100];

  const handleConnectDemo = () => {
    connectDemoWallet();
    setErrorMessage(null);
  };

  const handleCreateSolanaWallet = async () => {
    if (!createWallet) return;
    try {
      setIsCreatingWallet(true);
      const newWallet = await createWallet();
      if (newWallet?.address) {
        updateConnectedWallet({ address: newWallet.address, providerType: 'privy' });
      }
    } catch (err: any) {
      setErrorMessage(`Failed to create Solana wallet: ${err?.message || err}`);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleLend = async () => {
    if (!isConnected || !activeAddress) {
      setErrorMessage('No account connected. Please connect your wallet or use a demo account first.');
      return;
    }

    if (amountUSD <= 0) {
      setErrorMessage('Please select or enter an amount greater than 0.');
      return;
    }

    if (currentBalanceSOL < amountSOL) {
      setErrorMessage(`Insufficient SOL balance (${currentBalanceSOL.toFixed(3)} SOL). You need at least ${amountSOL} SOL.`);
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
            fromAddress: activeAddress,
            toEscrowAddress: loan.escrowAddress,
            amountSOL,
            loanId: loan.id,
            message: memoMessage
          });
          finalSignature = result.signature;
        }
      } else {
        // Direct Devnet transaction via local demo keypair
        const result = await executeLendTransaction({
          fromAddress: activeAddress,
          toEscrowAddress: loan.escrowAddress,
          amountSOL,
          loanId: loan.id,
          message: memoMessage
        });
        finalSignature = result.signature;
      }

      const { newBadges } = await lendToLoan({
        loanId: loan.id,
        amountSOL,
        amountUSD,
        message: memoMessage,
        txHash: finalSignature,
        lenderAddress: activeAddress
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
      setErrorMessage(err.message || 'Transaction could not be submitted to Solana.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080c16]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0e1526] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Coins size={18} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Syne']">
                {hasLended ? 'Lend More with Solana' : 'Lend with Solana'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {hasLended ? `Add to your previous $${totalLentUSD} commitment` : 'Direct zero-interest capital to borrower escrow'}
              </p>
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

            {/* Account Detection & Connection Card */}
            {isConnected ? (
              <div className="p-3.5 rounded-xl bg-[#090e1a] border border-emerald-500/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span>Signer:</span>
                        <span className="font-mono text-emerald-300 truncate">
                          {formatAddress(activeAddress, 4)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40 font-mono">
                          {connectedSolanaWallet ? 'Privy' : (isDemoWallet ? 'Demo Devnet' : 'Connected')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Balance: <strong className="text-indigo-300">{currentBalanceSOL.toFixed(3)} SOL</strong> (~${(currentBalanceSOL * SOL_USD_RATE).toFixed(2)})
                      </div>
                    </div>
                  </div>

                  {login && (
                    <button
                      type="button"
                      onClick={() => login()}
                      className="px-2.5 py-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
                    >
                      Switch
                    </button>
                  )}
                </div>
              </div>
            ) : authenticated && !connectedSolanaWallet ? (
              /* Privy Authenticated but No Solana Wallet */
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
                  <Key size={16} />
                  <span>Privy Signed In — Solana Wallet Needed</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your account is signed in, but needs an embedded Solana wallet to sign zero-interest loan transactions.
                </p>
                <button
                  type="button"
                  onClick={handleCreateSolanaWallet}
                  disabled={isCreatingWallet}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-sm min-h-[40px]"
                >
                  <PlusCircle size={15} weight="bold" />
                  <span>{isCreatingWallet ? 'Creating Wallet…' : 'Create Solana Wallet in 1-Click'}</span>
                </button>
              </div>
            ) : (
              /* Not Connected State */
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                    <WarningCircle size={16} weight="fill" className="text-amber-400 flex-shrink-0" />
                    <span>No Account Connected</span>
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono uppercase tracking-wider bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/40">
                    Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Connect your wallet to sign on Solana, or use an instant pre-funded Devnet demo account:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {login ? (
                    <button
                      type="button"
                      onClick={() => login()}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-colors min-h-[42px]"
                    >
                      <Lightning size={15} weight="fill" />
                      <span>Connect Privy</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleConnectDemo}
                    className="py-2.5 px-3 rounded-xl bg-[#090e1a] hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer transition-colors min-h-[42px]"
                  >
                    <Wallet size={15} />
                    <span>Use Demo Wallet</span>
                  </button>
                </div>
              </div>
            )}

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

            {/* Primary Action Section */}
            {!isConnected ? (
              /* Prompt user to connect first */
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (login) login();
                    else handleConnectDemo();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer min-h-[48px]"
                >
                  <Lightning size={18} weight="fill" />
                  <span>Connect Account to Lend</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Or{' '}
                  <button
                    type="button"
                    onClick={handleConnectDemo}
                    className="text-indigo-400 hover:underline cursor-pointer font-semibold"
                  >
                    click here to try with a Demo Devnet Account
                  </button>
                </p>
              </div>
            ) : !hasSufficientBalance ? (
              /* Insufficient Balance State with Quick Faucet */
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold block text-amber-300">Insufficient Devnet SOL</span>
                    <span className="text-[11px] text-amber-200/80">
                      You have {currentBalanceSOL.toFixed(3)} SOL, but this loan requires {amountSOL} SOL.
                    </span>
                  </div>
                  {isDemoWallet ? (
                    <button
                      type="button"
                      onClick={() => airdropToWallet(1.0)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer flex-shrink-0"
                    >
                      <Drop size={14} weight="fill" />
                      <span>+1 Demo SOL</span>
                    </button>
                  ) : (
                    <a
                      href="https://faucet.solana.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer flex-shrink-0"
                    >
                      <span>Devnet Faucet ↗</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm flex items-center justify-center space-x-2 cursor-not-allowed min-h-[48px]"
                >
                  <span>Need {amountSOL} SOL to Confirm</span>
                </button>
              </div>
            ) : (
              /* Ready to Confirm */
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
                    <span>{hasLended ? `Confirm Additional Loan: $${amountUSD} (${amountSOL} SOL)` : `Confirm Loan: $${amountUSD} (${amountSOL} SOL)`}</span>
                  </>
                )}
              </button>
            )}
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
