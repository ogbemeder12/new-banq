
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
      return { avgWeeklyTx: 0, score: 0, minSolBuffer: 0, calculatedBuffer: 0 };
    }
    
    // Count transactions in past week for transaction frequency
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60);
    
    const weeklyTransactions = transactions.filter(tx => {
      const txTime = tx.timestamp || tx.blockTime || 0;
      return txTime >= oneWeekAgo;
    }).length;
    
    // Calculate average tx fee from transactions
    let totalFees = 0;
    const txsWithFees = transactions.filter(tx => tx.amount !== undefined).length;
    
    if (txsWithFees > 0) {
      // Simulate fees calculation (in a real app, this would use actual fee data)
      totalFees = transactions.reduce((sum, tx) => {
        // Simplified fee calculation - in reality would be actual transaction fees
        return sum + 0.000005; // ~5000 lamports per tx as example
      }, 0);
    }
    
    const avgFee = txsWithFees > 0 ? totalFees / txsWithFees : 0;
    
    // Calculate average weekly volume
    const avgWeeklyTx = Math.round(weeklyTransactions);
    
    // Find minimum balance over transaction history
    const solTransactions = transactions.filter(tx => {
      // Filter to only include SOL transactions (not tokens)
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      return !isNaN(amount);
    });
    
    // Calculate a good buffer based on recent transaction volume and fees
    const safetyBuffer = Math.max(avgWeeklyTx * avgFee * 2, 0.002); // Minimum 0.002 SOL buffer
    
    // Simulate historical minimum balance calculation
    let minBalance = currentBalance;
    let simulatedBalance = currentBalance;
    
    console.log("Starting balance simulation from current balance:", simulatedBalance);
    
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
      
      console.log(`Transaction ${tx.signature?.substring(0, 6)} with amount ${amount}, new balance: ${simulatedBalance}`);
      
      // Track minimum balance
      if (simulatedBalance < minBalance) {
        minBalance = simulatedBalance;
      }
    });
    
    console.log("Final minimum balance from historical simulation:", minBalance);
    
    // Find when balance was lowest
    let lowestBalance = currentBalance;
    let lowestBalanceTx = '';
    
    simulatedBalance = currentBalance;
    sortedTxs.forEach(tx => {
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      // Subtract amount if it was an outgoing transaction
      if (amount < 0) {
        simulatedBalance += Math.abs(amount);
      } else if (amount > 0) {
        simulatedBalance -= amount;
      }
      
      if (simulatedBalance < lowestBalance) {
        lowestBalance = simulatedBalance;
        lowestBalanceTx = tx.signature || '';
      }
    });
    
    console.log("Lowest balance found:", lowestBalance, "from transaction", lowestBalanceTx?.substring(0, 6));
    
    // Calculate score based on pattern consistency and buffer amount
    let score = 50; // Default score
    
    // Factor 1: Transaction frequency consistency
    if (avgWeeklyTx >= 20) score += 20;
    else if (avgWeeklyTx >= 10) score += 15;
    else if (avgWeeklyTx >= 5) score += 10;
    else score += 5;
    
    // Factor 2: Maintain good minimum balance
    const minBalanceRatio = minBalance / Math.max(currentBalance, 0.001);
    if (minBalanceRatio > 0.9) score += 30;
    else if (minBalanceRatio > 0.7) score += 25;
    else if (minBalanceRatio > 0.5) score += 20;
    else if (minBalanceRatio > 0.3) score += 15;
    else if (minBalanceRatio > 0.1) score += 10;
    else score += 5;
    
    // Factor 3: Safety buffer amount
    if (currentBalance > safetyBuffer * 10) score += 20;
    else if (currentBalance > safetyBuffer * 5) score += 15;
    else if (currentBalance > safetyBuffer * 2) score += 10;
    else if (currentBalance > safetyBuffer) score += 5;
    
    // Cap the score at 100
    score = Math.min(score, 100);
    
    const metrics = {
      avgWeeklyTx,
      minSolBuffer: lowestBalance,
      currentBalance,
      calculatedBuffer: safetyBuffer,
      score,
      transactionsCount: transactions.length,
      solTransactionsCount: solTransactions.length
    };
    
    console.log("TransactionPatternsConsistency Metrics:", metrics);
    
    return metrics;
  };
  
  const { avgWeeklyTx, score, minSolBuffer, calculatedBuffer } = calculateMetrics();
  
  const bufferMultiple = currentBalance > 0 && calculatedBuffer > 0 ? 
    (currentBalance / calculatedBuffer).toFixed(1) + 'x' : 'N/A';
  
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
          <h5 className="text-sm font-medium text-muted-foreground">Lowest Balance</h5>
          <p className="text-xl font-bold">{minSolBuffer.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">SOL</span></p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Safety Buffer</h5>
          <p className="text-xl font-bold">{bufferMultiple} <span className="text-xs font-normal text-muted-foreground">buffer</span></p>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>Transaction consistency score is based on your activity patterns, minimum balances maintained, and safety buffers.</p>
      </div>
    </div>
  );
};

export default TransactionPatternsConsistency;
