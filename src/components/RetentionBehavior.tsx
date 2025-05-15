
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingDown } from "lucide-react";

interface RetentionBehaviorProps {
  transactions: any[];
  tokenBalances?: any[];
}

const RetentionBehavior = ({ transactions, tokenBalances = [] }: RetentionBehaviorProps) => {
  // Define major tokens to track
  const majorTokens = ["USDT", "USDC", "SOL"]; 

  // Calculate metrics based on transactions
  const metrics = useMemo(() => {
    // Default metrics for no data
    const defaultMetrics = {
      holdTimeScore: 0,
      volatilityScore: 0,
      holdTimeText: "No data available",
      volatilityText: "No data available",
      holdTimeValue: 0,
      volatilityValue: 0,
      hasData: false
    };

    // Ensure we have at least one transaction
    if (!transactions || transactions.length === 0) {
      console.log("No transaction data for retention metrics");
      return defaultMetrics;
    }

    try {
      console.log(`Calculating retention metrics based on ${transactions.length} transactions`);
      
      // Extract and normalize transactions for analysis
      const normalizedTransactions = transactions.map(tx => {
        // Extract timestamp (blockTime or timestamp)
        const timestamp = tx.blockTime || tx.timestamp || 0;
        
        // Try to extract currency and amount
        let amount = 0;
        let currency = 'Unknown';
        
        // Look for token transfers
        if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
          const transfer = tx.tokenTransfers[0];
          amount = typeof transfer.tokenAmount === 'string' ? 
            parseFloat(transfer.tokenAmount) : 
            (typeof transfer.tokenAmount === 'number' ? transfer.tokenAmount : 0);
          currency = transfer.mint || transfer.tokenSymbol || 'Unknown Token';
        } 
        // Look for native SOL transfers
        else if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
          const transfer = tx.nativeTransfers[0];
          amount = transfer.amount ? transfer.amount / 1000000000 : 0; // Convert lamports to SOL
          currency = 'SOL';
        }
        // Look at direct amount
        else if (tx.amount !== undefined) {
          amount = typeof tx.amount === 'string' ? 
            parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
            (typeof tx.amount === 'number' ? tx.amount : 0);
          currency = tx.currency || 'SOL';
        }
        
        return { timestamp, amount, currency };
      }).filter(tx => tx.timestamp > 0);

      console.log("Normalized transactions for retention analysis:", normalizedTransactions.length);

      // If no valid transactions found after normalization
      if (normalizedTransactions.length === 0) {
        console.log("No valid transactions with timestamps found");
        return defaultMetrics;
      }

      // Group transactions by token for hold time analysis
      const tokenTransactions = normalizedTransactions.reduce((acc: Record<string, Array<{timestamp: number, amount: number}>>, tx) => {
        const currency = tx.currency.toUpperCase();
        
        if (!acc[currency]) acc[currency] = [];
        
        acc[currency].push({
          timestamp: tx.timestamp,
          amount: tx.amount
        });
        
        return acc;
      }, {});

      // Calculate hold time for major tokens
      const now = Math.floor(Date.now() / 1000);
      let totalHoldDays = 0;
      let majorTokensFound = 0;
      
      // Focus on major tokens (USDT, USDC, SOL)
      for (const token of majorTokens) {
        const txs = tokenTransactions[token];
        if (txs && txs.length > 0) {
          // Sort by timestamp (oldest first)
          const sortedTxs = txs.slice().sort((a, b) => a.timestamp - b.timestamp);
          
          // Calculate hold time from first transaction to now
          const firstTx = sortedTxs[0];
          if (firstTx.timestamp > 0) {
            const holdTimeInDays = (now - firstTx.timestamp) / 86400;
            
            if (holdTimeInDays > 0) {
              totalHoldDays += holdTimeInDays;
              majorTokensFound++;
              console.log(`${token} hold time: ${holdTimeInDays.toFixed(2)} days`);
            }
          }
        }
      }
      
      // If no major tokens found, try to calculate hold time for any token
      if (majorTokensFound === 0) {
        // Sort all transactions by timestamp (oldest first)
        const sortedTxs = normalizedTransactions.sort((a, b) => a.timestamp - b.timestamp);
        
        if (sortedTxs.length > 0) {
          const firstTx = sortedTxs[0];
          const holdTimeInDays = (now - firstTx.timestamp) / 86400;
          
          if (holdTimeInDays > 0) {
            totalHoldDays = holdTimeInDays;
            majorTokensFound = 1; // Count as one token for average calculation
            console.log(`Overall hold time: ${holdTimeInDays.toFixed(2)} days`);
          }
        }
      }
      
      // Calculate average hold time
      const averageHoldTime = majorTokensFound > 0 ? totalHoldDays / majorTokensFound : 0;
      
      // Calculate daily balance volatility
      const balanceChanges: number[] = [];
      
      // Group transactions by day
      const txsByDay: Record<string, number[]> = {};
      normalizedTransactions.forEach(tx => {
        if (tx.timestamp > 0) {
          const day = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
          if (!txsByDay[day]) txsByDay[day] = [];
          txsByDay[day].push(tx.amount);
        }
      });
      
      // Calculate daily volatility
      const days = Object.keys(txsByDay).sort();
      for (let i = 1; i < days.length; i++) {
        const prevDay = days[i-1];
        const currDay = days[i];
        
        const prevDayTotal = txsByDay[prevDay].reduce((sum, amount) => sum + amount, 0);
        const currDayTotal = txsByDay[currDay].reduce((sum, amount) => sum + amount, 0);
        
        if (prevDayTotal !== 0) {
          const changePercent = Math.abs((currDayTotal - prevDayTotal) / prevDayTotal) * 100;
          balanceChanges.push(changePercent);
        }
      }
      
      // Calculate average daily volatility
      const volatility = balanceChanges.length > 0
        ? balanceChanges.reduce((sum, change) => sum + change, 0) / balanceChanges.length
        : 20; // Default volatility if we can't calculate
      
      // Calculate scores based on new algorithm
      // Hold time score: 0-50 points based on hold time (linear scale up to 30 days)
      // High median hold time (> 30 days) → Score +50
      const holdTimeScore = Math.min(50, (averageHoldTime / 30) * 50);
      
      // Volatility score: 0-50 points based on volatility (linear scale, lower is better)
      // Low volatility (< 10%) → Score +50
      const volatilityScore = Math.max(0, Math.min(50, 50 - (volatility / 10) * 50));
      
      // Format text descriptions
      const holdTimeText = averageHoldTime > 30 
        ? "Long-term holder (>30 days)" 
        : averageHoldTime > 15 
          ? "Medium-term holder (15-30 days)" 
          : "Short-term holder (<15 days)";
          
      const volatilityText = volatility < 10 
        ? "Low volatility (<10%)" 
        : volatility < 20 
          ? "Moderate volatility (10-20%)" 
          : "High volatility (>20%)";
          
      return {
        holdTimeScore: Math.round(holdTimeScore),
        volatilityScore: Math.round(volatilityScore),
        holdTimeText,
        volatilityText,
        holdTimeValue: Math.round(averageHoldTime * 10) / 10,
        volatilityValue: Math.round(volatility * 10) / 10,
        hasData: true
      };
    } catch (error) {
      console.error("Error calculating retention metrics:", error);
      return defaultMetrics;
    }
  }, [transactions, tokenBalances, majorTokens]);

  const totalScore = metrics.holdTimeScore + metrics.volatilityScore;

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 50) return "text-emerald-400";
    if (percentage >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  // Function to extract unique token names from transactions
  const getTokenNames = () => {
    if (!transactions || transactions.length === 0) return "None";
    
    const tokenSet = new Set<string>();
    transactions.forEach(tx => {
      if (tx.currency) {
        tokenSet.add(tx.currency);
      } else if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        const symbol = tx.tokenTransfers[0].tokenSymbol || tx.tokenTransfers[0].mint;
        if (symbol) tokenSet.add(symbol);
      } else if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        tokenSet.add("SOL");
      }
    });
    
    return Array.from(tokenSet).join(", ") || "SOL";
  };

  return (
    <Card data-component="RetentionBehavior">
      <CardHeader>
        <CardTitle>Retention Behavior</CardTitle>
        <CardDescription>Analysis of token holding patterns and balance volatility</CardDescription>
      </CardHeader>
      <CardContent>
        {metrics.hasData ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention Score</span>
                <span className={`text-lg font-bold ${getScoreColor(totalScore, 100)}`}>{totalScore}</span>
              </div>
              <Progress value={totalScore} className="h-2" data-score={totalScore} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Hold Time</span>
                </div>
                <p className="text-xl font-bold">
                  <strong>{metrics.holdTimeValue} days</strong>
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className={`text-xs font-semibold ${getScoreColor(metrics.holdTimeScore, 50)}`}>
                    {metrics.holdTimeScore}/50
                  </span>
                </div>
                <Progress value={(metrics.holdTimeScore / 50) * 100} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">{metrics.holdTimeText}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-500">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Balance Volatility</span>
                </div>
                <p className="text-xl font-bold">
                  <strong>{metrics.volatilityValue}%</strong>
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className={`text-xs font-semibold ${getScoreColor(metrics.volatilityScore, 50)}`}>
                    {metrics.volatilityScore}/50
                  </span>
                </div>
                <Progress value={(metrics.volatilityScore / 50) * 100} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">{metrics.volatilityText}</p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Tokens Analyzed:</strong> {getTokenNames()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                High median hold time (&gt; 30 days) → Score +50<br />
                Low volatility (&lt; 10%) → Score +50
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transaction data detected in API results.</p>
            <p className="text-sm text-muted-foreground mt-2">Please try fetching more transactions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RetentionBehavior;
