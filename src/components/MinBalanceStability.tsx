
import React from "react";
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CreditCard, TrendingUp, CircleDollarSign } from "lucide-react";

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
      return { score: 0, minBalance: 0, avgBalance: 0, balanceHistory: [] };
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
    
    // Calculate score based on minimum balance stability
    // Higher score for higher minimum balance relative to average
    const minToAvgRatio = avgBalance > 0 ? minBalance / avgBalance : 0;
    
    let score = 0;
    if (minToAvgRatio >= 0.9) score = 95; // Very stable, minimum very close to average
    else if (minToAvgRatio >= 0.75) score = 85;
    else if (minToAvgRatio >= 0.5) score = 75;
    else if (minToAvgRatio >= 0.25) score = 60;
    else if (minToAvgRatio >= 0.1) score = 40;
    else if (minToAvgRatio > 0) score = 30;
    else score = 20; // Minimum went to zero or negative
    
    // Boost score if current balance is significantly higher than minimum
    const growthRatio = minBalance > 0 ? currentBalance / minBalance : 0;
    if (growthRatio >= 5) score = Math.min(score + 15, 100);
    else if (growthRatio >= 2) score = Math.min(score + 10, 100);
    else if (growthRatio >= 1.5) score = Math.min(score + 5, 100);
    
    return {
      score,
      minBalance,
      avgBalance,
      balanceHistory: balanceHistory.slice(-10) // Just use last 10 points for chart
    };
  };
  
  const { score, minBalance, avgBalance, balanceHistory } = calculateMetrics();
  
  // Format for display
  const formattedMin = minBalance.toFixed(4);
  const formattedAvg = avgBalance.toFixed(4);
  const formattedCurrent = currentBalance.toFixed(4);
  
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
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>Higher scores are awarded for maintaining consistent minimum balances without dipping too low.</p>
      </div>
    </div>
  );
};

export default MinBalanceStability;
