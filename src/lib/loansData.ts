import type { LoanRequest, LenderBadge, LendTransaction } from './types';
import { deriveLoanEscrowInfo } from './escrowProgram';

export const SOL_USD_RATE = 145.0; // 1 SOL = ~$145 USD for clean micro-conversions

const RAW_INITIAL_LOANS: LoanRequest[] = [
  {
    id: 'morocco-solar-press',
    title: 'Solar-Powered Cold Olive Press for Argan Cooperative',
    borrowerName: 'Fatima Zahra & Al-Amal Cooperative',
    borrowerRole: 'Cooperative President & Agricultural Lead',
    borrowerAvatar: '/images/borrowers/fatima-zahra.jpg',
    location: {
      city: 'Essaouira',
      country: 'Morocco',
      countryCode: 'MA'
    },
    category: 'Clean Energy',
    summary: 'Replace diesel generators with solar micro-presses to double cold-pressed olive yield for 34 indigenous female farmers.',
    story: 'For generations, our Berber women’s cooperative relied on rental diesel generators that consumed 40% of our seasonal profits and polluted our grove soil. By installing a solar micro-press powered by 12 photovoltaic panels, we eliminate fuel costs completely, ensure organic certification, and guarantee fair living wages for 34 matriarch households.',
    businessPlan: 'Funds will purchase an energy-efficient pneumatic cold press ($1,200), four 400W monocrystalline solar panels with hybrid inverters ($1,400), and sanitary food-grade stainless storage tanks ($600). Repayments are amortized across two harvest quarters with zero percent interest.',
    impactMetrics: [
      { label: 'Families Supported', value: '34 Families', iconName: 'Users' },
      { label: 'CO2 Avoided', value: '4.2 Tons/yr', iconName: 'Leaf' },
      { label: 'Income Increase', value: '+65%', iconName: 'TrendUp' },
      { label: 'Repayment Term', value: '12 Months', iconName: 'Calendar' }
    ],
    goalUSD: 3200,
    goalSOL: 22.06,
    raisedUSD: 2450,
    raisedSOL: 16.89,
    lendersCount: 47,
    termsMonths: 12,
    interestRate: 0,
    escrowAddress: '7XwK1tPzR9x8M2cT6g4hL5vB7nJ3mK9pQ2wE4rT6yU8i',
    status: 'funding',
    repaymentSchedule: [
      { month: 1, dueDate: '2026-10-05', amountUSD: 266.6, amountSOL: 1.83, status: 'upcoming' },
      { month: 2, dueDate: '2026-11-05', amountUSD: 266.6, amountSOL: 1.83, status: 'upcoming' },
      { month: 3, dueDate: '2026-12-05', amountUSD: 266.6, amountSOL: 1.83, status: 'upcoming' },
      { month: 4, dueDate: '2027-01-05', amountUSD: 266.6, amountSOL: 1.83, status: 'upcoming' }
    ],
    createdAt: '2026-08-20',
    featured: true
  },
  {
    id: 'guatemala-weaving-collective',
    title: 'Upright Looms & Natural Dye Vats for Maya Weavers',
    borrowerName: 'Elena Rostova & K’iche’ Collective',
    borrowerRole: 'Master Artisan & Fair-Trade Coordinator',
    borrowerAvatar: '/images/borrowers/elena-rostova.jpg',
    location: {
      city: 'Chichicastenango',
      country: 'Guatemala',
      countryCode: 'GT'
    },
    category: 'Women-Led',
    summary: 'Equipping 18 master weavers with ergonomic cedar backstrap looms and organic indigo cultivation kits.',
    story: 'Preserving our ancestral Mayan textiles requires independence from middleman yarn brokers who pay cents on the dollar. With direct micro-capital, our collective is building an ergonomic weaving workshop and cultivating local indigo and cochineal plants, enabling our textiles to sell directly to global fair-trade buyers.',
    businessPlan: 'Purchase of seasoned cypress timber for 18 looms ($900), certified organic botanical seed stock and copper dye boiling cauldrons ($850), and web commerce shipping packaging ($450).',
    impactMetrics: [
      { label: 'Artisans Empowered', value: '18 Weavers', iconName: 'Sparkle' },
      { label: 'Heritage Craft', value: 'Authentic Maya', iconName: 'Handshake' },
      { label: 'Children Schooled', value: '42 Children', iconName: 'GraduationCap' },
      { label: 'Intermediary Leakage', value: 'Zero Middlemen', iconName: 'ShieldCheck' }
    ],
    goalUSD: 2200,
    goalSOL: 15.17,
    raisedUSD: 1850,
    raisedSOL: 12.75,
    lendersCount: 38,
    termsMonths: 8,
    interestRate: 0,
    escrowAddress: '9LmK4pQ2wE4rT6yU8i7XwK1tPzR9x8M2cT6g4hL5vB7n',
    status: 'funding',
    repaymentSchedule: [
      { month: 1, dueDate: '2026-09-30', amountUSD: 275, amountSOL: 1.89, status: 'upcoming' },
      { month: 2, dueDate: '2026-10-30', amountUSD: 275, amountSOL: 1.89, status: 'upcoming' }
    ],
    createdAt: '2026-08-25',
    featured: true
  },
  {
    id: 'ghana-solar-refrigeration',
    title: 'Mobile Solar Ice Stations for Coastal Fishmongers',
    borrowerName: 'Kofi Mensah',
    borrowerRole: 'Clean Tech Entrepreneur & Logistics Lead',
    borrowerAvatar: '/images/borrowers/kofi-mensah.jpg',
    location: {
      city: 'Cape Coast',
      country: 'Ghana',
      countryCode: 'GH'
    },
    category: 'Small Business',
    summary: 'Deploying solar-powered block ice freezers to prevent 40% fish spoilage for over 60 artisanal fishermen.',
    story: 'Every morning in Cape Coast, fishermen bring in fresh mackerel and tuna, but without cold storage, 35-40% spoils before reaching inland markets. My venture operates cargo tricycles fitted with lithium-ion solar freezers, delivering affordable hygienic ice directly to boats at dawn.',
    businessPlan: 'Commercial 48V DC solar compressor system ($1,800), two 200Ah deep-cycle LiFePO4 batteries ($1,400), and insulated food-grade tricycle pod ($800). Repayments funded via daily ice subscriptions from 60 registered boats.',
    impactMetrics: [
      { label: 'Spoilage Prevented', value: '250 kg/day', iconName: 'ShieldCheck' },
      { label: 'Boats Supported', value: '60 Crews', iconName: 'Anchor' },
      { label: 'Clean Energy', value: '100% Solar', iconName: 'Sun' },
      { label: 'Repayment Period', value: '10 Months', iconName: 'Clock' }
    ],
    goalUSD: 4000,
    goalSOL: 27.58,
    raisedUSD: 3650,
    raisedSOL: 25.17,
    lendersCount: 62,
    termsMonths: 10,
    interestRate: 0,
    escrowAddress: '5vB7nJ3mK9pQ2wE4rT6yU8i7XwK1tPzR9x8M2cT6g4hL',
    status: 'funding',
    repaymentSchedule: [
      { month: 1, dueDate: '2026-10-15', amountUSD: 400, amountSOL: 2.75, status: 'upcoming' }
    ],
    createdAt: '2026-08-18',
    featured: true
  },
  {
    id: 'kenya-stem-girls-hub',
    title: 'Community Raspberry Pi Robotics & Coding Lab for Young Women',
    borrowerName: 'Amina Kimani & GirlsInCode Kenya',
    borrowerRole: 'Educator & Systems Engineer',
    borrowerAvatar: '/images/borrowers/amina-kimani.jpg',
    location: {
      city: 'Kisumu',
      country: 'Kenya',
      countryCode: 'KE'
    },
    category: 'Education',
    summary: 'Equipping a solar-backed learning lab with 25 Raspberry Pi 5 workstations for secondary school girls.',
    story: 'In our county, less than 9% of computer science graduates are women due to lack of hardware access. We run peer-to-peer coding academies teaching Python, web development, and IoT water sensor engineering. With this loan, we establish a permanent classroom powered by mini solar kits.',
    businessPlan: '25 Raspberry Pi 5 desktop kits with monitors and keyboard peripherals ($2,000), Starlink satellite mini terminal & 6-month subscription ($650), and solar inverter battery backup ($850).',
    impactMetrics: [
      { label: 'Students Trained', value: '150/yr', iconName: 'GraduationCap' },
      { label: 'Career Placement', value: '85% Rate', iconName: 'Briefcase' },
      { label: 'Hardware Units', value: '25 Units', iconName: 'Cpu' },
      { label: 'Repayment Term', value: '14 Months', iconName: 'CheckCircle' }
    ],
    goalUSD: 3500,
    goalSOL: 24.13,
    raisedUSD: 2900,
    raisedSOL: 20.00,
    lendersCount: 54,
    termsMonths: 14,
    interestRate: 0,
    escrowAddress: '3mK9pQ2wE4rT6yU8i7XwK1tPzR9x8M2cT6g4hL5vB7nJ',
    status: 'funding',
    repaymentSchedule: [
      { month: 1, dueDate: '2026-11-01', amountUSD: 250, amountSOL: 1.72, status: 'upcoming' }
    ],
    createdAt: '2026-08-28',
    featured: false
  },
  {
    id: 'vietnam-cargo-ebikes',
    title: 'Electric Cargo Trikes for Organic Farmer Market Cooperative',
    borrowerName: 'Nguyen Van Minh',
    borrowerRole: 'Cooperative Logistics Manager',
    borrowerAvatar: '/images/borrowers/nguyen-van-minh.jpg',
    location: {
      city: 'Da Lat',
      country: 'Vietnam',
      countryCode: 'VN'
    },
    category: 'Agriculture',
    summary: 'Replacing smoke-belching 2-stroke mopeds with 6 solar-charged cargo e-bikes for mountain farm logistics.',
    story: 'Our organic mountain vegetable growers were spending over a third of daily earnings on fuel for old motorbikes. Electric cargo trikes with regenerative downhill braking let us haul 300kg of fresh greens directly into the city wholesale hub at zero emission and near-zero cost.',
    businessPlan: '6 heavy-duty custom cargo e-trikes with swappable lithium battery packs ($2,400), shared charging solar carport ($1,200). Repayments deducted from collective transport fuel savings.',
    impactMetrics: [
      { label: 'Growers Served', value: '48 Farmers', iconName: 'Truck' },
      { label: 'Monthly Savings', value: '$840/mo', iconName: 'CurrencyDollar' },
      { label: 'Emissions', value: 'Zero Carbon', iconName: 'Lightning' },
      { label: 'Repayment Term', value: '12 Months', iconName: 'Clock' }
    ],
    goalUSD: 3600,
    goalSOL: 24.82,
    raisedUSD: 3600,
    raisedSOL: 24.82,
    lendersCount: 58,
    termsMonths: 12,
    interestRate: 0,
    escrowAddress: '4rT6yU8i7XwK1tPzR9x8M2cT6g4hL5vB7nJ3mK9pQ2wE',
    status: 'active',
    repaymentSchedule: [
      { month: 1, dueDate: '2026-08-01', amountUSD: 300, amountSOL: 2.06, status: 'completed', txHash: '5eH...sol' },
      { month: 2, dueDate: '2026-09-01', amountUSD: 300, amountSOL: 2.06, status: 'completed', txHash: '3wP...sol' },
      { month: 3, dueDate: '2026-10-01', amountUSD: 300, amountSOL: 2.06, status: 'upcoming' }
    ],
    createdAt: '2026-07-15',
    featured: false
  },
  {
    id: 'jordan-greywater-greenhouse',
    title: 'Arid Greywater Recycling Hydroponic Greenhouses',
    borrowerName: 'Samira Al-Husseini',
    borrowerRole: 'Agronomist & Conservation Specialist',
    borrowerAvatar: '/images/borrowers/samira-al-husseini.jpg',
    location: {
      city: 'Mafraq',
      country: 'Jordan',
      countryCode: 'JO'
    },
    category: 'Climate Resilience',
    summary: 'Bio-sand filtration and closed-loop nutrient film hydroponics to grow vegetables in extreme drought.',
    story: 'In northern Jordan, water scarcity threatens refugee host communities and smallholders alike. Our closed-loop hydroponic greenhouse recovers 92% of water through non-chemical reed and volcanic sand filtration, producing pesticide-free cucumbers, tomatoes, and herbs year-round.',
    businessPlan: 'Bio-filtration reed beds and UV purification filter ($1,100), automated nutrient dosing pumps ($900), shade cloth and PVC vertical hydroponic towers ($1,000).',
    impactMetrics: [
      { label: 'Water Conserved', value: '92% Recovery', iconName: 'Drop' },
      { label: 'Yield Increase', value: '4x Multiple', iconName: 'TrendUp' },
      { label: 'Local Jobs', value: '12 Created', iconName: 'Users' },
      { label: 'Repayment Term', value: '9 Months', iconName: 'Calendar' }
    ],
    goalUSD: 3000,
    goalSOL: 20.68,
    raisedUSD: 3000,
    raisedSOL: 20.68,
    lendersCount: 71,
    termsMonths: 9,
    interestRate: 0,
    escrowAddress: '8M2cT6g4hL5vB7nJ3mK9pQ2wE4rT6yU8i7XwK1tPzR9x',
    status: 'repaid',
    repaymentSchedule: [
      { month: 1, dueDate: '2026-05-01', amountUSD: 333, amountSOL: 2.29, status: 'completed', txHash: '4xQ...sol' },
      { month: 2, dueDate: '2026-06-01', amountUSD: 333, amountSOL: 2.29, status: 'completed', txHash: '2tY...sol' },
      { month: 3, dueDate: '2026-07-01', amountUSD: 333, amountSOL: 2.29, status: 'completed', txHash: '7vA...sol' }
    ],
    createdAt: '2026-04-10',
    featured: false
  }
];

export const INITIAL_LOANS: LoanRequest[] = RAW_INITIAL_LOANS.map(loan => ({
  ...loan,
  escrowAddress: deriveLoanEscrowInfo(loan.id).vaultPda
}));

export const BADGE_DEFINITIONS: LenderBadge[] = [
  {
    tier: 'Seedling',
    title: 'Generosity Seedling',
    iconName: 'Plant',
    thresholdUSD: 10,
    description: 'Funded your first micro-loan on Solana Devnet. You initiated the cycle of economic independence.',
    perks: ['On-chain verified lender proof', 'LendingChain governance token vote', 'Digital impact report'],
    unlocked: false
  },
  {
    tier: 'Cultivator',
    title: 'Community Cultivator',
    iconName: 'PottedPlant',
    thresholdUSD: 50,
    description: 'Supported multiple enterprises across borders with over $50 in cumulative zero-interest working capital.',
    perks: ['Early access to high-impact loans', 'Devnet airdrop faucet priority', 'On-chain proof of contribution'],
    unlocked: false
  },
  {
    tier: 'Grower',
    title: 'Ecosystem Grower',
    iconName: 'Tree',
    thresholdUSD: 150,
    description: 'Crossed $150 in deployed micro-lending capital. Directly accelerated clean energy and female-led initiatives.',
    perks: ['Custom dedication memo pinning', 'Quarterly enterprise progress updates', 'Devnet verified patron status'],
    unlocked: false
  },
  {
    tier: 'Catalyst',
    title: 'Transformational Catalyst',
    iconName: 'TreeEvergreen',
    thresholdUSD: 300,
    description: 'A major philanthropic contributor with over $300 deployed. Created verified jobs in vulnerable communities.',
    perks: ['Direct Q&A with cooperative coordinators', 'Impact report certified by cooperatives', 'Priority loan allocation'],
    unlocked: false
  },
  {
    tier: 'Patron',
    title: 'Global Sovereign Patron',
    iconName: 'DiamondsFour',
    thresholdUSD: 500,
    description: 'Top-tier micro-lender pillar with over $500 deployed. Permanent recognition on the Solana transparency ledger.',
    perks: ['Permanent placement on the Transparency Ledger honor roll', 'Quarterly global stewardship roundtable', 'Delegated voting allocation'],
    unlocked: false
  }
];

export const INITIAL_TRANSACTIONS: LendTransaction[] = [
  {
    id: 'tx-init-1',
    txHash: '5x4aZkH...sol',
    loanId: 'morocco-solar-press',
    loanTitle: 'Solar-Powered Cold Olive Press for Argan Cooperative',
    borrowerName: 'Fatima Zahra & Al-Amal',
    lenderAddress: '4Z3...9yW',
    amountSOL: 0.35,
    amountUSD: 50.75,
    message: 'Dedicated for the UN International Day of Charity. Empowering women in agriculture.',
    timestamp: Date.now() - 1000 * 60 * 18,
    cluster: 'devnet',
    simulated: true
  },
  {
    id: 'tx-init-2',
    txHash: '3p9vLmQ...sol',
    loanId: 'guatemala-weaving-collective',
    loanTitle: 'Upright Looms & Natural Dye Vats for Maya Weavers',
    borrowerName: 'Elena Rostova',
    lenderAddress: '8kM...2tR',
    amountSOL: 0.17,
    amountUSD: 25.0,
    message: 'Backing independent craft preservation and fair-trade exports.',
    timestamp: Date.now() - 1000 * 60 * 45,
    cluster: 'devnet',
    simulated: true
  },
  {
    id: 'tx-init-3',
    txHash: '7wE2kP9...sol',
    loanId: 'ghana-solar-refrigeration',
    loanTitle: 'Mobile Solar Ice Stations for Coastal Fishmongers',
    borrowerName: 'Kofi Mensah',
    lenderAddress: '2qL...8fB',
    amountSOL: 0.69,
    amountUSD: 100.0,
    message: 'Solar-powered cold chain for coastal livelihoods. Important work.',
    timestamp: Date.now() - 1000 * 60 * 95,
    cluster: 'devnet',
    simulated: true
  },
  {
    id: 'tx-init-4',
    txHash: '9rT4mK1...sol',
    loanId: 'kenya-stem-girls-hub',
    loanTitle: 'Community Raspberry Pi Robotics & Coding Lab',
    borrowerName: 'Amina Kimani',
    lenderAddress: '5vN...3xS',
    amountSOL: 0.35,
    amountUSD: 50.0,
    message: 'Supporting hardware access for future software engineers.',
    timestamp: Date.now() - 1000 * 60 * 180,
    cluster: 'devnet',
    simulated: true
  }
];

export async function seedFirestoreIfEmpty(db: any) {
  const { collection, getDocs, setDoc, doc } = await import("firebase/firestore");
  
  // Seed Loans
  const loansRef = collection(db, 'loans');
  const loansSnap = await getDocs(loansRef);
  
  if (loansSnap.empty) {
    console.log("Seeding loans to Firestore...");
    for (const loan of INITIAL_LOANS) {
      await setDoc(doc(db, "loans", loan.id), loan);
    }
  }
  
  // Seed Transactions
  const txRef = collection(db, 'transactions');
  const txSnap = await getDocs(txRef);
  
  if (txSnap.empty) {
    console.log("Seeding transactions to Firestore...");
    for (const tx of INITIAL_TRANSACTIONS) {
      await setDoc(doc(db, "transactions", tx.id), tx);
    }
  }
}
