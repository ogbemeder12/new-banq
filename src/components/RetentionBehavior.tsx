
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

      // Single transaction case - handle differently
      if (normalizedTransactions.length === 1) {
        const singleTx = normalizedTransactions[0];
        console.log("Single transaction detected - calculating retention based on time since transaction");
        
        // Calculate hold time from the single transaction to now
        const now = Math.floor(Date.now() / 1000);
        const txTime = singleTx.timestamp;
        const holdTimeInDays = (now - txTime) / 86400; // Convert seconds to days
        
        // Ensure minimum hold time is 1 day (avoid division by zero issues)
        const effectiveHoldTime = Math.max(1, holdTimeInDays);
        console.log(`Hold time from single transaction: ${effectiveHoldTime.toFixed(2)} days`);
        
        // For single transactions, assign reasonable scores based on hold time
        // Hold time score: 0-50 points based on hold time (max at 30 days)
        const holdTimeScore = Math.min(50, (effectiveHoldTime / 30) * 50);
        
        // Volatility can't be calculated with single transaction, assign reasonable default
        const volatilityScore = 25; // Middle ground for volatility
        
        // Format text descriptions
        const holdTimeText = effectiveHoldTime > 30 
          ? "Long-term holder" 
          : effectiveHoldTime > 7 
            ? "Medium-term holder" 
            : "Recent holder";
          
        return {
          holdTimeScore: Math.round(holdTimeScore),
          volatilityScore: volatilityScore,
          holdTimeText: holdTimeText,
          volatilityText: "Volatility calculation limited",
          holdTimeValue: Math.round(effectiveHoldTime * 10) / 10,
          volatilityValue: 20, // Default volatility value
          hasData: true
        };
      }

      // Multiple transactions - proceed with normal calculations
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
      
      // Calculate hold time based on transaction history
      const now = Math.floor(Date.now() / 1000);
      let totalHoldDays = 0;
      let tokenCount = 0;

      // Try to calculate hold time from transaction data
      const processedTokens = new Set();
      Object.entries(tokenTransactions).forEach(([token, txs]) => {
        if (txs.length > 0) {
          // Sort by timestamp (oldest first)
          const sortedTxs = txs.slice().sort((a, b) => a.timestamp - b.timestamp);
          
          // Calculate hold time from first to last transaction (or now)
          const firstTx = sortedTxs[0];
          const lastTx = sortedTxs[sortedTxs.length - 1];
          
          // Only use actual transaction timestamps
          if (firstTx.timestamp > 0) {
            // Use either the last transaction time or current time
            const endTime = Math.max(lastTx.timestamp, now - 86400); // At least 1 day old
            const holdTimeInDays = (endTime - firstTx.timestamp) / 86400;
            
            if (holdTimeInDays > 0) {
              totalHoldDays += holdTimeInDays;
              tokenCount++;
              processedTokens.add(token);
              console.log(`${token} hold time: ${holdTimeInDays.toFixed(2)} days`);
            }
          }
        }
      });
      
      // If no specific token hold times, use overall transaction range
      if (tokenCount === 0 && normalizedTransactions.length > 1) {
        const timestamps = normalizedTransactions
          .map(tx => tx.timestamp)
          .filter(t => t > 0)
          .sort((a, b) => a - b);
        
        if (timestamps.length > 1) {
          const firstTx = timestamps[0];
          const lastTx = timestamps[timestamps.length - 1];
          const holdTimeInDays = (lastTx - firstTx) / 86400;
          
          if (holdTimeInDays > 0) {
            totalHoldDays = holdTimeInDays;
            tokenCount = 1;
            console.log(`Using transaction timestamp range for hold time: ${holdTimeInDays.toFixed(2)} days`);
          } else {
            // If time span is too small, use first transaction to now
            const holdTimeInDays = (now - firstTx) / 86400;
            if (holdTimeInDays > 0) {
              totalHoldDays = holdTimeInDays;
              tokenCount = 1;
              console.log(`Using first transaction to now for hold time: ${holdTimeInDays.toFixed(2)} days`);
            }
          }
        } else if (timestamps.length === 1) {
          // If we only have one timestamp, calculate from that time to now
          const holdTimeInDays = (now - timestamps[0]) / 86400;
          if (holdTimeInDays > 0) {
            totalHoldDays = holdTimeInDays;
            tokenCount = 1;
            console.log(`Using single transaction to now for hold time: ${holdTimeInDays.toFixed(2)} days`);
          }
        }
      }

      // Ensure we have valid data
      if (tokenCount === 0) {
        // Even with no calculated hold time, we'll provide a base score since we have transactions
        console.log("No valid hold time data found, using base scores");
        
        // Find the earliest transaction to estimate hold time
        const timestamps = normalizedTransactions.map(tx => tx.timestamp).sort((a, b) => a - b);
        const firstTimestamp = timestamps[0];
        const holdTimeInDays = Math.max(1, (now - firstTimestamp) / 86400);
        
        return {
          holdTimeScore: Math.min(30, Math.round((holdTimeInDays / 30) * 30)),
          volatilityScore: 15,
          holdTimeText: "Recent activity detected",
          volatilityText: "Limited volatility data",
          holdTimeValue: Math.round(holdTimeInDays * 10) / 10, // Round to 1 decimal
          volatilityValue: 0,
          hasData: true
        };
      }

      // Calculate average hold time
      const averageHoldTime = totalHoldDays / tokenCount;
      console.log(`Average hold time across ${tokenCount} tokens: ${averageHoldTime.toFixed(2)} days`);
      
      // Calculate volatility based on transaction patterns
      // Extract daily changes in balances
      const balanceChanges: number[] = [];
      
      // Group transactions by day
      const txsByDay: Record<string, Array<{amount: number, currency: string}>> = {};
      normalizedTransactions.forEach(tx => {
        if (tx.timestamp > 0) {
          const day = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
          if (!txsByDay[day]) txsByDay[day] = [];
          txsByDay[day].push({
            amount: tx.amount,
            currency: tx.currency
          });
        }
      });
      
      // Calculate net change by day
      const sortedDays = Object.keys(txsByDay).sort();
      for (let i = 1; i < sortedDays.length; i++) {
        const prevDayTxs = txsByDay[sortedDays[i-1]];
        const currDayTxs = txsByDay[sortedDays[i]];
        
        const prevDayTotal = prevDayTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const currDayTotal = currDayTxs.reduce((sum, tx) => sum + tx.amount, 0);
        
        if (prevDayTotal !== 0) {
          const changePercent = Math.abs((currDayTotal - prevDayTotal) / prevDayTotal) * 100;
          balanceChanges.push(changePercent);
        }
      }
      
      // Calculate volatility (average daily change) or use fallback
      let volatility = 20; // Default volatility
      const hasVolatilityData = balanceChanges.length > 0;
      
      if (hasVolatilityData) {
        volatility = balanceChanges.reduce((sum, change) => sum + change, 0) / balanceChanges.length;
        console.log(`Calculated volatility: ${volatility.toFixed(2)}% from ${balanceChanges.length} data points`);
      } else if (normalizedTransactions.length >= 2) {
        // If we can't calculate volatility normally but have multiple transactions,
        // estimate it from transaction frequency
        const timestamps = normalizedTransactions.map(tx => tx.timestamp).sort((a, b) => a - b);
        const timeSpanDays = (timestamps[timestamps.length - 1] - timestamps[0]) / 86400;
        const transactionsPerDay = normalizedTransactions.length / Math.max(1, timeSpanDays);
        
        // Higher transaction frequency suggests higher volatility
        volatility = Math.min(50, transactionsPerDay * 10);
        console.log(`Estimated volatility from transaction frequency: ${volatility.toFixed(2)}%`);
      }
      
      // Calculate scores based on metrics
      // Hold time score: 0-50 points based on hold time (max at 30 days)
      // Ensure minimum score of 10 if we have any hold time data
      const holdTimeScore = Math.max(10, Math.min(50, (averageHoldTime / 30) * 50));
      
      // Volatility score: 0-50 points (inverse relationship - lower volatility is better)
      // Only calculate if we have volatility data
      const volatilityScore = hasVolatilityData 
        ? Math.min(50, Math.max(10, 50 - (volatility / 10) * 50))
        : Math.min(25, holdTimeScore / 2); // If no volatility data, base it partially on hold time
      
      // Format text descriptions
      const holdTimeText = averageHoldTime > 30 
        ? "Long-term holder" 
        : averageHoldTime > 7 
          ? "Medium-term holder" 
          : "Short-term holder";
          
      const volatilityText = hasVolatilityData
        ? (volatility < 10 
          ? "Low volatility" 
          : volatility < 30 
            ? "Medium volatility" 
            : "High volatility")
        : "Volatility calculation limited";
          
      return {
        holdTimeScore: Math.round(holdTimeScore),
        volatilityScore: Math.round(volatilityScore),
        holdTimeText,
        volatilityText,
        holdTimeValue: Math.round(averageHoldTime * 10) / 10,
        volatilityValue: hasVolatilityData ? Math.round(volatility * 10) / 10 : 20,
        hasData: true
      };
    } catch (error) {
      console.error("Error calculating retention metrics:", error);
      
      // Even on error, provide base scores if we have transactions
      if (transactions.length > 0) {
        // Calculate a minimal score based on the number of transactions
        const baseScore = Math.min(20, transactions.length * 5);
        
        return {
          holdTimeScore: baseScore,
          volatilityScore: baseScore / 2,
          holdTimeText: "Limited data analysis",
          volatilityText: "Limited volatility data",
          holdTimeValue: 1,
          volatilityValue: 20,
          hasData: true
        };
      }
      
      // Otherwise return no data
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
    <Card>
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
              <Progress value={totalScore} className="h-2" />
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
