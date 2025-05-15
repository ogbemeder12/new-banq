import React from "react";
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CreditCard, TrendingUp, CircleDollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

const MinBalanceStability: React.FC<Props> = ({ transactions, currentBalance }) => {
  // Calculate metrics based on transactions
  const calculateMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return { score: 0, minBalance: 0, avgBalance: 0, minBalanceRatio: 0, balanceHistory: [] };
    }
    
    // Sort transactions by timestamp
    const sortedTxs = [...transactions].sort((a, b) => {
      const timeA = a.timestamp || a.blockTime || 0;
      const timeB = b.timestamp || b.blockTime || 0;
      return timeA - timeB; // Oldest first
    });
    
    let runningBalance = currentBalance;
    let minBalance = currentBalance;
    let totalBalance = currentBalance;
    let dataPoints = 1;
    
    // Generate balance history by "reversing" transactions
    const balanceHistory = sortedTxs.map(tx => {
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      // For history, we need to reverse transactions to calculate previous balance
      if (!isNaN(amount)) {
        if (amount < 0) {
          // If outgoing, add back to calculate previous balance
          runningBalance -= Math.abs(amount);
        } else if (amount > 0) {
          // If incoming, subtract to calculate previous balance
          runningBalance += amount;
        }
      }
      
      // Track minimum balance
      if (runningBalance < minBalance) {
        minBalance = runningBalance;
      }
      
      // Track for average calculation
      totalBalance += runningBalance;
      dataPoints++;
      
      // Return data point for charting
      return { 
        time: tx.timestamp || tx.blockTime || 0, 
        balance: Math.max(0, runningBalance) // Prevent negative for display
      };
    }).reverse(); // Reverse again so most recent is last
    
    // Calculate average balance
    const avgBalance = dataPoints > 0 ? totalBalance / dataPoints : 0;
    
    // Calculate minimum balance ratio
    // Metric: Average Daily Minimum Balance / Total Wallet Value
    const minBalanceRatio = avgBalance > 0 ? minBalance / avgBalance : 0;
    
    // Calculate score based on new algorithm:
    // 50% → Score 90–100
    // 30–50% → Score 70–89
    // 10–30% → Score 40–69
    // < 10% → Score 0–39
    let score = 0;
    
    if (minBalanceRatio >= 0.5) {
      // 50% → Score 90–100
      score = 90 + Math.min(10, Math.floor((minBalanceRatio - 0.5) * 100));
    } else if (minBalanceRatio >= 0.3) {
      // 30–50% → Score 70–89
      score = 70 + Math.min(19, Math.floor((minBalanceRatio - 0.3) * 100));
    } else if (minBalanceRatio >= 0.1) {
      // 10–30% → Score 40–69
      score = 40 + Math.min(29, Math.floor((minBalanceRatio - 0.1) * 150));
    } else {
      // < 10% → Score 0–39
      score = Math.min(39, Math.floor(minBalanceRatio * 390));
    }
    
    // Ensure score is in valid range
    score = Math.round(Math.min(100, Math.max(0, score)));
    
    return {
      score,
      minBalance,
      avgBalance,
      minBalanceRatio,
      balanceHistory: balanceHistory.slice(-10) // Just use last 10 points for chart
    };
  };
  
  const { score, minBalance, avgBalance, minBalanceRatio, balanceHistory } = calculateMetrics();
  
  // Format for display
  const formattedMin = minBalance.toFixed(4);
  const formattedAvg = avgBalance.toFixed(4);
  const formattedCurrent = currentBalance.toFixed(4);
  const formattedRatio = (minBalanceRatio * 100).toFixed(1);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow text-xs">
          <p>Balance: {payload[0].value.toFixed(4)} SOL</p>
        </div>
      );
    }
    return null;
  };

  // Get category based on min balance ratio
  const getBalanceCategory = () => {
    if (minBalanceRatio >= 0.5) return "Excellent stability (≥50%)";
    if (minBalanceRatio >= 0.3) return "Good stability (30-50%)";
    if (minBalanceRatio >= 0.1) return "Moderate stability (10-30%)";
    return "Low stability (<10%)";
  };

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="MinBalanceStability">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5" />
          Minimum Balance Stability
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
      
      <div className="h-32 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={balanceHistory}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#9333ea" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }} 
            />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="p-2">
          <p className="text-xs text-muted-foreground">Minimum</p>
          <p className="font-bold">{formattedMin}</p>
        </div>
        <div className="p-2">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className="font-bold">{formattedAvg}</p>
        </div>
        <div className="p-2">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="font-bold">{formattedCurrent}</p>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Minimum/Average Ratio:</span>
          <span className="text-xs font-medium">{formattedRatio}%</span>
        </div>
        <div className="mt-1">
          <Progress value={minBalanceRatio * 100} className="h-1" />
        </div>
        <div className="text-xs text-right mt-1 font-medium">{getBalanceCategory()}</div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>Score based on Min Balance / Avg Balance ratio:</p>
        <p>≥50%: 90-100 | 30-50%: 70-89 | 10-30%: 40-69 | &lt;10%: 0-39</p>
      </div>
    </div>
  );
};

export default MinBalanceStability;
