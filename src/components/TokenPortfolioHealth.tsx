
import React from "react";
import { Coins, Wallet, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: number | string;
  currency?: string;
  type?: string;
};

type Props = {
  transactions: Transaction[];
};

const BLUE_CHIP_TOKENS = ['SOL', 'USDC', 'USDT', 'BTC', 'ETH'];

const TokenPortfolioHealth: React.FC<Props> = ({ transactions }) => {
  // Calculate token diversity and health metrics
  const calculatePortfolioMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return {
        uniqueTokens: 0,
        primaryToken: "None",
        blueChipPercentage: 0,
        stablecoinCoverage: 0,
        totalTokens: 0,
        score: 0
      };
    }
    
    // Count token occurrences
    const tokenCount: {[key: string]: number} = {};
    let totalTokenTransactions = 0;
    
    transactions.forEach(tx => {
      if (tx.currency) {
        const currency = tx.currency.toUpperCase();
        tokenCount[currency] = (tokenCount[currency] || 0) + 1;
        totalTokenTransactions++;
      }
    });
    
    // Sort tokens by frequency
    const sortedTokens = Object.entries(tokenCount)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({ symbol: entry[0], count: entry[1] }));
    
    // Calculate diversity metrics
    const uniqueTokens = sortedTokens.length;
    const primaryToken = sortedTokens.length > 0 ? sortedTokens[0].symbol : "None";
    
    // Calculate blue-chip percentage
    const blueChipTokens = sortedTokens.filter(token => 
      BLUE_CHIP_TOKENS.includes(token.symbol)
    );
    
    const blueChipCount = blueChipTokens.reduce((sum, token) => sum + token.count, 0);
    const blueChipPercentage = totalTokenTransactions > 0 ? 
      (blueChipCount / totalTokenTransactions) * 100 : 0;
    
    // Calculate stablecoin coverage ratio
    const stableTokens = sortedTokens.filter(token => 
      ['USDC', 'USDT', 'DAI', 'BUSD'].includes(token.symbol)
    );
    
    const stableCount = stableTokens.reduce((sum, token) => sum + token.count, 0);
    const stablecoinCoverage = totalTokenTransactions > 0 ? 
      (stableCount / totalTokenTransactions) * 100 : 0;
    
    // Calculate score based on Algorithm #5: Token Portfolio Health
    let score = 0;
    
    // Use the higher of blue chip percentage or stablecoin coverage
    const qualityAssetPercentage = Math.max(blueChipPercentage, stablecoinCoverage);
    
    // Score calculation based on the specified algorithm
    if (qualityAssetPercentage >= 60) {
      score = 90 + Math.min(10, (qualityAssetPercentage - 60) / 4); // 90-100
    } else if (qualityAssetPercentage >= 40) {
      score = 70 + (qualityAssetPercentage - 40) / 2; // 70-89
    } else if (qualityAssetPercentage >= 20) {
      score = 40 + (qualityAssetPercentage - 20) * 1.5; // 40-69
    } else {
      score = qualityAssetPercentage * 2; // 0-39
    }
    
    return {
      uniqueTokens,
      primaryToken,
      blueChipPercentage,
      stablecoinCoverage,
      totalTokens: totalTokenTransactions,
      score: Math.round(score)
    };
  };
  
  const { 
    uniqueTokens, 
    primaryToken, 
    totalTokens, 
    score, 
    blueChipPercentage, 
    stablecoinCoverage 
  } = calculatePortfolioMetrics();
  
  // Calculate top token percentage
  const topTokenPct = transactions.length > 0 ? 
    Math.round(transactions.filter(tx => 
      tx.currency?.toUpperCase() === primaryToken
    ).length / Math.max(1, transactions.length) * 100) : 0;

  // For logging purposes
  console.log("TokenPortfolioHealth Metrics:", { 
    uniqueTokens, 
    primaryToken, 
    score, 
    blueChipPercentage: Math.round(blueChipPercentage),
    stablecoinCoverage: Math.round(stablecoinCoverage)
  });

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="TokenPortfolio">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Token Portfolio Health
        </h4>
        
        <span 
          className={`inline-block rounded px-3 py-1 text-sm font-bold ${
            score >= 90
              ? "bg-green-200 text-green-800"
              : score >= 70
              ? "bg-yellow-200 text-yellow-800"
              : score >= 40
              ? "bg-orange-200 text-orange-900"
              : "bg-red-200 text-red-800"
          }`}
          data-score={score}
        >
          Score: {score}/100
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Blue-Chip %</h5>
          <p className="text-xl font-bold">{Math.round(blueChipPercentage)}%</p>
          <p className="text-xs text-muted-foreground">SOL, USDC, USDT, etc.</p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Stablecoin Coverage</h5>
          <p className="text-xl font-bold">{Math.round(stablecoinCoverage)}%</p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Unique Tokens</h5>
          <p className="text-xl font-bold">{uniqueTokens} <span className="text-xs font-normal text-muted-foreground">tokens</span></p>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Portfolio Health Score</span>
            <span className="text-xs">{score}/100</span>
          </div>
          <Progress value={score} className="h-1.5" />
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <ul className="list-disc pl-5 space-y-1">
          <li>60%+ blue-chips or stables: 90–100</li>
          <li>40–60% quality assets: 70–89</li>
          <li>20–40% quality assets: 40–69</li>
          <li>&lt;20% quality assets: 0–39</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenPortfolioHealth;
