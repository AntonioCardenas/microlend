import type { LoanRequest, LendTransaction, LenderBadge, UserPortfolio } from './types';
import { INITIAL_LOANS, BADGE_DEFINITIONS, INITIAL_TRANSACTIONS, SOL_USD_RATE } from './loansData';
import { getOrCreateDemoKeypair, fetchSolBalance, formatAddress } from './solana';
import { db } from './firebase';
import { collection, onSnapshot, doc, runTransaction, setDoc } from 'firebase/firestore';
import { seedFirestoreIfEmpty } from './loansData';

const STORAGE_KEY_LOANS = 'lendingchain_loans_v3';
const STORAGE_KEY_TRANSACTIONS = 'lendingchain_txs_v2';
const STORAGE_KEY_PORTFOLIO = 'lendingchain_portfolio_v2';

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
  let loans = INITIAL_LOANS;
  let transactions = INITIAL_TRANSACTIONS;
  let address = 'DemoDevnetWallet...';
  let balanceSOL = 4.5;

  if (typeof window !== 'undefined') {
    try {
      // Purge obsolete local storage caches from prior testing
      localStorage.removeItem('lendingchain_loans');
      localStorage.removeItem('lendingchain_loans_v2');
      localStorage.removeItem('lendingchain_txs');
      localStorage.removeItem('lendingchain_portfolio');

      const storedLoans = localStorage.getItem(STORAGE_KEY_LOANS);
      if (storedLoans) {
        const parsed: LoanRequest[] = JSON.parse(storedLoans);
        loans = parsed.map(pl => {
          const fresh = INITIAL_LOANS.find(i => i.id === pl.id);
          return fresh ? { ...pl, borrowerAvatar: fresh.borrowerAvatar } : pl;
        });
      }

      const storedTxs = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (storedTxs) transactions = JSON.parse(storedTxs);


      const demoKp = getOrCreateDemoKeypair();
      address = demoKp.publicKey.toBase58();

      // Ensure initial seed runs asynchronously if needed
      seedFirestoreIfEmpty(db).catch(console.error);

      // Setup Firestore Listeners for Loans
      onSnapshot(collection(db, 'loans'), (snapshot) => {
        const firestoreLoans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanRequest));
        currentStore = {
          ...currentStore,
          loans: firestoreLoans.length > 0 ? firestoreLoans : currentStore.loans
        };
        notifyStoreChange();
      });

      // Setup Firestore Listeners for Transactions
      onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const firestoreTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LendTransaction));
        // Sort transactions by timestamp descending
        firestoreTxs.sort((a, b) => b.timestamp - a.timestamp);
        
        currentStore = {
          ...currentStore,
          transactions: firestoreTxs.length > 0 ? firestoreTxs : currentStore.transactions
        };
        recalculatePortfolio(currentStore.wallet.address);
        notifyStoreChange();
      });
    } catch (e) {
      console.warn('LocalStorage / Firestore access warning:', e);
    }
  }


  // Calculate portfolio and badges based on transactions for this user
  const userTxs = transactions.filter(t => t.lenderAddress === address || t.lenderAddress.startsWith('4Z3') || t.lenderAddress.includes('Demo'));
  const totalLentUSD = userTxs.reduce((acc, t) => acc + t.amountUSD, 125.75);
  const totalLentSOL = Number((totalLentUSD / SOL_USD_RATE).toFixed(3));

  const badges = BADGE_DEFINITIONS.map(badge => {
    const isUnlocked = totalLentUSD >= badge.thresholdUSD;
    return {
      ...badge,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? '2026-09-05' : undefined
    };
  });

  const portfolio: UserPortfolio = {
    address,
    totalLentUSD: Number(totalLentUSD.toFixed(2)),
    totalLentSOL,
    activeLoansCount: 3,
    repaidLoansCount: 1,
    totalRepaidUSD: 33.3,
    availableToRelendUSD: 33.3,
    impactScore: Math.round(totalLentUSD * 1.8),
    badgesUnlocked: badges.filter(b => b.unlocked).map(b => b.tier)
  };

  return {
    loans,
    transactions,
    portfolio,
    badges,
    wallet: {
      address,
      balanceSOL,
      balanceUSD: Number((balanceSOL * SOL_USD_RATE).toFixed(2)),
      isDemoWallet: true,
      connected: true
    }
  };
}

function recalculatePortfolio(address: string) {
  const userTxs = currentStore.transactions.filter(t => t.lenderAddress === address || t.lenderAddress.startsWith('4Z3') || t.lenderAddress.includes('Demo'));
  const totalLentUSD = userTxs.reduce((acc, t) => acc + t.amountUSD, 125.75);
  const totalLentSOL = Number((totalLentUSD / SOL_USD_RATE).toFixed(3));

  const badges = BADGE_DEFINITIONS.map(badge => {
    const isUnlocked = totalLentUSD >= badge.thresholdUSD;
    return {
      ...badge,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? new Date().toISOString().split('T')[0] : undefined
    };
  });

  const portfolio: UserPortfolio = {
    address,
    totalLentUSD: Number(totalLentUSD.toFixed(2)),
    totalLentSOL,
    activeLoansCount: 3,
    repaidLoansCount: 1,
    totalRepaidUSD: 33.3,
    availableToRelendUSD: 33.3,
    impactScore: Math.round(totalLentUSD * 1.8),
    badgesUnlocked: badges.filter(b => b.unlocked).map(b => b.tier)
  };

  currentStore.portfolio = portfolio;
  currentStore.badges = badges;
}

let currentStore: LendingChainStore = getInitialStore();

export function subscribeStore(listener: () => void) {
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

  // Run as a Firestore transaction to safely update loan totals
  try {
    const loanRef = doc(db, 'loans', targetLoan.id);
    const txRef = doc(db, 'transactions', newTx.id);

    await runTransaction(db, async (transaction) => {
      const loanDoc = await transaction.get(loanRef);
      if (!loanDoc.exists()) throw "Loan does not exist!";

      const loanData = loanDoc.data() as LoanRequest;
      const newRaisedUSD = Number((loanData.raisedUSD + amountUSD).toFixed(2));
      const newRaisedSOL = Number((loanData.raisedSOL + amountSOL).toFixed(3));
      const newStatus = newRaisedUSD >= loanData.goalUSD ? 'active' : loanData.status;
      
      transaction.update(loanRef, {
        raisedUSD: newRaisedUSD,
        raisedSOL: newRaisedSOL,
        lendersCount: loanData.lendersCount + 1,
        status: newStatus
      });
      
      transaction.set(txRef, newTx);
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
  }

  // Deduct wallet balance (local store only)
  const updatedWallet = {
    ...currentStore.wallet,
    balanceSOL: Math.max(0, Number((currentStore.wallet.balanceSOL - amountSOL).toFixed(3))),
    balanceUSD: Math.max(0, Number(((currentStore.wallet.balanceSOL - amountSOL) * SOL_USD_RATE).toFixed(2)))
  };

  currentStore = {
    ...currentStore,
    wallet: updatedWallet
  };

  recalculatePortfolio(currentStore.wallet.address);
  notifyStoreChange();
  
  // Note: newlyUnlockedBadges computation can be refined, just returning empty array for now since they are tracked in portfolio
  return { newBadges: [] };
}

export function airdropToWallet(amount = 1.0) {
  currentStore = {
    ...currentStore,
    wallet: {
      ...currentStore.wallet,
      balanceSOL: Number((currentStore.wallet.balanceSOL + amount).toFixed(3)),
      balanceUSD: Number(((currentStore.wallet.balanceSOL + amount) * SOL_USD_RATE).toFixed(2))
    }
  };
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
  currentStore = {
    ...currentStore,
    wallet: {
      ...currentStore.wallet,
      address,
      connected: true,
      isDemoWallet: providerType === 'devnet_keypair',
      balanceSOL: newBalance,
      balanceUSD: Number((newBalance * SOL_USD_RATE).toFixed(2))
    }
  };
  notifyStoreChange();
}

export function resetToDemoWallet() {
  const demoKp = getOrCreateDemoKeypair();
  const address = demoKp.publicKey.toBase58();
  currentStore = {
    ...currentStore,
    wallet: {
      address,
      balanceSOL: 4.5,
      balanceUSD: Number((4.5 * SOL_USD_RATE).toFixed(2)),
      isDemoWallet: true,
      connected: true
    }
  };
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


