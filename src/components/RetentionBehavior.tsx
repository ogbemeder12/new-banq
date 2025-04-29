
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingDown } from "lucide-react";

interface RetentionBehaviorProps {
  transactions: any[];
  tokenBalances?: any[];
}

const RetentionBehavior = ({ transactions, tokenBalances = [] }: RetentionBehaviorProps) => {
  const majorTokens = ["USDT", "USDC", "SOL"]; // Major tokens to track

  // Calculate metrics based on transactions
  const metrics = useMemo(() => {
    // Default metrics if we don't have enough data
    const defaultMetrics = {
      holdTimeScore: 0,
      volatilityScore: 0,
      holdTimeText: "Insufficient data",
      volatilityText: "Insufficient data",
      holdTimeValue: 0,
      volatilityValue: 0,
      hasData: false
    };

    if (!transactions || transactions.length < 2) {
      console.log("Insufficient transaction data for retention metrics");
      return defaultMetrics;
    }

    try {
      console.log(`Calculating retention metrics based on ${transactions.length} transactions`);
      
      // Filter out transactions with invalid amounts
      const validTransactions = transactions.filter(tx => {
        // Parse the amount regardless of whether it's a string or number
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);
          
        // Check if the transaction has a valid amount and timestamp
        const isValid = !isNaN(amount) && Math.abs(amount) > 0 && tx.timestamp;
        
        if (isValid) {
          console.log(`Valid transaction: ${tx.signature?.substring(0, 6) || 'unknown'} - ${amount} ${tx.currency || 'unknown'}`);
        }
        
        return isValid;
      });
      
      if (validTransactions.length < 2) {
        console.log("Not enough valid transactions for retention analysis");
        console.log("Valid transactions:", validTransactions.map(tx => ({ 
          sig: tx.signature?.substring(0, 6), 
          amount: tx.amount,
          currency: tx.currency
        })));
        return defaultMetrics;
      }
      
      console.log(`Found ${validTransactions.length} valid transactions for retention analysis`);
      
      // Group transactions by token
      const tokenTransactions = validTransactions.reduce((acc: Record<string, any[]>, tx: any) => {
        // Get amount and ensure it's a number
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);

        if (isNaN(amount) || amount === 0) return acc;

        // Normalize currency to uppercase and default to SOL if not specified
        const currency = (tx.currency || 'SOL').toUpperCase();
        if (!acc[currency]) acc[currency] = [];
        
        acc[currency].push({
          timestamp: tx.timestamp,
          amount: amount
        });
        
        return acc;
      }, {});

      console.log("Grouped transactions by token:", Object.keys(tokenTransactions));
      
      // Calculate hold time for major tokens
      let totalHoldDays = 0;
      let tokenCount = 0;

      majorTokens.forEach(token => {
        if (tokenTransactions[token] && tokenTransactions[token].length > 1) {
          // Sort transactions by timestamp (oldest first)
          const txs = [...tokenTransactions[token]].sort((a, b) => a.timestamp - b.timestamp);
          
          // Find first acquisition and most recent tx
          const firstAcquisition = txs[0];
          const lastTx = txs[txs.length - 1];
          
          // Calculate hold time in days
          const holdTimeInSeconds = lastTx.timestamp - firstAcquisition.timestamp;
          const holdTimeInDays = holdTimeInSeconds / 86400; // Convert seconds to days
          
          console.log(`${token} hold time: ${holdTimeInDays.toFixed(2)} days`);
          
          if (holdTimeInDays > 0) {
            totalHoldDays += holdTimeInDays;
            tokenCount++;
          }
        } else {
          console.log(`Insufficient data for ${token} hold time calculation`);
        }
      });

      // If we don't have valid hold time data, return default metrics
      if (tokenCount === 0) {
        console.log("No valid hold time data found");
        return defaultMetrics;
      }

      // Calculate median hold time
      const medianHoldTime = tokenCount > 0 ? totalHoldDays / tokenCount : 0;
      console.log(`Median hold time across ${tokenCount} tokens: ${medianHoldTime.toFixed(2)} days`);
      
      // Calculate volatility (standard deviation of daily balance changes)
      // Group transactions by day to calculate daily balances
      const dailyBalances: Record<string, number> = {};
      let currentBalance = 0;
      
      // Sort all transactions by timestamp
      const sortedTxs = [...validTransactions]
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate running balance and store daily values
      sortedTxs.forEach(tx => {
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);
          
        if (!isNaN(amount)) {
          currentBalance += amount;
          
          // Convert timestamp to date string
          const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
          dailyBalances[date] = currentBalance;
        }
      });
      
      console.log(`Generated daily balances for ${Object.keys(dailyBalances).length} days`);
      
      // Calculate daily changes in percentage
      const dailyChanges: number[] = [];
      let previousBalance = Object.values(dailyBalances)[0] || 0;
      
      Object.values(dailyBalances).slice(1).forEach(balance => {
        if (previousBalance !== 0) {
          const changePercent = Math.abs((balance - previousBalance) / previousBalance) * 100;
          dailyChanges.push(changePercent);
        }
        previousBalance = balance;
      });
      
      // Calculate volatility (mean of absolute daily changes)
      const volatility = dailyChanges.length > 0 
        ? dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length 
        : 0;

      console.log(`Calculated volatility: ${volatility.toFixed(2)}% from ${dailyChanges.length} daily changes`);
      
      // Calculate scores based on metrics
      // Hold time score: 0-50 points, linear scale from 0-30 days
      const holdTimeScore = Math.min(50, (medianHoldTime / 30) * 50);
      
      // Volatility score: 0-50 points, linear scale from 100%-0% (inverse)
      const volatilityScore = Math.min(50, Math.max(0, 50 - (volatility / 10) * 50));
      
      // Format text descriptions
      const holdTimeText = medianHoldTime > 30 
        ? "Long-term holder" 
        : medianHoldTime > 7 
          ? "Medium-term holder" 
          : "Short-term holder";
          
      const volatilityText = volatility < 10 
        ? "Low volatility" 
        : volatility < 30 
          ? "Medium volatility" 
          : "High volatility";
          
      return {
        holdTimeScore: Math.round(holdTimeScore),
        volatilityScore: Math.round(volatilityScore),
        holdTimeText,
        volatilityText,
        holdTimeValue: Math.round(medianHoldTime * 10) / 10, // Round to 1 decimal place
        volatilityValue: Math.round(volatility * 10) / 10,
        hasData: true
      };
    } catch (error) {
      console.error("Error calculating retention metrics:", error);
      return defaultMetrics;
    }
  }, [transactions]);

  const totalScore = metrics.holdTimeScore + metrics.volatilityScore;

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 50) return "text-emerald-400";
    if (percentage >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retention Behavior</CardTitle>
        <CardDescription>Analysis of token holding patterns and balance volatility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Retention Score</span>
              <span className={`text-lg font-bold ${getScoreColor(totalScore, 100)}`}>{totalScore}</span>
            </div>
            <Progress value={totalScore} className="h-2" />
            {!metrics.hasData && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Insufficient transaction data for retention analysis
              </p>
            )}
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
              <strong>Major Tokens Analyzed:</strong> {majorTokens.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              High median hold time (&gt; 30 days) → Score +50<br />
              Low volatility (&lt; 10%) → Score +50
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetentionBehavior;
