use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("LendGf8qYjU6iXU4Fh6L21Q8c7zF8d5xYQ9B2g8r111");

#[program]
pub mod lending_chain {
    use super::*;

    /// 1. Initialize a new micro-loan campaign with a target goal and duration
    pub fn create_loan(
        ctx: Context<CreateLoan>,
        loan_id: String,
        target_amount: u64,
        duration_seconds: i64,
    ) -> Result<()> {
        require!(loan_id.len() <= 32, LendingError::LoanIdTooLong);
        require!(target_amount > 0, LendingError::InvalidTargetAmount);

        let clock = Clock::get()?;
        let loan = &mut ctx.accounts.loan_account;
        
        loan.borrower = ctx.accounts.borrower.key();
        loan.target_amount = target_amount;
        loan.amount_raised = 0;
        loan.amount_repaid = 0;
        loan.deadline = clock.unix_timestamp.checked_add(duration_seconds).ok_or(LendingError::MathOverflow)?;
        loan.created_at = clock.unix_timestamp;
        loan.status = LoanStatus::Funding;
        loan.bump = ctx.bumps.loan_account;
        loan.vault_bump = ctx.bumps.vault;
        loan.loan_id = loan_id;

        emit!(LoanCreatedEvent {
            loan_id: loan.loan_id.clone(),
            borrower: loan.borrower,
            target_amount,
            deadline: loan.deadline,
        });

        Ok(())
    }

    /// 2. Lender funds a micro-loan. Funds are deposited into the Program's Vault PDA.
    pub fn fund_loan(ctx: Context<FundLoan>, amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let loan = &mut ctx.accounts.loan_account;

        require!(loan.status == LoanStatus::Funding, LendingError::LoanNotAcceptingFunds);
        require!(clock.unix_timestamp < loan.deadline, LendingError::CampaignEnded);
        require!(amount > 0, LendingError::InvalidAmount);

        // Cap contribution to not excessively exceed the target
        let remaining_needed = loan.target_amount.saturating_sub(loan.amount_raised);
        require!(remaining_needed > 0, LendingError::LoanAlreadyFullyFunded);
        let actual_fund_amount = amount.min(remaining_needed);

        // Transfer SOL from lender to the Vault PDA
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.lender.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            actual_fund_amount,
        )?;

        // Update loan state
        loan.amount_raised = loan.amount_raised.checked_add(actual_fund_amount).ok_or(LendingError::MathOverflow)?;
        if loan.amount_raised >= loan.target_amount {
            loan.status = LoanStatus::Funded;
        }

        // Record individual lender contribution
        let contribution = &mut ctx.accounts.contribution;
        if contribution.amount == 0 {
            contribution.lender = ctx.accounts.lender.key();
            contribution.loan = loan.key();
            contribution.bump = ctx.bumps.contribution;
            contribution.claimed_repayment = 0;
        }
        contribution.amount = contribution.amount.checked_add(actual_fund_amount).ok_or(LendingError::MathOverflow)?;

        emit!(LoanFundedEvent {
            loan_id: loan.loan_id.clone(),
            lender: ctx.accounts.lender.key(),
            amount: actual_fund_amount,
            total_raised: loan.amount_raised,
        });

        Ok(())
    }

    /// 3. Disburse escrowed funds to the borrower once target is met
    pub fn disburse(ctx: Context<Disburse>) -> Result<()> {
        let loan = &mut ctx.accounts.loan_account;

        require!(
            loan.status == LoanStatus::Funded || (loan.amount_raised >= loan.target_amount && loan.status == LoanStatus::Funding),
            LendingError::TargetNotReached
        );
        require!(loan.status != LoanStatus::Active, LendingError::AlreadyDisbursed);

        let amount_to_transfer = loan.amount_raised;
        let loan_key = loan.key();

        // Sign CPI using Vault PDA seeds
        let seeds = &[
            b"vault".as_ref(),
            loan_key.as_ref(),
            &[loan.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .vault
            .to_account_info()
            .lamports()
            .checked_sub(amount_to_transfer)
            .ok_or(LendingError::InsufficientVaultBalance)?;

        **ctx.accounts.borrower.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .borrower
            .to_account_info()
            .lamports()
            .checked_add(amount_to_transfer)
            .ok_or(LendingError::MathOverflow)?;

        loan.status = LoanStatus::Active;

        emit!(LoanDisbursedEvent {
            loan_id: loan.loan_id.clone(),
            borrower: loan.borrower,
            amount: amount_to_transfer,
        });

        Ok(())
    }

    /// 4. Borrower makes a repayment back into the Vault PDA
    pub fn repay_loan(ctx: Context<RepayLoan>, amount: u64) -> Result<()> {
        let loan = &mut ctx.accounts.loan_account;
        require!(loan.status == LoanStatus::Active, LendingError::LoanNotActive);
        require!(amount > 0, LendingError::InvalidAmount);

        // Transfer SOL from borrower to Vault PDA
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.borrower.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        loan.amount_repaid = loan.amount_repaid.checked_add(amount).ok_or(LendingError::MathOverflow)?;
        if loan.amount_repaid >= loan.target_amount {
            loan.status = LoanStatus::Repaid;
        }

        emit!(LoanRepaidEvent {
            loan_id: loan.loan_id.clone(),
            borrower: ctx.accounts.borrower.key(),
            amount,
            total_repaid: loan.amount_repaid,
        });

        Ok(())
    }

    /// 5. Lenders claim their share of repayments back from the Vault PDA
    pub fn claim_repayment(ctx: Context<ClaimRepayment>) -> Result<()> {
        let loan = &ctx.accounts.loan_account;
        let contribution = &mut ctx.accounts.contribution;

        require!(loan.amount_repaid > 0, LendingError::NoRepaymentsAvailable);

        // Calculate lender's total eligible repayment based on their % share of the loan
        // eligible = (amount_repaid * contribution.amount) / target_amount
        let total_eligible = (loan.amount_repaid as u128)
            .checked_mul(contribution.amount as u128)
            .ok_or(LendingError::MathOverflow)?
            .checked_div(loan.target_amount as u128)
            .ok_or(LendingError::MathOverflow)? as u64;

        let claimable = total_eligible.saturating_sub(contribution.claimed_repayment);
        require!(claimable > 0, LendingError::NothingToClaim);

        let loan_key = loan.key();
        let seeds = &[
            b"vault".as_ref(),
            loan_key.as_ref(),
            &[loan.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .vault
            .to_account_info()
            .lamports()
            .checked_sub(claimable)
            .ok_or(LendingError::InsufficientVaultBalance)?;

        **ctx.accounts.lender.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .lender
            .to_account_info()
            .lamports()
            .checked_add(claimable)
            .ok_or(LendingError::MathOverflow)?;

        contribution.claimed_repayment = contribution
            .claimed_repayment
            .checked_add(claimable)
            .ok_or(LendingError::MathOverflow)?;

        emit!(RepaymentClaimedEvent {
            loan_id: loan.loan_id.clone(),
            lender: ctx.accounts.lender.key(),
            amount: claimable,
        });

        Ok(())
    }

    /// 6. Refund lenders if the loan campaign expired without reaching its target
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let clock = Clock::get()?;
        let loan = &ctx.accounts.loan_account;
        let contribution = &mut ctx.accounts.contribution;

        require!(loan.status == LoanStatus::Funding, LendingError::InvalidLoanStatus);
        require!(clock.unix_timestamp >= loan.deadline, LendingError::CampaignStillActive);
        require!(loan.amount_raised < loan.target_amount, LendingError::TargetWasMet);
        require!(contribution.amount > 0, LendingError::NothingToRefund);

        let refund_amount = contribution.amount;
        contribution.amount = 0;

        let loan_key = loan.key();
        let seeds = &[
            b"vault".as_ref(),
            loan_key.as_ref(),
            &[loan.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .vault
            .to_account_info()
            .lamports()
            .checked_sub(refund_amount)
            .ok_or(LendingError::InsufficientVaultBalance)?;

        **ctx.accounts.lender.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .lender
            .to_account_info()
            .lamports()
            .checked_add(refund_amount)
            .ok_or(LendingError::MathOverflow)?;

        emit!(RefundIssuedEvent {
            loan_id: loan.loan_id.clone(),
            lender: ctx.accounts.lender.key(),
            amount: refund_amount,
        });

        Ok(())
    }
}

// ---------------- Accounts Contexts ----------------

#[derive(Accounts)]
#[instruction(loan_id: String)]
pub struct CreateLoan<'info> {
    #[account(
        init,
        payer = borrower,
        space = LoanAccount::LEN,
        seeds = [b"loan", loan_id.as_bytes()],
        bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    /// CHECK: Vault PDA derived from the loan account
    #[account(
        mut,
        seeds = [b"vault", loan_account.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundLoan<'info> {
    #[account(
        mut,
        seeds = [b"loan", loan_account.loan_id.as_bytes()],
        bump = loan_account.bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", loan_account.key().as_ref()],
        bump = loan_account.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = lender,
        space = ContributionAccount::LEN,
        seeds = [b"contribution", loan_account.key().as_ref(), lender.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, ContributionAccount>,

    #[account(mut)]
    pub lender: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Disburse<'info> {
    #[account(
        mut,
        has_one = borrower,
        seeds = [b"loan", loan_account.loan_id.as_bytes()],
        bump = loan_account.bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", loan_account.key().as_ref()],
        bump = loan_account.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(
        mut,
        has_one = borrower,
        seeds = [b"loan", loan_account.loan_id.as_bytes()],
        bump = loan_account.bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", loan_account.key().as_ref()],
        bump = loan_account.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRepayment<'info> {
    #[account(
        seeds = [b"loan", loan_account.loan_id.as_bytes()],
        bump = loan_account.bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", loan_account.key().as_ref()],
        bump = loan_account.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        has_one = lender,
        seeds = [b"contribution", loan_account.key().as_ref(), lender.key().as_ref()],
        bump = contribution.bump
    )]
    pub contribution: Account<'info, ContributionAccount>,

    #[account(mut)]
    pub lender: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        seeds = [b"loan", loan_account.loan_id.as_bytes()],
        bump = loan_account.bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", loan_account.key().as_ref()],
        bump = loan_account.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        has_one = lender,
        seeds = [b"contribution", loan_account.key().as_ref(), lender.key().as_ref()],
        bump = contribution.bump
    )]
    pub contribution: Account<'info, ContributionAccount>,

    #[account(mut)]
    pub lender: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ---------------- State Accounts ----------------

#[account]
pub struct LoanAccount {
    pub borrower: Pubkey,         // 32
    pub target_amount: u64,       // 8
    pub amount_raised: u64,       // 8
    pub amount_repaid: u64,       // 8
    pub deadline: i64,            // 8
    pub created_at: i64,          // 8
    pub status: LoanStatus,       // 1
    pub bump: u8,                 // 1
    pub vault_bump: u8,           // 1
    pub loan_id: String,          // 4 + 32
}

impl LoanAccount {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + (4 + 32);
}

#[account]
pub struct ContributionAccount {
    pub lender: Pubkey,            // 32
    pub loan: Pubkey,              // 32
    pub amount: u64,               // 8
    pub claimed_repayment: u64,    // 8
    pub bump: u8,                  // 1
}

impl ContributionAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum LoanStatus {
    Funding,
    Funded,
    Active,
    Repaid,
    Defaulted,
}

// ---------------- Events & Errors ----------------

#[event]
pub struct LoanCreatedEvent {
    pub loan_id: String,
    pub borrower: Pubkey,
    pub target_amount: u64,
    pub deadline: i64,
}

#[event]
pub struct LoanFundedEvent {
    pub loan_id: String,
    pub lender: Pubkey,
    pub amount: u64,
    pub total_raised: u64,
}

#[event]
pub struct LoanDisbursedEvent {
    pub loan_id: String,
    pub borrower: Pubkey,
    pub amount: u64,
}

#[event]
pub struct LoanRepaidEvent {
    pub loan_id: String,
    pub borrower: Pubkey,
    pub amount: u64,
    pub total_repaid: u64,
}

#[event]
pub struct RepaymentClaimedEvent {
    pub loan_id: String,
    pub lender: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RefundIssuedEvent {
    pub loan_id: String,
    pub lender: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum LendingError {
    #[msg("Loan ID must be 32 characters or less.")]
    LoanIdTooLong,
    #[msg("Target amount must be greater than zero.")]
    InvalidTargetAmount,
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Math calculation overflow.")]
    MathOverflow,
    #[msg("This loan is no longer accepting funds.")]
    LoanNotAcceptingFunds,
    #[msg("The funding campaign for this loan has expired.")]
    CampaignEnded,
    #[msg("This loan is already fully funded.")]
    LoanAlreadyFullyFunded,
    #[msg("Funding target has not yet been reached.")]
    TargetNotReached,
    #[msg("Funds have already been disbursed to the borrower.")]
    AlreadyDisbursed,
    #[msg("Vault does not have sufficient balance.")]
    InsufficientVaultBalance,
    #[msg("Loan is not currently active.")]
    LoanNotActive,
    #[msg("No repayments are available to claim at this time.")]
    NoRepaymentsAvailable,
    #[msg("No unclaimed repayment balance found for your contribution.")]
    NothingToClaim,
    #[msg("Campaign is still active; refunds are only available after deadline.")]
    CampaignStillActive,
    #[msg("Funding target was reached; refunds cannot be claimed.")]
    TargetWasMet,
    #[msg("No contribution found to refund.")]
    NothingRefundable,
    #[msg("Invalid loan status for this operation.")]
    InvalidLoanStatus,
    #[msg("Nothing to refund.")]
    NothingToRefund,
}
