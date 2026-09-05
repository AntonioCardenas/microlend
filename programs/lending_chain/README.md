# LendingChain Solana Anchor Program

This Anchor program enforces non-custodial smart contract escrows, milestone-based loan disbursements, repayments, and lender refunds on Solana.

---

## Architecture Overview

```
                        +----------------------------+
                        |  LendingChain Program ID   |
                        +----------------------------+
                                      |
          +---------------------------+---------------------------+
          |                                                       |
          v                                                       v
+--------------------+                                  +--------------------+
|  LoanAccount PDA   |                                  |     Vault PDA      |
| seeds: ["loan", id]|                                  |seeds: ["vault",loan|
|  - borrower        |                                  |  - holds SOL/USDC  |
|  - target_amount   |                                  |  - releases upon   |
|  - amount_raised   |                                  |    target / repay  |
|  - amount_repaid   |                                  +--------------------+
|  - status          |                                            ^
+--------------------+                                            |
          ^                                                       |
          |                      deposits funds                   |
          +-------------------------------------------------------+
                                 |
                     +-----------------------+
                     | ContributionAccount   |
                     | seeds: ["contribution"|
                     |  loan, lender]        |
                     +-----------------------+
```

---

## Instructions

1. `create_loan(loan_id, target_amount, duration_seconds)`:
   Initializes the `LoanAccount` PDA and creates the `Vault` PDA.
2. `fund_loan(amount)`:
   Lender deposits SOL into the Vault PDA. Creates or updates a `ContributionAccount` PDA recording their principal share.
3. `disburse()`:
   Verifies that `amount_raised >= target_amount`. Automatically transfers the escrowed funds from the Vault PDA to the borrower.
4. `repay_loan(amount)`:
   Borrower transfers repayment SOL back into the Vault PDA.
5. `claim_repayment()`:
   Lenders withdraw their pro-rata share of the repaid funds from the Vault PDA.
6. `refund()`:
   If the loan funding deadline passed without reaching the target, lenders can reclaim 100% of their contributions from the Vault PDA.

---

## Deployment Options

### Option 1: One-Click Browser Deployment via Solana Playground (Recommended - No Rust/Solana CLI needed!)
1. Open [beta.solpg.io](https://beta.solpg.io).
2. Click **Create a new project** -> Select **Anchor (Rust)**.
3. Copy the code from `programs/lending_chain/src/lib.rs` into `src/lib.rs` in the Playground.
4. Click **Build** on the left toolbar.
5. Connect your Playground Devnet wallet (airdrop test SOL if needed).
6. Click **Deploy**.
7. Copy the deployed **Program ID** and set it in `.env`:
   ```env
   PUBLIC_LENDING_PROGRAM_ID=<YourDeployedProgramID>
   ```

### Option 2: Local Anchor CLI
```bash
# 1. Install Solana & Anchor toolchain (if not already installed)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# 2. Build & Deploy to Devnet
anchor build
anchor deploy --provider.cluster devnet
```
