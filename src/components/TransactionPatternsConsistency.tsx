
import React from "react";
import { Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: string;
  currency?: string;
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

function getMinBalance(transactions: Transaction[], currentBalance: number) {
  // Handle empty transactions
  if (!transactions || transactions.length === 0) return currentBalance;
  
  // Simulate running balance from the latest to oldest using SOL-only txs
  let balance = currentBalance || 0;
  let minBalance = currentBalance || 0;
  
  // Sort transactions by timestamp (newest first)
  const sortedTx = [...transactions].sort((a, b) => 
    ((b.timestamp || b.blockTime || 0) - (a.timestamp || a.blockTime || 0))
  );
  
  for (const tx of sortedTx) {
    if (tx.currency === "SOL" && typeof tx.amount !== "undefined") {
      const amount = parseFloat(tx.amount);
      if (!isNaN(amount)) {
        balance -= amount;
        minBalance = Math.min(minBalance, balance);
      }
    }
  }
  
  return minBalance;
}

function getScore({
  avgWeeklyTx,
  minSolBuffer
}: {
  avgWeeklyTx: number;
  minSolBuffer: number;
}): number {
  // Generate score based on weekly transaction volume and SOL buffer
  if (avgWeeklyTx >= 15 && minSolBuffer >= 1) return 95;
  if (avgWeeklyTx >= 10 && minSolBuffer >= 0.5) return 90;
  if (avgWeeklyTx >= 10 && minSolBuffer >= 0.1) return 85;
  if (avgWeeklyTx >= 7 && minSolBuffer >= 0.25) return 80;
  if (avgWeeklyTx >= 5 && minSolBuffer >= 0.1) return 75;
  if (avgWeeklyTx >= 5 && minSolBuffer >= 0.05) return 70;
  if (avgWeeklyTx >= 3 && minSolBuffer >= 0.1) return 65;
  if (avgWeeklyTx >= 3 && minSolBuffer >= 0) return 60;
  if (avgWeeklyTx >= 1 && minSolBuffer >= 0.05) return 55;
  if (avgWeeklyTx >= 1 && minSolBuffer >= 0) return 50;
  if (avgWeeklyTx > 0.5 && minSolBuffer >= 0) return 40;
  if (avgWeeklyTx > 0.1) return 30;
  
  // Very low activity
  return Math.max(20, Math.round(avgWeeklyTx * 100) + Math.round(minSolBuffer * 20));
}

const TransactionPatternsConsistency: React.FC<Props> = ({
  transactions,
  currentBalance
}) => {
  const avgWeeklyTx = computeWeeklyActivity(transactions);
  const minSolBuffer = getMinBalance(
    transactions.filter(t => t.currency === "SOL"),
    currentBalance
  );

  const score = getScore({
    avgWeeklyTx,
    minSolBuffer
  });

  console.log("TransactionPatternsConsistency Metrics:", { 
    avgWeeklyTx, 
    minSolBuffer,
    currentBalance,
    score,
    transactionsCount: transactions.length 
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
            Lowest SOL Fee Buffer
          </dt>
          <dd className="text-lg font-bold">
            {minSolBuffer.toFixed(4)} SOL
            <span className="text-xs text-muted-foreground ml-2">
              (min observed)
            </span>
          </dd>
        </div>
      </dl>
      <div className="mt-2 text-sm text-muted-foreground">
        {/* Scoring notes */}
        <ul className="list-disc pl-5 space-y-1">
          <li>10 tx/week + always &gt; 0.1 SOL buffer: 90–100</li>
          <li>5–10 tx/week, buffer maintained: 70–89</li>
          <li>1–5 tx/week, sometimes dry: 40–69</li>
          <li>Irregular use/dry spells: 0–39</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionPatternsConsistency;
