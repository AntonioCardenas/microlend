import {
  PublicKey,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// Default Program ID for LendingChain on Solana Devnet
export const DEFAULT_LENDING_PROGRAM_ID = 'LendGf8qYjU6iXU4Fh6L21Q8c7zF8d5xYQ9B2g8r111';

export function getLendingProgramId(): PublicKey {
  const envId = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_LENDING_PROGRAM_ID) || DEFAULT_LENDING_PROGRAM_ID;
  try {
    return new PublicKey(envId);
  } catch {
    return new PublicKey(DEFAULT_LENDING_PROGRAM_ID);
  }
}

// ---------------- PDA Derivations ----------------

/**
 * Derives the LoanAccount PDA: seeds = [b"loan", loan_id.as_bytes()]
 */
export function getLoanPda(loanId: string, programId = getLendingProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('loan'), Buffer.from(loanId)],
    programId
  );
}

/**
 * Derives the program Vault PDA: seeds = [b"vault", loan_account.as_ref()]
 */
export function getVaultPda(loanAccountPubkey: PublicKey, programId = getLendingProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), loanAccountPubkey.toBuffer()],
    programId
  );
}

/**
 * Derives the individual lender ContributionAccount PDA: seeds = [b"contribution", loan_account, lender]
 */
export function getContributionPda(
  loanAccountPubkey: PublicKey,
  lenderPubkey: PublicKey,
  programId = getLendingProgramId()
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contribution'), loanAccountPubkey.toBuffer(), lenderPubkey.toBuffer()],
    programId
  );
}

/**
 * Helper to derive all smart contract escrow addresses for a loan
 */
export function deriveLoanEscrowInfo(loanId: string) {
  const programId = getLendingProgramId();
  const [loanPda] = getLoanPda(loanId, programId);
  const [vaultPda] = getVaultPda(loanPda, programId);
  return {
    programId: programId.toBase58(),
    loanPda: loanPda.toBase58(),
    vaultPda: vaultPda.toBase58()
  };
}

// ---------------- Anchor Instruction Builders ----------------

// Anchor 8-byte instruction discriminators sha256("global:<name>")[0..8]
const DISCRIMINATORS = {
  create_loan: Uint8Array.from([166, 131, 118, 219, 138, 218, 206, 140]),
  fund_loan: Uint8Array.from([50, 221, 51, 13, 3, 142, 116, 215]),
  disburse: Uint8Array.from([68, 250, 205, 89, 217, 142, 13, 44]),
  repay_loan: Uint8Array.from([224, 93, 144, 77, 61, 17, 137, 54]),
  claim_repayment: Uint8Array.from([200, 193, 45, 8, 62, 168, 80, 5]),
  refund: Uint8Array.from([2, 96, 183, 251, 63, 208, 46, 46])
};

function encodeU64(val: number | bigint): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, BigInt(Math.floor(Number(val))), true); // little-endian
  return buf;
}

/**
 * Builds an Anchor `fund_loan` instruction
 */
export function buildFundLoanInstruction({
  lender,
  loanId,
  amountLamports,
  programId = getLendingProgramId()
}: {
  lender: PublicKey;
  loanId: string;
  amountLamports: number;
  programId?: PublicKey;
}): TransactionInstruction {
  const [loanPda] = getLoanPda(loanId, programId);
  const [vaultPda] = getVaultPda(loanPda, programId);
  const [contributionPda] = getContributionPda(loanPda, lender, programId);

  // Instruction data: 8 bytes discriminator + 8 bytes u64 amount
  const data = new Uint8Array(16);
  data.set(DISCRIMINATORS.fund_loan, 0);
  data.set(encodeU64(amountLamports), 8);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: loanPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: contributionPda, isSigner: false, isWritable: true },
      { pubkey: lender, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data: Buffer.from(data)
  });
}

/**
 * Builds an Anchor `disburse` instruction to release funds to the borrower
 */
export function buildDisburseLoanInstruction({
  borrower,
  loanId,
  programId = getLendingProgramId()
}: {
  borrower: PublicKey;
  loanId: string;
  programId?: PublicKey;
}): TransactionInstruction {
  const [loanPda] = getLoanPda(loanId, programId);
  const [vaultPda] = getVaultPda(loanPda, programId);

  const data = Buffer.from(DISCRIMINATORS.disburse);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: loanPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: borrower, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data
  });
}

/**
 * Builds an Anchor `repay_loan` instruction for the borrower
 */
export function buildRepayLoanInstruction({
  borrower,
  loanId,
  amountLamports,
  programId = getLendingProgramId()
}: {
  borrower: PublicKey;
  loanId: string;
  amountLamports: number;
  programId?: PublicKey;
}): TransactionInstruction {
  const [loanPda] = getLoanPda(loanId, programId);
  const [vaultPda] = getVaultPda(loanPda, programId);

  const data = new Uint8Array(16);
  data.set(DISCRIMINATORS.repay_loan, 0);
  data.set(encodeU64(amountLamports), 8);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: loanPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: borrower, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data: Buffer.from(data)
  });
}
