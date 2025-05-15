
// Utility functions and constants for score handling

// This interface represents a score category with its name, current value and component reference
export interface ScoreCategory {
  name: string;
  value: number;
  component: string;
}

// Component ID mappings for score collection
export const COMPONENT_IDS = {
  netFlow: "NetFlowAnalysis",
  retention: "RetentionBehavior",
  minBalance: "MinBalanceStability",
  collateral: "CollateralManagement",
  basicActivity: "BasicActivity",
  borrowingBehavior: "BorrowingBehavior",
  stakingFarming: "StakingFarming",
  walletAge: "WalletAge",
  tokenPortfolio: "TokenPortfolio",
  transactionPatterns: "TransactionPatterns",
  ecosystemDApp: "EcosystemDApp"
};

// Component name mappings for display
export const COMPONENT_NAMES = {
  [COMPONENT_IDS.netFlow]: "Net Flow Analysis",
  [COMPONENT_IDS.retention]: "Retention Behavior",
  [COMPONENT_IDS.minBalance]: "Minimum Balance Stability",
  [COMPONENT_IDS.collateral]: "Collateral Management",
  [COMPONENT_IDS.basicActivity]: "Basic Activity Level",
  [COMPONENT_IDS.borrowingBehavior]: "Borrowing Behavior",
  [COMPONENT_IDS.stakingFarming]: "Staking & Farming Engagement",
  [COMPONENT_IDS.walletAge]: "Wallet Age & Longevity",
  [COMPONENT_IDS.tokenPortfolio]: "Token Portfolio Health",
  [COMPONENT_IDS.transactionPatterns]: "Transaction Patterns & Consistency",
  [COMPONENT_IDS.ecosystemDApp]: "Ecosystem DApp Coverage"
};

// Calculate the overall score as a weighted average of all component scores
export const calculateOverallScore = (scores: ScoreCategory[]): number => {
  if (!scores || scores.length === 0) return 0;

  // Define component weights based on the specified grades
  // Grade 1: 0.10
  // Grade 1.5: 0.15
  // Grade 0.5: 0.05
  const weights: Record<string, number> = {
    // Grade 1 components (0.10 each)
    [COMPONENT_IDS.netFlow]: 0.10,         // Grade 1
    [COMPONENT_IDS.minBalance]: 0.10,      // Grade 1
    [COMPONENT_IDS.tokenPortfolio]: 0.10,  // Grade 1
    [COMPONENT_IDS.walletAge]: 0.10,       // Grade 1
    [COMPONENT_IDS.transactionPatterns]: 0.10, // Grade 1
    [COMPONENT_IDS.basicActivity]: 0.10,   // Grade 1
    
    // Grade 1.5 components (0.15 each)
    [COMPONENT_IDS.retention]: 0.15,       // Grade 1.5
    [COMPONENT_IDS.collateral]: 0.15,      // Grade 1.5
    
    // Grade 0.5 components (0.05 each)
    [COMPONENT_IDS.stakingFarming]: 0.05,  // Grade 0.5
    [COMPONENT_IDS.ecosystemDApp]: 0.05,   // Grade 0.5
    
    // Other components
    [COMPONENT_IDS.borrowingBehavior]: 0.10
  };

  // Apply weights to scores
  let weightedSum = 0;
  let totalWeightApplied = 0;

  scores.forEach(score => {
    const weight = weights[score.component] || 0;
    weightedSum += score.value * weight;
    totalWeightApplied += weight;
  });

  // If no weights could be applied (no recognized components), use simple average
  if (totalWeightApplied === 0) {
    const sum = scores.reduce((total, score) => total + score.value, 0);
    return Math.round(sum / scores.length);
  }

  // Normalize by total weight applied
  return Math.round(weightedSum / totalWeightApplied);
};

// Get a score color based on value
export const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
};

// Get a score category based on value
export const getScoreCategory = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
};
