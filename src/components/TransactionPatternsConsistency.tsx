import React from "react";
import { Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: string | number;
  currency?: string;
  fee?: number;
};

type Props = {
  transactions: Transaction[];
  currentBalance: number;
};

function computeWeeklyActivity(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) return 0;
  
  // Use timestamps, prefer blockTime
  const timestamps = transactions.map(
    t => t.timestamp || t.blockTime || 0
  ).filter(Boolean).sort();
  
  const now = Date.now() / 1000;
  const minTime = Math.min(...timestamps, now);
  const maxTime = Math.max(...timestamps, now);
  const days = Math.max(1, (maxTime - minTime) / (60 * 60 * 24));
  
  // Limit to last 90 days max for better weekly avg window
  const lastNDays = Math.min(90, days);
  const cutoff = now - lastNDays * 24 * 60 * 60;
  const recentTxs = transactions.filter(
    t => (t.timestamp || t.blockTime || 0) >= cutoff
  );
  
  // Calculate weekly average
  const weeks = Math.max(1, lastNDays / 7);
  const avgPerWeek = recentTxs.length / weeks;
  
  return avgPerWeek;
}

function calculateSafetyBuffer(transactions: Transaction[]): number {
  // Base fee per transaction in LAMPORTS (0.000005 SOL)
  const baseFeePerTx = 5000;
  
  // Calculate the average transaction fee used in the wallet's history if available
  let actualAvgFeePerTx = baseFeePerTx;
  
  // If we have transactions with fees, calculate the average
  const txsWithFees = transactions.filter(tx => tx.fee || tx.fee === 0);
  if (txsWithFees.length > 0) {
    const totalFees = txsWithFees.reduce((sum, tx) => sum + (tx.fee || 0), 0);
    actualAvgFeePerTx = Math.max(baseFeePerTx, Math.ceil(totalFees / txsWithFees.length));
    console.log(`Calculated actual average fee from ${txsWithFees.length} transactions: ${actualAvgFeePerTx} lamports`);
  }
  
  // Calculate safety margin based on transaction volume and fees
  // Higher volume wallets need more buffer
  const avgWeekly = computeWeeklyActivity(transactions);
  
  // Base safety margin in LAMPORTS (0.001 SOL)
  let safetyMargin = 1000000; 
  
  // Scale safety margin with activity level
  if (avgWeekly >= 20) {
    safetyMargin = 2000000; // 0.002 SOL for very active wallets
  } else if (avgWeekly >= 10) {
    safetyMargin = 1500000; // 0.0015 SOL for moderately active wallets
  }
  
  // Calculate buffer in LAMPORTS
  const bufferInLamports = actualAvgFeePerTx + safetyMargin;
  
  // Convert to SOL (1 SOL = 1,000,000,000 LAMPORTS)
  const bufferInSol = bufferInLamports / 1000000000;
  
  console.log(`Calculated safety buffer for this wallet: ${bufferInSol} SOL (${bufferInLamports} lamports)`);
  
  return bufferInSol;
}

function getMinBalance(transactions: Transaction[], currentBalance: number) {
  // Handle empty transactions
  if (!transactions || transactions.length === 0) return currentBalance;
  
  console.log(`Calculating minimum balance from ${transactions.length} transactions with current balance ${currentBalance}`);
  
  // Filter for SOL transactions only
  const solTransactions = transactions.filter(tx => 
    !tx.currency || tx.currency.toUpperCase() === 'SOL'
  );
  
  console.log(`Found ${solTransactions.length} SOL transactions for min balance calculation`);
  
  // Sort transactions by timestamp (newest first)
  const sortedTx = [...solTransactions].sort((a, b) => {
    const timestampA = a.timestamp || a.blockTime || 0;
    const timestampB = b.timestamp || b.blockTime || 0;
    return timestampB - timestampA;
  });
  
  // Simulate running balance from the latest to oldest
  let runningBalance = currentBalance || 0;
  let minBalance = currentBalance || 0;
  let balances: {timestamp: number, balance: number, txSignature: string}[] = [];
  
  console.log(`Starting balance simulation from current balance: ${runningBalance}`);
  
  for (const tx of sortedTx) {
    const amount = typeof tx.amount === 'string' ? 
      parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
      (typeof tx.amount === 'number' ? tx.amount : 0);
    
    if (!isNaN(amount)) {
      // For inflows (positive amounts) we subtract when going backwards in time
      // For outflows (negative amounts) we add when going backwards in time
      runningBalance -= amount;
      
      console.log(`Transaction ${tx.signature?.substring(0, 6) || 'unknown'} with amount ${amount}, new balance: ${runningBalance}`);
      
      // Track all historical balances
      balances.push({
        timestamp: tx.timestamp || tx.blockTime || 0,
        balance: runningBalance,
        txSignature: tx.signature || 'unknown'
      });
      
      minBalance = Math.min(minBalance, runningBalance);
    }
  }
  
  console.log(`Final minimum balance from historical simulation: ${minBalance}`);
  
  // Check all balances to find the true minimum
  if (balances.length > 0) {
    balances.sort((a, b) => a.balance - b.balance);
    const lowestBalanceRecord = balances[0];
    console.log(`Lowest balance found: ${lowestBalanceRecord.balance} from transaction ${lowestBalanceRecord.txSignature.substring(0, 6)}`);
  }
  
  return minBalance;
}

function getScore({
  avgWeeklyTx,
  minSolBuffer,
  calculatedBuffer
}: {
  avgWeeklyTx: number;
  minSolBuffer: number;
  calculatedBuffer: number;
}): number {
  // Generate score based on weekly transaction volume and SOL buffer
  // Use calculated buffer as reference
  if (avgWeeklyTx >= 15 && minSolBuffer >= calculatedBuffer * 10) return 95;
  if (avgWeeklyTx >= 10 && minSolBuffer >= calculatedBuffer * 5) return 90;
  if (avgWeeklyTx >= 10 && minSolBuffer >= calculatedBuffer) return 85;
  if (avgWeeklyTx >= 7 && minSolBuffer >= calculatedBuffer * 2.5) return 80;
  if (avgWeeklyTx >= 5 && minSolBuffer >= calculatedBuffer) return 75;
  if (avgWeeklyTx >= 5 && minSolBuffer >= calculatedBuffer * 0.5) return 70;
  if (avgWeeklyTx >= 3 && minSolBuffer >= calculatedBuffer) return 65;
  if (avgWeeklyTx >= 3 && minSolBuffer >= 0) return 60;
  if (avgWeeklyTx >= 1 && minSolBuffer >= calculatedBuffer * 0.5) return 55;
  if (avgWeeklyTx >= 1 && minSolBuffer >= 0) return 50;
  if (avgWeeklyTx > 0.5 && minSolBuffer >= 0) return 40;
  if (avgWeeklyTx > 0.1) return 30;
  
  // Very low activity
  return Math.max(20, Math.round(avgWeeklyTx * 100) + Math.round(minSolBuffer / calculatedBuffer * 20));
}

const TransactionPatternsConsistency: React.FC<Props> = ({
  transactions,
  currentBalance
}) => {
  const avgWeeklyTx = computeWeeklyActivity(transactions);
  
  // Calculate the buffer based on this specific wallet's transaction history
  const calculatedBuffer = calculateSafetyBuffer(transactions);
  
  // Only include SOL transactions in minimum balance calculation
  const solTransactions = transactions.filter(tx => 
    !tx.currency || tx.currency.toUpperCase() === 'SOL'
  );
  
  const minSolBuffer = getMinBalance(solTransactions, currentBalance);

  const score = getScore({
    avgWeeklyTx,
    minSolBuffer,
    calculatedBuffer
  });

  console.log("TransactionPatternsConsistency Metrics:", { 
    avgWeeklyTx, 
    minSolBuffer,
    currentBalance,
    calculatedBuffer,
    score,
    transactionsCount: transactions.length,
    solTransactionsCount: solTransactions.length
  });

  return (
    <div className="border rounded-lg p-4 bg-muted shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="inline-block h-5 w-5 mr-1" />Transaction Patterns & Consistency
        </h4>
        <span className={`inline-block rounded px-3 py-1 text-sm font-bold ${score >= 90
            ? "bg-green-200 text-green-800"
            : score >= 70
              ? "bg-yellow-200 text-yellow-800"
              : score >= 40
                ? "bg-orange-200 text-orange-900"
                : "bg-red-200 text-red-800"
          }`}>
          Score: {score} / 100
        </span>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
            <TrendingUp className="inline-block h-4 w-4" />
            Avg. Weekly Tx Count
          </dt>
          <dd className="text-lg font-bold">{avgWeeklyTx.toFixed(1)} / week</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
            <DollarSign className="inline-block h-4 w-4" />
            SOL Fee Safety Buffer
          </dt>
          <dd className="text-lg font-bold">
            {calculatedBuffer.toFixed(6)} SOL
            <span className="text-xs text-muted-foreground ml-2">
              (Based on transaction history)
            </span>
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
            <DollarSign className="inline-block h-4 w-4" />
            Lowest Observed Balance
          </dt>
          <dd className="text-lg font-bold">
            {minSolBuffer.toFixed(4)} SOL
            <span className={`text-xs ml-2 ${minSolBuffer >= calculatedBuffer * 5 ? "text-green-600" : minSolBuffer >= calculatedBuffer ? "text-green-600" : minSolBuffer >= calculatedBuffer * 0.5 ? "text-amber-600" : "text-red-600"}`}>
              {minSolBuffer >= calculatedBuffer * 5 
                ? "(Well above buffer - Excellent)" 
                : minSolBuffer >= calculatedBuffer 
                  ? "(Above buffer - Good)" 
                  : minSolBuffer >= calculatedBuffer * 0.5 
                    ? "(Below recommended buffer - Caution)" 
                    : "(Well below buffer - Risk)"
              }
            </span>
          </dd>
        </div>
      </dl>
      <div className="mt-2 text-sm text-muted-foreground">
        <p className="mb-1">Buffer calculation: Average Fee ({(calculatedBuffer * 1000000000 - 1000000).toFixed(0)} lamports) + Safety Margin (1,000,000 lamports) = {calculatedBuffer.toFixed(6)} SOL</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>10+ tx/week + balance &gt; 5x buffer: 90–100</li>
          <li>5–10 tx/week, balance &gt; 1x buffer: 70–89</li>
          <li>1–5 tx/week or balance &lt; buffer: 40–69</li>
          <li>Irregular use/frequently below buffer: 0–39</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionPatternsConsistency;
