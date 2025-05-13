
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

const TokenPortfolioHealth: React.FC<Props> = ({ transactions }) => {
  // Calculate token diversity and health metrics
  const calculatePortfolioMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return {
        uniqueTokens: 0,
        primaryToken: "None",
        diversityScore: 0,
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
    
    // Calculate diversity score (0-100)
    // Higher score for more unique tokens and more even distribution
    let diversityScore = 0;
    
    // Base score from unique token count
    if (uniqueTokens >= 7) diversityScore = 50;
    else if (uniqueTokens >= 5) diversityScore = 40;
    else if (uniqueTokens >= 3) diversityScore = 30;
    else if (uniqueTokens >= 2) diversityScore = 20;
    else diversityScore = 10;
    
    // Adjust based on distribution - check if overly concentrated in one token
    if (uniqueTokens > 1 && sortedTokens[0].count < totalTokenTransactions * 0.7) {
      diversityScore += 20; // Good distribution
    } else if (uniqueTokens > 1 && sortedTokens[0].count < totalTokenTransactions * 0.8) {
      diversityScore += 10; // Decent distribution
    }
    
    // Final portfolio score calculation
    // Combine diversity with transaction sophistication
    
    // Find evidence of sophisticated token usage
    const sophisticationBonus = transactions.some(tx => 
      tx.type?.toLowerCase().includes('swap') || 
      tx.type?.toLowerCase().includes('yield') ||
      tx.type?.toLowerCase().includes('stake')
    ) ? 15 : 0;
    
    // Calculate final score
    const finalScore = Math.min(100, diversityScore + sophisticationBonus + 15); // Add base points
    
    return {
      uniqueTokens,
      primaryToken,
      diversityScore,
      totalTokens: totalTokenTransactions,
      score: finalScore
    };
  };
  
  const { uniqueTokens, primaryToken, totalTokens, score } = calculatePortfolioMetrics();
  
  // Calculate top token percentage
  const topTokenPct = transactions.length > 0 ? 
    Math.round(transactions.filter(tx => 
      tx.currency?.toUpperCase() === primaryToken
    ).length / Math.max(1, transactions.length) * 100) : 0;

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
          <h5 className="text-sm font-medium text-muted-foreground">Unique Tokens</h5>
          <p className="text-xl font-bold">{uniqueTokens} <span className="text-xs font-normal text-muted-foreground">tokens</span></p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Primary Token</h5>
          <p className="text-xl font-bold">{primaryToken} <span className="text-xs font-normal text-muted-foreground">{topTokenPct}%</span></p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Total Txs</h5>
          <p className="text-xl font-bold">{totalTokens} <span className="text-xs font-normal text-muted-foreground">transactions</span></p>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Diversity Score</span>
            <span className="text-xs">{score}/100</span>
          </div>
          <Progress value={score} className="h-1.5" />
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>A diverse token portfolio with a history of sophisticated token usage improves your credit score.</p>
      </div>
    </div>
  );
};

export default TokenPortfolioHealth;
