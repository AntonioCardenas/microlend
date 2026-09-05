import type { LoanRequest, LendTransaction, LenderBadge, UserPortfolio } from './types';
import { INITIAL_LOANS, BADGE_DEFINITIONS, INITIAL_TRANSACTIONS, SOL_USD_RATE } from './loansData';
import { getOrCreateDemoKeypair, fetchSolBalance, formatAddress } from './solana';
import { db } from './firebase';
import { collection, onSnapshot, doc, runTransaction, setDoc } from 'firebase/firestore';
import { seedFirestoreIfEmpty } from './loansData';

const STORAGE_KEY_LOANS = 'lendingchain_loans_v3';
const STORAGE_KEY_TRANSACTIONS = 'lendingchain_txs_v2';
const STORAGE_KEY_PORTFOLIO = 'lendingchain_portfolio_v2';
const STORAGE_KEY_WALLET = 'lendingchain_wallet_v2';

export interface LendingChainStore {
  loans: LoanRequest[];
  transactions: LendTransaction[];
  portfolio: UserPortfolio;
  badges: LenderBadge[];
  wallet: {
    address: string;
    balanceSOL: number;
    balanceUSD: number;
    isDemoWallet: boolean;
    connected: boolean;
  };
}

let storeListeners: Array<() => void> = [];

export function getInitialStore(): LendingChainStore {
  const loans = INITIAL_LOANS;
  const transactions = INITIAL_TRANSACTIONS;
  const wallet = {
    address: '',
    balanceSOL: 0,
    balanceUSD: 0,
    isDemoWallet: false,
    connected: false
  };

  const portfolio: UserPortfolio = {
    address: '',
    totalLentUSD: 0,
    totalLentSOL: 0,
    activeLoansCount: 0,
    repaidLoansCount: 0,
    totalRepaidUSD: 0,
    availableToRelendUSD: 0,
    impactScore: 0,
    badgesUnlocked: []
  };

  const badges = BADGE_DEFINITIONS.map(badge => ({
    ...badge,
    unlocked: false
  }));

  return {
    loans,
    transactions,
    portfolio,
    badges,
    wallet
  };
}

let isClientStoreInitialized = false;

export function initClientStore() {
  if (typeof window === 'undefined' || isClientStoreInitialized) return;
  isClientStoreInitialized = true;

  try {
    // Purge obsolete local storage caches from prior testing
    localStorage.removeItem('lendingchain_loans');
    localStorage.removeItem('lendingchain_loans_v2');
    localStorage.removeItem('lendingchain_txs');
    localStorage.removeItem('lendingchain_portfolio');

    const storedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
    if (storedWallet) {
      const parsedWallet = JSON.parse(storedWallet);
      if (parsedWallet?.address && parsedWallet?.connected) {
        currentStore = {
          ...currentStore,
          wallet: parsedWallet
        };
        recalculatePortfolio(parsedWallet.address);
      }
    }

    // Ensure initial seed runs asynchronously if needed
    seedFirestoreIfEmpty(db).catch(console.error);

    // Setup Firestore Listeners for Loans
    onSnapshot(collection(db, 'loans'), (snapshot) => {
      const firestoreLoans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanRequest));
      if (firestoreLoans.length > 0) {
        currentStore = {
          ...currentStore,
          loans: firestoreLoans
        };
        notifyStoreChange();
      }
    });

    // Setup Firestore Listeners for Transactions
    onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const firestoreTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LendTransaction));
      firestoreTxs.sort((a, b) => b.timestamp - a.timestamp);
      if (firestoreTxs.length > 0) {
        currentStore = {
          ...currentStore,
          transactions: firestoreTxs
        };
        if (currentStore.wallet.address) {
          recalculatePortfolio(currentStore.wallet.address);
        }
        notifyStoreChange();
      }
    });

    notifyStoreChange();
  } catch (e) {
    console.warn('LocalStorage / Firestore initialization warning:', e);
  }
}

function recalculatePortfolio(address: string): LenderBadge[] {
  if (!address) {
    currentStore.portfolio = {
      address: '',
      totalLentUSD: 0,
      totalLentSOL: 0,
      activeLoansCount: 0,
      repaidLoansCount: 0,
      totalRepaidUSD: 0,
      availableToRelendUSD: 0,
      impactScore: 0,
      badgesUnlocked: []
    };
    currentStore.badges = BADGE_DEFINITIONS.map(b => ({ ...b, unlocked: false }));
    return [];
  }

  const userTxs = currentStore.transactions.filter(t => t.lenderAddress === address);
  const totalLentUSD = userTxs.reduce((acc, t) => acc + t.amountUSD, 0);
  const totalLentSOL = Number((totalLentUSD / SOL_USD_RATE).toFixed(3));

  const previouslyUnlockedTiers = new Set(currentStore.badges.filter(b => b.unlocked).map(b => b.tier));

  const badges = BADGE_DEFINITIONS.map(badge => {
    const isUnlocked = totalLentUSD >= badge.thresholdUSD;
    return {
      ...badge,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? new Date().toISOString().split('T')[0] : undefined
    };
  });

  const newlyUnlocked = badges.filter(b => b.unlocked && !previouslyUnlockedTiers.has(b.tier));

  const portfolio: UserPortfolio = {
    address,
    totalLentUSD: Number(totalLentUSD.toFixed(2)),
    totalLentSOL,
    activeLoansCount: Array.from(new Set(userTxs.map(t => t.loanId))).length,
    repaidLoansCount: 0,
    totalRepaidUSD: 0,
    availableToRelendUSD: 0,
    impactScore: Math.round(totalLentUSD * 1.8),
    badgesUnlocked: badges.filter(b => b.unlocked).map(b => b.tier)
  };

  currentStore.portfolio = portfolio;
  currentStore.badges = badges;
  return newlyUnlocked;
}

let currentStore: LendingChainStore = getInitialStore();

export function subscribeStore(listener: () => void) {
  if (typeof window !== 'undefined') {
    initClientStore();
  }
  storeListeners.push(listener);
  return () => {
    storeListeners = storeListeners.filter(l => l !== listener);
  };
}

function notifyStoreChange() {
  storeListeners.forEach(listener => listener());
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(currentStore.loans));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(currentStore.transactions));
    } catch (e) {
      console.error(e);
    }
  }
}

export function getStore(): LendingChainStore {
  return currentStore;
}

export async function lendToLoan({
  loanId,
  amountSOL,
  amountUSD,
  message,
  txHash,
  lenderAddress
}: {
  loanId: string;
  amountSOL: number;
  amountUSD: number;
  message?: string;
  txHash: string;
  lenderAddress: string;
}): Promise<{ newBadges: LenderBadge[] }> {
  const loanIndex = currentStore.loans.findIndex(l => l.id === loanId);
  if (loanIndex === -1) return { newBadges: [] };

  const targetLoan = currentStore.loans[loanIndex];
  
  // Create new transaction object
  const newTx: LendTransaction = {
    id: `tx-${Date.now()}`,
    txHash,
    loanId: targetLoan.id,
    loanTitle: targetLoan.title,
    borrowerName: targetLoan.borrowerName,
    lenderAddress,
    amountSOL: Number(amountSOL.toFixed(3)),
    amountUSD: Number(amountUSD.toFixed(2)),
    message: message || 'Generous loan contribution on Solana Devnet',
    timestamp: Date.now(),
    cluster: 'devnet',
    simulated: txHash.includes('...') || !txHash.startsWith('5')
  };

  // 1. Optimistic Local Store Update for instantaneous UI feedback
  const newRaisedUSD = Number((targetLoan.raisedUSD + amountUSD).toFixed(2));
  const newRaisedSOL = Number((targetLoan.raisedSOL + amountSOL).toFixed(3));
  const newStatus = newRaisedUSD >= targetLoan.goalUSD ? 'active' : targetLoan.status;

  const updatedLoan: LoanRequest = {
    ...targetLoan,
    raisedUSD: newRaisedUSD,
    raisedSOL: newRaisedSOL,
    lendersCount: (targetLoan.lendersCount || 0) + 1,
    status: newStatus
  };

  const updatedLoans = [...currentStore.loans];
  updatedLoans[loanIndex] = updatedLoan;

  const updatedWallet = {
    ...currentStore.wallet,
    balanceSOL: Math.max(0, Number((currentStore.wallet.balanceSOL - amountSOL).toFixed(3))),
    balanceUSD: Math.max(0, Number(((currentStore.wallet.balanceSOL - amountSOL) * SOL_USD_RATE).toFixed(2)))
  };

  const updatedTransactions = [newTx, ...currentStore.transactions.filter(t => t.id !== newTx.id)];

  currentStore = {
    ...currentStore,
    loans: updatedLoans,
    transactions: updatedTransactions,
    wallet: updatedWallet
  };

  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(updatedWallet)); } catch {}
  }

  const newBadges = recalculatePortfolio(currentStore.wallet.address);
  notifyStoreChange();

  // 2. Persist to Firebase Firestore
  try {
    const loanRef = doc(db, 'loans', targetLoan.id);
    const txRef = doc(db, 'transactions', newTx.id);

    await runTransaction(db, async (transaction) => {
      const loanDoc = await transaction.get(loanRef);
      if (!loanDoc.exists()) {
        transaction.set(loanRef, updatedLoan);
      } else {
        const loanData = loanDoc.data() as LoanRequest;
        const firestoreRaisedUSD = Number(((loanData.raisedUSD || 0) + amountUSD).toFixed(2));
        const firestoreRaisedSOL = Number(((loanData.raisedSOL || 0) + amountSOL).toFixed(3));
        const firestoreStatus = firestoreRaisedUSD >= loanData.goalUSD ? 'active' : loanData.status;

        transaction.update(loanRef, {
          raisedUSD: firestoreRaisedUSD,
          raisedSOL: firestoreRaisedSOL,
          lendersCount: (loanData.lendersCount || 0) + 1,
          status: firestoreStatus
        });
      }

      transaction.set(txRef, newTx);
    });
    console.log(`[Firebase] Loan ${targetLoan.id} funding updated and transaction ${newTx.id} recorded.`);
  } catch (error) {
    console.warn("[Firebase] runTransaction error, attempting setDoc fallback:", error);
    try {
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
      await setDoc(doc(db, 'loans', targetLoan.id), updatedLoan, { merge: true });
      console.log(`[Firebase] Fallback write succeeded for loan ${targetLoan.id}.`);
    } catch (fallbackErr) {
      console.error("[Firebase] Firestore write failed:", fallbackErr);
    }
  }

  return { newBadges };
}

export function airdropToWallet(amount = 1.0) {
  const newWallet = {
    ...currentStore.wallet,
    balanceSOL: Number((currentStore.wallet.balanceSOL + amount).toFixed(3)),
    balanceUSD: Number(((currentStore.wallet.balanceSOL + amount) * SOL_USD_RATE).toFixed(2))
  };
  currentStore = {
    ...currentStore,
    wallet: newWallet
  };
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(newWallet)); } catch {}
  }
  notifyStoreChange();
}

export function updateConnectedWallet({
  address,
  providerType = 'privy',
  balanceSOL
}: {
  address: string;
  providerType?: 'privy' | 'devnet_keypair';
  balanceSOL?: number;
}) {
  const newBalance = balanceSOL ?? currentStore.wallet.balanceSOL;
  const newWallet = {
    ...currentStore.wallet,
    address,
    connected: true,
    isDemoWallet: providerType === 'devnet_keypair',
    balanceSOL: newBalance,
    balanceUSD: Number((newBalance * SOL_USD_RATE).toFixed(2))
  };
  currentStore = {
    ...currentStore,
    wallet: newWallet
  };
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(newWallet)); } catch {}
  }
  recalculatePortfolio(address);
  notifyStoreChange();
}

export function disconnectWallet() {
  currentStore = {
    ...currentStore,
    wallet: {
      address: '',
      balanceSOL: 0,
      balanceUSD: 0,
      isDemoWallet: false,
      connected: false
    }
  };
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(STORAGE_KEY_WALLET); } catch {}
  }
  recalculatePortfolio('');
  notifyStoreChange();
}

export function connectDemoWallet() {
  const demoKp = getOrCreateDemoKeypair();
  const address = demoKp.publicKey.toBase58();
  const newWallet = {
    address,
    balanceSOL: 4.5,
    balanceUSD: Number((4.5 * SOL_USD_RATE).toFixed(2)),
    isDemoWallet: true,
    connected: true
  };
  currentStore = {
    ...currentStore,
    wallet: newWallet
  };
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(newWallet)); } catch {}
  }
  recalculatePortfolio(address);
  notifyStoreChange();
}

export function relendRepaidFunds(loanId: string, amountUSD: number) {
  if (currentStore.portfolio.availableToRelendUSD < amountUSD) return false;
  
  const amountSOL = Number((amountUSD / SOL_USD_RATE).toFixed(3));
  const newTxHash = `reinvest_${Math.random().toString(36).substring(2, 9)}...sol`;
  
  lendToLoan({
    loanId,
    amountSOL,
    amountUSD,
    message: 'Re-lending funds recovered from completed loan! Cycle of generosity continuing.',
    txHash: newTxHash,
    lenderAddress: currentStore.wallet.address
  });

  currentStore.portfolio.availableToRelendUSD = Number((currentStore.portfolio.availableToRelendUSD - amountUSD).toFixed(2));
  notifyStoreChange();
  return true;
}

export function getUserLentToLoan(loanId: string, lenderAddress?: string): { hasLended: boolean; totalLentUSD: number; totalLentSOL: number } {
  const addr = lenderAddress || currentStore.wallet.address;
  if (!addr) return { hasLended: false, totalLentUSD: 0, totalLentSOL: 0 };

  const matches = currentStore.transactions.filter(
    t => t.loanId === loanId && t.lenderAddress && t.lenderAddress.toLowerCase() === addr.toLowerCase()
  );

  const totalUSD = Number(matches.reduce((sum, t) => sum + t.amountUSD, 0).toFixed(2));
  const totalSOL = Number(matches.reduce((sum, t) => sum + t.amountSOL, 0).toFixed(3));

  return {
    hasLended: matches.length > 0,
    totalLentUSD: totalUSD,
    totalLentSOL: totalSOL
  };
}



