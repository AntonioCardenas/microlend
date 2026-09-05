export type LoanCategory = 
  | 'Agriculture'
  | 'Clean Energy'
  | 'Small Business'
  | 'Women-Led'
  | 'Education'
  | 'Climate Resilience';

export type LoanStatus = 'funding' | 'active' | 'repaid';

export interface RepaymentMilestone {
  month: number;
  dueDate: string;
  amountUSD: number;
  amountSOL: number;
  status: 'completed' | 'on_track' | 'upcoming';
  txHash?: string;
}

export interface ImpactMetric {
  label: string;
  value: string;
  iconName: string;
}

export interface WalletAuditFinding {
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  detail: string;
}

export interface LoanAIAudit {
  riskScore: number; // 0 to 100 (lower is safer)
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  summary: string;
  borrowerAssessment: string;
  walletAudit: {
    address: string;
    isNewWallet: boolean;
    walletAgeDays?: number;
    transactionCount: number;
    solBalance: number;
    irregularitiesDetected: string[];
    findings: WalletAuditFinding[];
  };
  recommendation: string;
  auditedAt: string;
  modelUsed: string;
}

export interface ProjectUpdate {
  id: string;
  authorName: string;
  authorRole: string;
  authorAddress: string;
  title: string;
  content: string;
  imageUrl?: string;
  txHash?: string;
  timestamp: number;
  category: 'milestone' | 'progress' | 'equipment' | 'financial';
}

export interface LoanRequest {
  id: string;
  title: string;
  borrowerName: string;
  borrowerRole: string;
  borrowerAvatar: string;
  borrowerAddress?: string;
  location: {
    city: string;
    country: string;
    countryCode: string;
  };
  category: LoanCategory;
  summary: string;
  story: string;
  businessPlan: string;
  impactMetrics: ImpactMetric[];
  goalUSD: number;
  goalSOL: number;
  raisedUSD: number;
  raisedSOL: number;
  lendersCount: number;
  termsMonths: number;
  interestRate: number; // 0%
  escrowAddress: string;
  status: LoanStatus;
  repaymentSchedule: RepaymentMilestone[];
  createdAt: string;
  featured?: boolean;
  aiAudit?: LoanAIAudit;
  updates?: ProjectUpdate[];
}

export interface LendTransaction {
  id: string;
  txHash: string;
  loanId: string;
  loanTitle: string;
  borrowerName: string;
  lenderAddress: string;
  amountSOL: number;
  amountUSD: number;
  message?: string;
  timestamp: number;
  slot?: number;
  cluster: 'devnet' | 'mainnet-beta';
  simulated?: boolean;
}

export type BadgeTier = 'Seedling' | 'Cultivator' | 'Grower' | 'Catalyst' | 'Patron';

export interface LenderBadge {
  tier: BadgeTier;
  title: string;
  iconName: string;
  thresholdUSD: number;
  description: string;
  perks: string[];
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserPortfolio {
  address: string;
  totalLentUSD: number;
  totalLentSOL: number;
  activeLoansCount: number;
  repaidLoansCount: number;
  totalRepaidUSD: number;
  availableToRelendUSD: number;
  impactScore: number;
  badgesUnlocked: BadgeTier[];
}
