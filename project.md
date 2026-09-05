*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

## What I Built
**LendingChain** is a decentralized, zero-interest micro-lending platform built on Solana Devnet to celebrate the UN International Day of Charity. It connects socially conscious global lenders with grassroots entrepreneurs in emerging economies—specifically focusing on clean energy, sustainable agriculture, indigenous women-led crafts, and tech education. 

Unlike traditional charitable donations, where funds often disappear into administrative overhead, or commercial microfinance institutions that charge predatory 25%–45% APRs, LendingChain provides 0% interest capital directly to verified non-custodial Solana escrows. Our goal is to leverage sub-cent transaction fees to make $5–$25 micro-loans viable and transparent, allowing loan repayments to cycle back to the lender to be re-lent indefinitely (the "Generosity Multiplier").

## Demo
**Live Application:** [https://micro-lend.web.app](https://micro-lend.web.app)

*(Feel free to explore the interactive "Discovery" mode, fund a loan, or apply for a loan using the seamlessly embedded Solana wallet!)*

## Code
{% github AntonioCardenas/microlend %}

## How I Built It
LendingChain is built with a modern, high-performance tech stack focused on a seamless user experience, verifiable proof of impact, and cryptographic transparency:

- **Frontend & Performance Architecture:** Built with Astro and React. I placed strong emphasis on Core Web Vitals (FCP, LCP, CLS) using non-blocking app hydration loaders, adaptive skeleton cards to prevent layout shifts, lazy asset scheduling, and subtle micro-interactions (magnetic buttons, smooth drawers) to inspire institutional-grade trust.

- **Google Gemini AI Borrower & Wallet Forensics:** Rather than trusting self-reported applications blindly, LendingChain implements an AI-driven risk auditor powered by **Google Gemini**. The engine performs dual-layer evaluation:
  1. **Semantic Project Analysis:** Gemini analyzes the applicant's business plan, capital requested, and cost breakdowns to assess feasibility and credibility.
  2. **On-Chain Solana Forensics:** Scans the borrower's public key on Solana Devnet to check wallet age, transaction history volume, and detect anomalous patterns (such as brand-new wallets with 0 history, high transaction failure rates, or suspicious fund drains). It assigns an objective risk score (0–100) and displays an interactive audit modal with actionable recommendations for lenders.

- **Borrower Field Dispatches & Proof of Work:** To verify that funded projects are real and progressing, borrowers can publish live on-chain field updates directly to their project page. Updates are tagged by category (`Field Progress`, `Milestone Hit`, `Equipment & Assets`, `Expense Receipt`), include photos and transaction signatures, and display update badges across the directory so lenders can monitor real-world capital deployment.

- **Authentication & Embedded Web3:** Integrated Privy to provide frictionless embedded Solana wallets. Lenders and borrowers can log in with email or social accounts and immediately interact on-chain without browser extensions or seed-phrase hurdles, with full support for external Solana wallets.

- **Backend & Real-time State:** Loan applications ("Apply"), funding events ("Lend"), and project dispatches sync in real-time via **Firebase Firestore** using `onSnapshot` listeners and atomic multi-document transactions to preserve optimistic UI responsiveness.

- **Blockchain Escrows & On-Chain Proof:** Utilizes Solana Devnet for non-custodial Program Derived Address (PDA) escrows and the SPL Memo program to permanently record loan contributions and lender dedications on the transparency ledger.

- **Deployment:** Statically generated and optimized via Astro, deployed globally on **Firebase Hosting**.

## Prize Categories
- **Best Use of Solana:** LendingChain relies on Solana's sub-cent transaction fees and high throughput to make $5–$25 micro-lending viable, using embedded Privy wallets, SPL Memo inscriptions for permanent impact tracking, and non-custodial PDA escrows.
- **Best Use of Google AI:** LendingChain directly integrates Google Gemini to solve the biggest problem in peer-to-peer microfinance: trust and fraud. Gemini audits loan applicants, cross-references live on-chain Solana ledger signals to flag wallet irregularities, generates plain-language risk evaluations, and guides lenders with transparent creditworthiness scores.

Team: Solo build — @antoniocardenas
