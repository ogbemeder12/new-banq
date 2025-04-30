
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, TrendingDown } from "lucide-react";

interface Transaction {
  amount: number | string;
  currency?: string;
  timestamp: number;
  signature?: string;
}

interface MinBalanceStabilityProps {
  transactions: Transaction[];
  currentBalance?: number;
}

const MinBalanceStability = ({ transactions, currentBalance = 0 }: MinBalanceStabilityProps) => {
  const metrics = useMemo(() => {
    if (!transactions || transactions.length < 2) {
      return {
        score: 50,
        minBalanceRatio: 0,
        averageMinBalance: 0,
        totalValue: currentBalance,
        hasData: false
      };
    }

    try {
      // Extract SOL transactions only
      const solTransactions = transactions.filter(tx => 
        !tx.currency || tx.currency.toUpperCase() === 'SOL'
      );
      
      console.log(`Analyzing ${solTransactions.length} SOL transactions for minimum balance stability`);

      // Sort transactions by timestamp (oldest first)
      const sortedTransactions = [...solTransactions].sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate historical balances
      const historicalBalances: number[] = [];
      let runningBalance = currentBalance;
      
      // Work backwards from current balance to calculate historical balances
      for (let i = sortedTransactions.length - 1; i >= 0; i--) {
        const tx = sortedTransactions[i];
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);
        
        if (!isNaN(amount)) {
          // Reverse the transaction to go backwards in time
          runningBalance -= amount;
          historicalBalances.push(runningBalance);
          
          console.log(`Historical balance after reverting transaction ${tx.signature?.substring(0, 6)}: ${runningBalance.toFixed(4)} SOL`);
        }
      }
      
      // Find the absolute minimum balance observed
      const minBalance = Math.min(...historicalBalances, currentBalance);
      console.log(`Minimum observed balance: ${minBalance.toFixed(4)} SOL`);
      
      // Calculate daily minimum balances
      const dailyMinimums: Record<string, number> = {};
      runningBalance = currentBalance;
      
      // Reset and calculate daily minimums going forward
      for (let i = sortedTransactions.length - 1; i >= 0; i--) {
        const tx = sortedTransactions[i];
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);
          
        if (isNaN(amount)) continue;
        
        // Get day from timestamp
        const day = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
        
        // Update running balance (subtract amount since we're going backwards)
        runningBalance -= amount;
        
        // Update daily minimum
        if (!dailyMinimums[day] || runningBalance < dailyMinimums[day]) {
          dailyMinimums[day] = runningBalance;
        }
      }
      
      // Calculate average minimum daily balance
      const minBalances = Object.values(dailyMinimums);
      const averageMinBalance = minBalances.length > 0 
        ? minBalances.reduce((sum, bal) => sum + Math.max(0, bal), 0) / minBalances.length 
        : Math.max(0, minBalance);
        
      console.log(`Average minimum daily balance: ${averageMinBalance.toFixed(4)} SOL from ${minBalances.length} days`);

      // Calculate ratio of average minimum balance to total wallet value
      const totalValue = Math.max(currentBalance, ...minBalances, 0.001); // Avoid division by zero
      const minBalanceRatio = Math.max(0, averageMinBalance) / totalValue;
      
      console.log(`Min balance ratio: ${(minBalanceRatio * 100).toFixed(2)}% (${averageMinBalance.toFixed(4)} / ${totalValue.toFixed(4)})`);

      // Calculate score based on ratio thresholds
      let score = 0;
      if (minBalanceRatio >= 0.5) {
        score = 90 + (minBalanceRatio - 0.5) * 20; // Scale 90-100
      } else if (minBalanceRatio >= 0.3) {
        score = 70 + ((minBalanceRatio - 0.3) / 0.2) * 19; // Scale 70-89
      } else if (minBalanceRatio >= 0.1) {
        score = 40 + ((minBalanceRatio - 0.1) / 0.2) * 29; // Scale 40-69
      } else {
        score = Math.max(20, (minBalanceRatio / 0.1) * 39); // Scale 20-39
      }

      console.log(`Final stability score: ${Math.round(score)}`);

      return {
        score: Math.round(score),
        minBalanceRatio,
        averageMinBalance,
        totalValue,
        hasData: true
      };
    } catch (error) {
      console.error("Error calculating minimum balance stability:", error);
      return {
        score: 50,
        minBalanceRatio: 0,
        averageMinBalance: 0,
        totalValue: currentBalance,
        hasData: false
      };
    }
  }, [transactions, currentBalance]);

  const getScoreCategory = (score: number) => {
    if (score >= 90) return "Very High Stability";
    if (score >= 70) return "High Stability";
    if (score >= 40) return "Moderate Stability";
    return "Low Stability";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minimum Balance Stability</CardTitle>
        <CardDescription>Analysis of maintained minimum balance relative to total value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stability Score</span>
              <span className={`text-lg font-bold ${getScoreColor(metrics.score)}`}>
                {metrics.score}
              </span>
            </div>
            <Progress value={metrics.score} className="h-2" />
            {!metrics.hasData && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Insufficient transaction data for stability analysis
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-500">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Min Balance Ratio</span>
              </div>
              <p className="text-xl font-bold">
                {(metrics.minBalanceRatio * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Avg Min Balance / Total Value
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-500">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Average Min Balance</span>
              </div>
              <p className="text-xl font-bold">
                {metrics.averageMinBalance.toFixed(4)} SOL
              </p>
              <p className="text-xs text-muted-foreground">
                Daily minimum average
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>{getScoreCategory(metrics.score)}:</strong> {metrics.hasData ? 
                `Maintains ${(metrics.minBalanceRatio * 100).toFixed(1)}% of total value (${metrics.totalValue.toFixed(4)} SOL)` :
                "No stability data available"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MinBalanceStability;
