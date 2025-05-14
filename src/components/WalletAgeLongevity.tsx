
import React from "react";
import { Clock, Calendar, TrendingUp } from "lucide-react";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
};

type Props = {
  transactions: Transaction[];
};

function calculateWalletMetrics(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) {
    return { walletAge: 0, firstTxAge: 0, activePercent: 0 };
  }

  // Sort transactions by timestamp/blockTime
  const timestamps = transactions
    .map(tx => tx.timestamp || tx.blockTime || 0)
    .filter(Boolean)
    .sort();

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const firstTx = Math.min(...timestamps);
  const lastTx = Math.max(...timestamps);

  // Calculate wallet age in days
  const walletAgeDays = (now - firstTx) / (24 * 60 * 60);
  
  // Calculate first transaction age in days
  const firstTxAgeDays = walletAgeDays;

  // Calculate active periods
  const totalDays = Math.max(1, walletAgeDays); // Avoid division by zero
  
  // Count unique days with activity
  const uniqueDays = new Set(
    timestamps.map(ts => Math.floor(ts / (24 * 60 * 60)))
  ).size;
  
  // Calculate active percentage (days with activity / total days)
  const activePercent = Math.min(100, (uniqueDays / totalDays) * 100);

  return {
    walletAge: walletAgeDays,
    firstTxAge: firstTxAgeDays,
    activePercent
  };
}

function getScore({
  walletAgeDays,
  activePercent
}: {
  walletAgeDays: number;
  activePercent: number;
}): number {
  const yearInDays = 365;
  const sixMonthsInDays = 182;
  const threeMonthsInDays = 91;

  // Calculate score based on Algorithm #8: Wallet Age & Longevity
  // Scoring according to specified algorithm:
  // 1 year old, active >70% of time: 90–100
  // 6–12 months, active >50% of time: 70–89
  // 3–6 months, moderate use: 40–69
  // <3 months or barely used: 0–39
  
  if (walletAgeDays >= yearInDays) {
    if (activePercent > 70) return 90 + Math.min(10, (activePercent - 70) / 3);
    if (activePercent > 50) return 70 + (activePercent - 50) / 2;
    if (activePercent > 30) return 40 + (activePercent - 30) / 0.75;
    return Math.max(0, 30 + activePercent / 3);
  }
  
  if (walletAgeDays >= sixMonthsInDays) {
    if (activePercent > 50) return 70 + Math.min(19, (activePercent - 50) / 2.5);
    if (activePercent > 30) return 40 + (activePercent - 30) / 1.5;
    return Math.max(0, 20 + activePercent / 3);
  }
  
  if (walletAgeDays >= threeMonthsInDays) {
    if (activePercent > 50) return 50 + Math.min(19, activePercent - 50);
    if (activePercent > 30) return 40 + (activePercent - 30) / 2;
    return Math.max(0, 10 + activePercent / 3);
  }
  
  // Less than 3 months
  if (activePercent > 70) return 35 + Math.min(4, walletAgeDays / 30);
  if (activePercent > 50) return 25 + Math.min(10, walletAgeDays / 30);
  
  // Very new or rarely used wallets
  return Math.max(0, Math.min(24, (walletAgeDays / 4) + (activePercent / 5)));
}

const WalletAgeLongevity: React.FC<Props> = ({ transactions }) => {
  const { walletAge, firstTxAge, activePercent } = calculateWalletMetrics(transactions);

  const score = getScore({
    walletAgeDays: walletAge,
    activePercent
  });

  const formatDuration = (days: number): string => {
    if (days >= 365) return `${(days / 365).toFixed(1)} years`;
    if (days >= 30) return `${(days / 30).toFixed(1)} months`;
    return `${Math.round(days)} days`;
  };

  console.log("WalletAgeLongevity Metrics:", { 
    walletAge, 
    activePercent, 
    score,
    transactionsCount: transactions.length 
  });

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="WalletAge">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="inline-block h-5 w-5 mr-1" />
          Wallet Age & Longevity
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
          Score: {Math.round(score)} / 100
        </span>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
        <div>
          <dt className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
            <Calendar className="inline-block h-4 w-4" />
            Wallet Age
          </dt>
          <dd className="text-lg font-bold">{formatDuration(walletAge)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
            <Calendar className="inline-block h-4 w-4" />
            First Transaction
          </dt>
          <dd className="text-lg font-bold">{formatDuration(firstTxAge)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
            <TrendingUp className="inline-block h-4 w-4" />
            Active Period
          </dt>
          <dd className="text-lg font-bold">
            {activePercent.toFixed(1)}%
            <span className="text-xs text-muted-foreground ml-2">
              of lifetime
            </span>
          </dd>
        </div>
      </dl>
      <div className="mt-2 text-sm text-muted-foreground">
        <ul className="list-disc pl-5 space-y-1">
          <li>1 year+, active &gt;70% of time: 90–100</li>
          <li>6–12 months, active &gt;50% of time: 70–89</li>
          <li>3–6 months, moderate use: 40–69</li>
          <li>&lt;3 months or barely used: 0–39</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletAgeLongevity;
