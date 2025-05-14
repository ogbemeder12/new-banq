
import React from "react";
import { ArrowDown, ArrowUp, ClockIcon } from "lucide-react";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: number | string;
};

type Props = {
  transactions: Transaction[];
  currentBalance: number;
};

const TransactionPatternsConsistency: React.FC<Props> = ({ transactions, currentBalance }) => {
  // Calculate metrics based on transactions
  const calculateMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return { 
        avgWeeklyTx: 0, 
        score: 0, 
        minSolBuffer: 0, 
        calculatedBuffer: 0, 
        insufficientBufferTimes: 0,  // Add this missing property
        transactionsCount: 0,
        solTransactionsCount: 0
      };
    }
    
    // Count transactions in past week for transaction frequency
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60);
    
    const weeklyTransactions = transactions.filter(tx => {
      const txTime = tx.timestamp || tx.blockTime || 0;
      return txTime >= oneWeekAgo;
    }).length;
    
    // Calculate average weekly tx count
    const avgWeeklyTx = Math.round(weeklyTransactions);
    
    // Find minimum balance over transaction history
    const solTransactions = transactions.filter(tx => {
      // Filter to only include SOL transactions (not tokens)
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      return !isNaN(amount);
    });
    
    // Calculate if SOL buffer was ever below 0.1 SOL
    let insufficientBufferTimes = 0;
    let minBuffer = currentBalance;
    let simulatedBalance = currentBalance;
    
    // Sort transactions by timestamp (recent first)
    const sortedTxs = [...solTransactions].sort((a, b) => {
      const timeA = a.timestamp || a.blockTime || 0;
      const timeB = b.timestamp || b.blockTime || 0;
      return timeB - timeA; // Most recent first
    });
    
    // Process transactions in reverse to simulate historical balance
    sortedTxs.forEach(tx => {
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      // Subtract amount if it was an outgoing transaction
      if (amount < 0) {
        simulatedBalance += Math.abs(amount); // Add back the outgoing amount
      } else if (amount > 0) {
        simulatedBalance -= amount; // Subtract incoming amount
      }
      
      // Track minimum balance
      if (simulatedBalance < minBuffer) {
        minBuffer = simulatedBalance;
      }
      
      // Check if buffer was ever below 0.1 SOL
      if (simulatedBalance < 0.1) {
        insufficientBufferTimes++;
      }
    });
    
    // Calculate a good buffer based on usage patterns
    const recommendedBuffer = Math.max(0.1, avgWeeklyTx * 0.005); // 0.005 SOL per weekly tx
    
    // Calculate score based on Algorithm #7: Transaction Patterns & Consistency
    let score = 0;
    
    // Metric A: Avg. Weekly Tx Count
    if (avgWeeklyTx >= 10) {
      score += 50;
    } else if (avgWeeklyTx >= 5) {
      score += 35;
    } else if (avgWeeklyTx >= 1) {
      score += 20;
    } else {
      score += 10;
    }
    
    // Metric B: SOL Fee Balance Maintained
    if (insufficientBufferTimes === 0 && minBuffer >= 0.1) {
      score += 50; // Always maintained good buffer
    } else if (insufficientBufferTimes <= 2 && minBuffer > 0.05) {
      score += 35; // Rarely went below threshold
    } else if (insufficientBufferTimes <= 5) {
      score += 20; // Sometimes out of gas
    } else {
      score += 10; // Frequent dry spells
    }
    
    // Cap at 100
    score = Math.min(100, score);
    
    const metrics = {
      avgWeeklyTx,
      minSolBuffer: minBuffer,
      currentBalance,
      calculatedBuffer: recommendedBuffer,
      insufficientBufferTimes,
      score,
      transactionsCount: transactions.length,
      solTransactionsCount: solTransactions.length
    };
    
    console.log("TransactionPatternsConsistency Metrics:", metrics);
    
    return metrics;
  };
  
  const metrics = calculateMetrics();
  const { avgWeeklyTx, score, minSolBuffer, calculatedBuffer } = metrics;
  const insufficientBufferTimes = metrics.insufficientBufferTimes || 0;
  
  const bufferStatus = insufficientBufferTimes === 0 ? 
    "Always maintained" : 
    insufficientBufferTimes <= 2 ? 
      "Rarely insufficient" : 
      insufficientBufferTimes <= 5 ?
        "Sometimes low" :
        "Frequently insufficient";
  
  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="TransactionPatterns">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Transaction Patterns & Consistency
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
          <h5 className="text-sm font-medium text-muted-foreground">Weekly Activity</h5>
          <p className="text-xl font-bold">{avgWeeklyTx} <span className="text-xs font-normal text-muted-foreground">transactions</span></p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">SOL Fee Buffer</h5>
          <p className="text-xl font-bold">{minSolBuffer.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">SOL</span></p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Buffer Status</h5>
          <p className="text-lg font-bold">{bufferStatus}</p>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <ul className="list-disc pl-5 space-y-1">
          <li>10+ tx/week, SOL fee buffer always &gt; 0.1 SOL: 90–100</li>
          <li>5–10 tx/week, buffer maintained: 70–89</li>
          <li>1–5 tx/week, sometimes out of gas: 40–69</li>
          <li>Very irregular use or SOL dry spells: 0–39</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionPatternsConsistency;
